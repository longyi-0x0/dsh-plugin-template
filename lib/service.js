/**
 * 业务逻辑。换插件要做什么，改这里；路由与传输层不必动。
 *
 * 这一层的约定只有两条：成功返回可 JSON 序列化的对象；调用方给错了就抛
 * 带 status 的 Error，由 lib/routes.js 转成对应状态码。
 */

/** 称呼只留前 40 个字符，避免把一整段粘贴的文本原样回显到界面上。 */
const MAX_NAME_LENGTH = 40

/** 带上 HTTP 状态码的错误：路由层照抄 status，其余错误一律 500。 */
export function requestError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

/** 请求体只认字符串并去空白；其余情况按「没给」处理。 */
function cleanName(value) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, MAX_NAME_LENGTH)
}

/**
 * @param {{ now?: () => Date }} [options] `now` 可注入，测试里用来固定时间。
 */
export function createService({ now = () => new Date() } = {}) {
  return {
    /** 读：一句话问候加服务端时间，用来确认浏览器 → 宿主这条路通。 */
    greeting({ name } = {}) {
      const who = cleanName(name) || 'world'
      return { greeting: `Hello, ${who}!`, serverTime: now().toISOString() }
    },

    /** 写：把提交的字段名回显，演示请求体校验与统一错误。 */
    echo(payload) {
      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        throw requestError('请求体必须是 JSON 对象')
      }
      const keys = Object.keys(payload)
      if (keys.length === 0) throw requestError('请求体至少要有一个字段')
      return { received: keys.length, keys }
    },
  }
}
