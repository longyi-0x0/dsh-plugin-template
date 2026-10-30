/**
 * 浏览器半区的数据面：挂在宿主已有 webServer 上的一组 JSON 接口。
 *
 * 为什么不自己开端口、不走 Remote：纯 JS 包没有装饰器与代码生成那套
 * `@Remote` 命名空间，注册一条前缀路由最简单。
 *
 * 安全边界：DSH 的 Web 端口在回环地址上，但浏览器里任何一个网页都能向它发请求。
 * 所以这里只接受本机回环 Host 的同源请求；变更类接口只收 POST 与 JSON 体。
 * 远程访问模式（非回环 Host）下这些接口一律拒绝。
 */

import { URL } from 'node:url'

export const PREFIX = '/plugin-template/api'

/** 请求体上限：模板只收一个小对象。 */
const BODY_LIMIT = 64 * 1024

function header(headers, key) {
  const value = headers?.[key]
  return typeof value === 'string' ? value : undefined
}

function isLoopbackHostname(hostname) {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  const parts = hostname.split('.')
  if (parts.length !== 4 || parts[0] !== '127') return false
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

/**
 * 请求是否来自本机浏览器且同源：Host 必须是回环地址，跨站请求与异源 Origin 一律拒绝。
 * @param {{ headers?: Record<string, unknown> }} request Node 的 IncomingMessage。
 * @returns {boolean}
 */
export function isTrustedRequest(request) {
  const authority = header(request?.headers, 'host')
  if (authority === undefined) return false
  let hostUrl
  try {
    hostUrl = new URL(`http://${authority}`)
  } catch {
    return false
  }
  if (!isLoopbackHostname(hostUrl.hostname)) return false
  if (header(request?.headers, 'sec-fetch-site') === 'cross-site') return false
  const origin = header(request?.headers, 'origin')
  if (origin === undefined) return true
  try {
    return new URL(origin).hostname === hostUrl.hostname
  } catch {
    return false
  }
}

function sendJson(response, status, body) {
  const text = JSON.stringify(body)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  })
  response.end(text)
}

/**
 * 读完一个 JSON 请求体；空体算 `{}`，超限或坏 JSON 抛错。
 * @param {import('node:http').IncomingMessage} request
 * @returns {Promise<Record<string, unknown>>}
 */
export function readJsonBody(request) {
  return new Promise((resolvePromise, rejectPromise) => {
    let size = 0
    const chunks = []
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > BODY_LIMIT) {
        rejectPromise(new Error('请求体过大'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      if (chunks.length === 0) return resolvePromise({})
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        resolvePromise(typeof parsed === 'object' && parsed !== null ? parsed : {})
      } catch {
        rejectPromise(new Error('请求体不是合法 JSON'))
      }
    })
    request.on('error', rejectPromise)
  })
}

/**
 * 生成 HTTP handler，便于测试直接调用。
 * @param {ReturnType<import('./service.js').createService>} service
 * @param {{ logger?: { warn?: Function } }} [options]
 */
export function createHandler(service, options = {}) {
  const { logger } = options
  return async function handler(request, response) {
    try {
      if (!isTrustedRequest(request)) {
        return sendJson(response, 403, { error: { code: 'forbidden', message: '只接受本机同源请求' } })
      }
      const url = new URL(request.url ?? '/', 'http://localhost')
      const path = url.pathname
      const method = request.method ?? 'GET'

      if (path === `${PREFIX}/greeting`) {
        if (method !== 'GET' && method !== 'HEAD') {
          return sendJson(response, 405, { error: { code: 'method-not-allowed' } })
        }
        const result = service.greeting({ name: url.searchParams.get('name') ?? undefined })
        if (method === 'HEAD') {
          response.writeHead(200, { 'cache-control': 'no-store' })
          return response.end()
        }
        return sendJson(response, 200, result)
      }

      if (path === `${PREFIX}/echo`) {
        if (method !== 'POST') {
          return sendJson(response, 405, { error: { code: 'method-not-allowed' } })
        }
        const body = await readJsonBody(request)
        return sendJson(response, 200, service.echo(body))
      }

      return sendJson(response, 404, { error: { code: 'not-found', path } })
    } catch (error) {
      const status = typeof error?.status === 'number' ? error.status : 500
      if (status >= 500) {
        logger?.warn?.(`dsh-plugin-template: 数据接口失败：${String(error?.message ?? error)}`)
      }
      return sendJson(response, status, {
        error: { code: status >= 500 ? 'internal' : 'bad-request', message: String(error?.message ?? error) },
      })
    }
  }
}

/**
 * 把接口挂到宿主 webServer 上。
 * @param {{ webServer: { register: Function }, logger?: { warn?: Function } }} ctx
 * @param {ReturnType<import('./service.js').createService>} service
 * @returns {() => void} 注销函数。
 */
export function registerRoutes(ctx, service) {
  const handler = createHandler(service, { logger: ctx.logger })
  return ctx.webServer.register({ kind: 'prefix', path: PREFIX, handler })
}
