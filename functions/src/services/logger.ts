export interface Logger {
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
}

export const consoleLogger: Logger = {
  info:  (m, d) => console.log(m, d ?? ''),
  warn:  (m, d) => console.warn(m, d ?? ''),
  error: (m, d) => console.error(m, d ?? ''),
}; 