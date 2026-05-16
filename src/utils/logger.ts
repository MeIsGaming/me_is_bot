const LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[LEVEL] ?? 1;

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (currentLevel <= 0) console.debug(`\x1b[90m[${timestamp()}] [DEBUG]\x1b[0m`, ...args);
  },
  info: (...args: unknown[]) => {
    if (currentLevel <= 1) console.log(`\x1b[36m[${timestamp()}] [INFO]\x1b[0m`, ...args);
  },
  warn: (...args: unknown[]) => {
    if (currentLevel <= 2) console.warn(`\x1b[33m[${timestamp()}] [WARN]\x1b[0m`, ...args);
  },
  error: (...args: unknown[]) => {
    if (currentLevel <= 3) console.error(`\x1b[31m[${timestamp()}] [ERROR]\x1b[0m`, ...args);
  },
};
