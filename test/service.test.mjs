import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createService } from '../lib/service.js'

const FIXED = new Date('2026-01-02T03:04:05.000Z')
const service = createService({ now: () => FIXED })

test('greeting 没有称呼时用 world', () => {
  assert.deepEqual(service.greeting(), { greeting: 'Hello, world!', serverTime: FIXED.toISOString() })
})

test('greeting 去掉首尾空白并截断到 40 个字符', () => {
  assert.equal(service.greeting({ name: '  小明  ' }).greeting, 'Hello, 小明!')
  assert.equal(service.greeting({ name: 'x'.repeat(80) }).greeting, `Hello, ${'x'.repeat(40)}!`)
})

test('greeting 只认字符串，其余按没给处理', () => {
  assert.equal(service.greeting({ name: 123 }).greeting, 'Hello, world!')
  assert.equal(service.greeting({ name: ['a'] }).greeting, 'Hello, world!')
})

test('echo 回显字段名与数量', () => {
  assert.deepEqual(service.echo({ a: 1, b: 2 }), { received: 2, keys: ['a', 'b'] })
})

test('echo 拒绝非对象与空对象', () => {
  assert.throws(() => service.echo(null), /JSON 对象/)
  assert.throws(() => service.echo([]), /JSON 对象/)
  assert.throws(() => service.echo({}), /至少要有一个字段/)
})
