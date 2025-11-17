/**
 * Logging service for tracking user actions
 * Logs important events for debugging and auditing
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

const LOG_STORAGE_KEY = 'app_logs';
const MAX_LOGS = 100; // Keep only last 100 logs

/**
 * Format timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get logs from storage
 */
function getLogs(): LogEntry[] {
  try {
    const logs = localStorage.getItem(LOG_STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (e) {
    console.error('[Logger] Failed to read logs:', e);
    return [];
  }
}

/**
 * Save logs to storage (keep only recent ones)
 */
function saveLogs(logs: LogEntry[]): void {
  try {
    const limited = logs.slice(-MAX_LOGS);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(limited));
  } catch (e) {
    console.error('[Logger] Failed to save logs:', e);
  }
}

/**
 * Add log entry
 */
function addLog(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: getTimestamp(),
    ...(data !== undefined ? { data } : {})
  };

  // Console output
  const style = `color: ${
    level === 'debug'
      ? '#888'
      : level === 'info'
        ? '#0066cc'
        : level === 'warn'
          ? '#ff9900'
          : '#cc0000'
  }; font-weight: bold;`;
  console.log(`%c[${level.toUpperCase()}]`, style, message, data || '');

  // Storage
  const logs = getLogs();
  logs.push(entry);
  saveLogs(logs);
}

/**
 * Logger API
 */
export const logger = {
  debug: (message: string, data?: unknown) => addLog('debug', message, data),
  info: (message: string, data?: unknown) => addLog('info', message, data),
  warn: (message: string, data?: unknown) => addLog('warn', message, data),
  error: (message: string, data?: unknown) => addLog('error', message, data),

  /**
   * Get all logs
   */
  getLogs,

  /**
   * Clear all logs
   */
  clearLogs: () => {
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
    } catch (e) {
      console.error('[Logger] Failed to clear logs:', e);
    }
  },

  /**
   * Export logs as JSON
   */
  exportLogs: (): string => {
    return JSON.stringify(getLogs(), null, 2);
  }
};

/**
 * Log important user actions
 */
export const userActions = {
  login: (username?: string) => {
    logger.info('User login', { username });
  },

  logout: () => {
    logger.info('User logout');
  },

  deleteAccount: (username?: string) => {
    logger.warn('User account deletion requested', { username });
  },

  saveWorkout: (date: string, exerciseCount: number) => {
    logger.info('Workout saved', { date, exerciseCount });
  },

  selectExercise: (exerciseName: string) => {
    logger.debug('Exercise selected', { exerciseName });
  },

  addSet: (exerciseName: string, reps: number, weight: number) => {
    logger.debug('Set added', { exerciseName, reps, weight });
  }
};

export default logger;
