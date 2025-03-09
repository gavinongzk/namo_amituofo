// Utility to manage console logs in production
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
};

if (process.env.NODE_ENV === 'production') {
  const noop = () => {};
  
  // Override console methods in production
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  
  // Keep error logging in production for critical errors
  // If you want to disable error logs too, uncomment the next line
  // console.error = noop;
}

// Expose original console methods if needed for critical logging
export const originalConsoleLog = originalConsole;

// Export a development-safe logger
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args); // Always log errors
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...args);
    }
  },
}; 