/**
 * Minimal API client with JWT token & Telegram initData support
 * Handles offline mode, retries, logging, and backend authentication
 */

// For development: use Python backend on localhost:8001
// For production: use original API
const isDev = import.meta.env.DEV;
const API_BASE = isDev
  ? 'http://localhost:8001/api/v1'  // Python FastAPI backend
  : (import.meta.env.VITE_API_URL || 'https://strong.webtga.ru/workouts/api');
const OFFLINE_CACHE_KEY = 'api_offline_cache';
const PENDING_REQUESTS_KEY = 'api_pending_requests';
const JWT_TOKEN_KEY = 'super-strong-jwt-token'; // Store JWT token from backend auth

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
    if (!pending) return [];

    const requests = JSON.parse(pending) as PendingRequest[];

    // Clean up old buggy requests from double-encoding bug
    // Any request with string body is from the old broken code
    // New code stores original objects, not stringified bodies
    const cleaned = requests.filter(req => {
      if (typeof req.body === 'string') {
        console.warn('[API] Removing old buggy pending request (has stringified body):', {
          method: req.method,
          path: req.path,
          bodyPreview: req.body.substring(0, 50)
        });
        return false; // Filter out this request
      }
      return true;
    });

    // Save cleaned list back to localStorage if anything was removed
    if (cleaned.length < requests.length) {
      try {
        localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(cleaned));
        console.info(`[API] Cleaned up ${requests.length - cleaned.length} old pending requests`);
      } catch (e) {
        console.warn('[API] Failed to save cleaned pending requests:', e);
      }
    }

    return cleaned;
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
 * Get stored JWT token from backend auth
 */
function getJWTToken(): string | null {
  try {
    return localStorage.getItem(JWT_TOKEN_KEY);
  } catch (e) {
    console.warn('[API] Error reading JWT token:', e);
    return null;
  }
}

/**
 * Save JWT token from backend response
 */
export function saveJWTToken(token: string): void {
  try {
    localStorage.setItem(JWT_TOKEN_KEY, token);
    console.log('[API] JWT token saved');
  } catch (e) {
    console.warn('[API] Error saving JWT token:', e);
  }
}

/**
 * Clear JWT token on logout
 */
export function clearJWTToken(): void {
  try {
    localStorage.removeItem(JWT_TOKEN_KEY);
    console.log('[API] JWT token cleared');
  } catch (e) {
    console.warn('[API] Error clearing JWT token:', e);
  }
}

/**
 * Main API request function
 * @param path - API path
 * @param init - RequestInit with stringified body for fetch
 * @param originalBody - Original unserialized body for offline queue (prevents double-encoding)
 */
async function request<T>(
  path: string,
  init: RequestInit = {},
  originalBody?: unknown
): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(init.headers || {});

  // Add JWT token in query parameter if available (for backend auth)
  let finalUrl = url;
  const jwtToken = getJWTToken();
  if (jwtToken && isDev) {
    // For development backend: add JWT token as query parameter
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}token=${encodeURIComponent(jwtToken)}`;
  }

  // Add Telegram initData if available (legacy, for fallback)
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
  console.log(`[API] ${method} ${finalUrl}`, {
    hasInitData,
    hasJWT: !!jwtToken,
    hasBody: !!init.body,
    bodyType: typeof init.body,
    bodyPreview: init.body ? (typeof init.body === 'string' ? (init.body as string).substring(0, 100) : 'object') : undefined
  });

  try {
    const res = await fetch(finalUrl, {
      ...init,
      headers,
      cache: 'no-cache'
    });

    console.log(`[API] ${method} ${finalUrl} - Status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      console.error(`[API] Error ${res.status}:`, errorText);
      throw new Error(`API ${res.status}: ${errorText}`);
    }

    // Handle empty response (common for DELETE requests)
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : (null as T);
    console.log(`[API] ${method} ${finalUrl} - Success`, data);

    // Cache successful read requests
    if (method === 'GET') {
      setCache(path, data, 5 * 60 * 1000); // 5 min TTL for GET
    }

    return data;
  } catch (error) {
    console.error(`[API] ${method} ${finalUrl} - Failed:`, error);

    // Try to return cached data on error
    const cached = getCache(path);
    if (cached !== null) {
      console.warn(`[API] Request failed, returning cached data for ${path}`, error);
      return cached as T;
    }

    // If write request, save for later sync
    if (method !== 'GET') {
      // CRITICAL: Save original body, NOT stringified body!
      // This prevents double-encoding when request is retried from offline queue
      savePendingRequest(method, path, originalBody);
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
    return request<T>(path, { method: 'GET' }, undefined);
  },

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    // Store original body for offline persistence
    // request() will stringify it, but offline queue needs the original
    return request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }, body);
  },

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }, body);
  },

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    }, body);
  },

  delete<T = unknown>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' }, undefined);
  }
};

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Check if we have valid Telegram authentication
 */
export function hasValidAuth(): boolean {
  const initData = getTelegramInitData();
  return initData !== '';
}

/**
 * Sync pending requests when coming back online
 */
export async function syncPendingRequests(): Promise<{ synced: number; failed: number }> {
  // Skip sync if not authenticated (running in browser, not in Telegram app)
  // In browser mode, we don't have Telegram initData, so all requests will fail with 401
  // Better to skip sync and proceed with app, sync will work when opened in real Telegram
  if (!hasValidAuth()) {
    console.info('[API] Skipping sync: not authenticated (no Telegram initData). This is normal in browser mode.');
    return { synced: 0, failed: 0 };
  }

  const pending = getPendingRequests();
  let synced = 0;
  let failed = 0;

  for (const req of pending) {
    try {
      // CRITICAL: req.body can be either:
      // 1. Object (new format): stored as original object for offline queue
      // 2. String (old format from previous bug): stored as JSON string (already stringified once)
      // We need to handle both cases to avoid double-encoding

      let bodyForRequest: BodyInit | null | undefined;
      let originalBodyForQueue: unknown;

      if (typeof req.body === 'string') {
        // Old format: body is already a JSON string (was stringified when saved)
        // Don't stringify again! Just use as-is
        bodyForRequest = req.body;
        originalBodyForQueue = undefined; // Don't save to queue again since it's already stringified
        console.warn('[API] Old-format pending request (stringified body)', {
          method: req.method,
          path: req.path
        });
      } else if (typeof req.body === 'object' && req.body !== null) {
        // New format: body is original object
        // Stringify for request, pass original for offline persistence
        bodyForRequest = JSON.stringify(req.body);
        originalBodyForQueue = req.body;
      } else {
        // No body or invalid
        bodyForRequest = undefined;
        originalBodyForQueue = undefined;
      }

      await request(req.path, {
        method: req.method,
        body: bodyForRequest
      }, originalBodyForQueue);
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
