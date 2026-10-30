import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { test } from 'node:test'

import { PREFIX, createHandler, isTrustedRequest } from '../lib/routes.js'
import { createService } from '../lib/service.js'

const HOST = '127.0.0.1:5420'
const service = createService({ now: () => new Date('2026-01-02T03:04:05.000Z') })

function makeRequest({ method = 'GET', url = `${PREFIX}/greeting`, headers = {}, body } = {}) {
  const request = new EventEmitter()
  request.method = method
  request.url = url
  request.headers = { host: HOST, 'sec-fetch-site': 'same-origin', ...headers }
  request.destroy = () => {}
  queueMicrotask(() => {
    if (body !== undefined) request.emit('data', Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)))
    request.emit('end')
  })
  return request
}

function makeResponse() {
  const response = {
    statusCode: null,
    headers: null,
    body: '',
    writeHead(status, headers) {
      response.statusCode = status
      response.headers = headers
    },
    end(text) {
      if (text !== undefined) response.body += String(text)
    },
  }
  return response
}

function json(response) {
  return JSON.parse(response.body)
}

async function call(options, overrides = service) {
  const response = makeResponse()
  await createHandler(overrides)(makeRequest(options), response)
  return response
}

test('信任栅栏只放行本机同源请求', () => {
  assert.equal(isTrustedRequest(makeRequest()), true)
  assert.equal(isTrustedRequest(makeRequest({ headers: { host: 'localhost:5420' } })), true)
  assert.equal(isTrustedRequest(makeRequest({ headers: { host: undefined } })), false)
  assert.equal(isTrustedRequest(makeRequest({ headers: { host: '10.0.0.2:5420' } })), false)
  assert.equal(isTrustedRequest(makeRequest({ headers: { 'sec-fetch-site': 'cross-site' } })), false)
  assert.equal(isTrustedRequest(makeRequest({ headers: { origin: 'https://example.com' } })), false)
  assert.equal(isTrustedRequest(makeRequest({ headers: { origin: `http://${HOST}` } })), true)
})

test('异源请求拿到 403', async () => {
  const response = await call({ headers: { 'sec-fetch-site': 'cross-site' } })
  assert.equal(response.statusCode, 403)
  assert.equal(json(response).error.code, 'forbidden')
})

test('未知路径拿到 404', async () => {
  const response = await call({ url: `${PREFIX}/nope` })
  assert.equal(response.statusCode, 404)
  assert.equal(json(response).error.path, `${PREFIX}/nope`)
})

test('读接口只接受 GET 与 HEAD', async () => {
  const response = await call({ method: 'POST' })
  assert.equal(response.statusCode, 405)
  const head = await call({ method: 'HEAD' })
  assert.equal(head.statusCode, 200)
  assert.equal(head.body, '')
})

test('问候接口回显称呼与服务端时间', async () => {
  const response = await call({ url: `${PREFIX}/greeting?name=%E5%B0%8F%E6%98%8E` })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(json(response), { greeting: 'Hello, 小明!', serverTime: '2026-01-02T03:04:05.000Z' })
})

test('回显接口接受 POST 对象', async () => {
  const response = await call({ method: 'POST', url: `${PREFIX}/echo`, body: { a: 1, b: 2 } })
  assert.equal(response.statusCode, 200)
  assert.deepEqual(json(response), { received: 2, keys: ['a', 'b'] })
})

test('回显接口对空体返回 400', async () => {
  const response = await call({ method: 'POST', url: `${PREFIX}/echo` })
  assert.equal(response.statusCode, 400)
  assert.match(json(response).error.message, /至少要有一个字段/)
})

test('业务抛普通错误时按 500 返回', async () => {
  const failing = {
    greeting() {
      throw new Error('boom')
    },
    echo() {
      throw new Error('boom')
    },
  }
  const response = await call({}, failing)
  assert.equal(response.statusCode, 500)
  assert.equal(json(response).error.code, 'internal')
})
