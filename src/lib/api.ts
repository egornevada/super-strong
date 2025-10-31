/**
 * Minimal API client with Telegram initData support
 * Handles offline mode, retries, and logging
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://strong.webtga.ru/workouts/api';
const OFFLINE_CACHE_KEY = 'api_offline_cache';
const PENDING_REQUESTS_KEY = 'api_pending_requests';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl?: number; // in milliseconds, undefined = cache forever
}

interface PendingRequest {
  method: string;
  path: string;
  body?: unknown;
  timestamp: number;
}

/**
 * Get Telegram initData from WebApp API
 */
function getTelegramInitData(): string {
  const tg = (window as any)?.Telegram?.WebApp;
  return tg?.initData || '';
}

/**
 * Build full URL for API request
 */
function buildUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE}/${cleanPath}`;
}

/**
 * Get cache entry
 */
function getCache(key: string): unknown | null {
  try {
    const cache = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!cache) return null;

    const entries = JSON.parse(cache) as Record<string, CacheEntry>;
    const entry = entries[key];

    if (!entry) return null;

    // Check if cache expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      delete entries[key];
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(entries));
      return null;
    }

    return entry.data;
  } catch (e) {
    console.warn('[API] Cache read error:', e);
    return null;
  }
}

/**
 * Set cache entry
 */
function setCache(key: string, data: unknown, ttl?: number): void {
  try {
    const cache = localStorage.getItem(OFFLINE_CACHE_KEY);
    const entries = cache ? JSON.parse(cache) : {};

    entries[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };

    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('[API] Cache write error:', e);
  }
}

/**
 * Save pending request for later sync
 */
function savePendingRequest(method: string, path: string, body?: unknown): void {
  try {
    const pending = localStorage.getItem(PENDING_REQUESTS_KEY);
    const requests: PendingRequest[] = pending ? JSON.parse(pending) : [];

    requests.push({
      method,
      path,
      body,
      timestamp: Date.now()
    });

    localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
  } catch (e) {
    console.warn('[API] Pending request save error:', e);
  }
}

/**
 * Get pending requests for offline sync
 */
export function getPendingRequests(): PendingRequest[] {
  try {
    const pending = localStorage.getItem(PENDING_REQUESTS_KEY);
    return pending ? JSON.parse(pending) : [];
  } catch (e) {
    console.warn('[API] Pending request read error:', e);
    return [];
  }
}

/**
 * Clear pending requests after sync
 */
export function clearPendingRequests(): void {
  try {
    localStorage.removeItem(PENDING_REQUESTS_KEY);
  } catch (e) {
    console.warn('[API] Pending request clear error:', e);
  }
}

/**
 * Main API request function
 */
async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(init.headers || {});

  // Add Telegram initData if available
  const initData = getTelegramInitData();
  const hasInitData = !!initData;
  if (initData) {
    headers.set('x-telegram-init-data', initData);
  }

  // Set Content-Type for JSON body
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = init.method || 'GET';

  // Debug logging
  console.log(`[API] ${method} ${url}`, {
    hasInitData,
    hasBody: !!init.body,
    bodyType: typeof init.body,
    bodyPreview: init.body ? (typeof init.body === 'string' ? init.body.substring(0, 100) : 'object') : undefined
  });

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      cache: 'no-cache'
    });

    console.log(`[API] ${method} ${url} - Status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      console.error(`[API] Error ${res.status}:`, errorText);
      throw new Error(`API ${res.status}: ${errorText}`);
    }

    const data = await res.json() as T;
    console.log(`[API] ${method} ${url} - Success`, data);

    // Cache successful read requests
    if (method === 'GET') {
      setCache(path, data, 5 * 60 * 1000); // 5 min TTL for GET
    }

    return data;
  } catch (error) {
    console.error(`[API] ${method} ${url} - Failed:`, error);

    // Try to return cached data on error
    const cached = getCache(path);
    if (cached !== null) {
      console.warn(`[API] Request failed, returning cached data for ${path}`, error);
      return cached as T;
    }

    // If write request, save for later sync
    if (method !== 'GET') {
      savePendingRequest(method, path, init.body);
      console.warn(`[API] Write request saved for later sync: ${method} ${path}`);
    }

    throw error;
  }
}

/**
 * API methods
 */
export const api = {
  get<T = unknown>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
  },

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
  },

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    });
  },

  delete<T = unknown>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  }
};

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Sync pending requests when coming back online
 */
export async function syncPendingRequests(): Promise<{ synced: number; failed: number }> {
  const pending = getPendingRequests();
  let synced = 0;
  let failed = 0;

  for (const req of pending) {
    try {
      await request(req.path, {
        method: req.method,
        body: req.body ? JSON.stringify(req.body) : undefined
      });
      synced++;
    } catch (error) {
      console.error(`[API] Failed to sync ${req.method} ${req.path}:`, error);
      failed++;
    }
  }

  if (synced > 0) {
    clearPendingRequests();
  }

  return { synced, failed };
}

export default api;
