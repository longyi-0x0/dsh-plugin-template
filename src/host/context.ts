/** Minimal structural type for the Cordis Host context this skeleton uses. */
export interface HostLogger {
  debug?(message: string, ...args: unknown[]): void
  info?(message: string, ...args: unknown[]): void
  warn?(message: string, ...args: unknown[]): void
  error?(message: string, ...args: unknown[]): void
}

export interface HostContext {
  logger?: HostLogger | undefined
}
