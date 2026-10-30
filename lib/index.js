/**
 * 宿主半区入口。
 *
 * 只做一件事：把 /plugin-template/api 挂到宿主已有的 webServer 上。
 * 业务逻辑在 lib/service.js，传输与信任围栏在 lib/routes.js，
 * 浏览器半区在 lib/client.js（由 package.json 的 dsh.client 声明自动加载）。
 */

import { registerRoutes } from './routes.js'
import { createService } from './service.js'

export const name = 'dsh-plugin-template'

/** webServer 由宿主提供；拿不到它这一行插件不会启动，也不会拖累别的插件。 */
export const inject = ['webServer']

export function apply(ctx) {
  const service = createService()
  ctx.effect(() => registerRoutes(ctx, service), 'plugin-template: routes')
  ctx.logger?.info?.('dsh-plugin-template: 已挂 /plugin-template/api')
}
