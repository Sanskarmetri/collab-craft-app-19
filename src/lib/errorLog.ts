export interface LoggedError {
  type: 'error' | 'unhandledrejection' | 'react' | 'manual';
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  route: string;
  timestamp: string;
}

const STORAGE_KEY = 'studybyself.errors.v1';
const MAX_ENTRIES = 25;

const listeners = new Set<(errors: LoggedError[]) => void>();

export function getLoggedErrors(): LoggedError[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearLoggedErrors() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l([]));
}

export function subscribeToErrors(listener: (errors: LoggedError[]) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function logClientError(entry: Omit<LoggedError, 'timestamp' | 'route'> & { route?: string }) {
  const record: LoggedError = {
    ...entry,
    route: entry.route ?? (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
    timestamp: new Date().toISOString(),
  };

  // Always surface the stack in the console so it shows up in preview logs.
  console.error(`[client-error:${record.type}] ${record.message}\n${record.stack ?? '(no stack)'}`);

  try {
    const errors = getLoggedErrors();
    errors.push(record);
    while (errors.length > MAX_ENTRIES) errors.shift();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(errors));
    listeners.forEach((l) => l(errors));
  } catch {
    // storage unavailable — console log above is the fallback
  }

  return record;
}

let installed = false;

/** Installs global handlers that capture crashes with stack traces. */
export function installGlobalErrorLogging() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    logClientError({
      type: 'error',
      message: event.message || 'Unknown script error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logClientError({
      type: 'unhandledrejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}
