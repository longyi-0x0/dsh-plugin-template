/**
 * Host half skeleton.
 *
 * Add host-side services, routes, tools, or listeners here. Register every
 * resource inside `ctx.effect(...)` so unloading the plugin removes it; see the
 * DSH host-plugin guidance for the context service you need.
 */
import type { HostContext } from './context'

export const name = 'dsh-plugin-template'

/** Host services this plugin depends on. Add names here when you use them. */
export const inject: string[] = []

export function apply(ctx: HostContext): void {
  ctx.logger?.info?.('dsh-plugin-template: activated')
}
