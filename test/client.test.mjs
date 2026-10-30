import assert from 'node:assert/strict'
import { test } from 'node:test'

/**
 * 浏览器半区的装载冒烟：用最小的 window 接住 __ModuleLoader__.load，
 * 再用假的 ctx 跑一遍 apply，确认字典与设置页都登记上了。
 * 组件本身不渲染（渲染需要 DSH 的 React 与主题环境），只验证接线。
 */

let captured = null

async function loadModule() {
  if (captured !== null) return captured
  globalThis.window = {
    __ModuleLoader__: {
      load(spec) {
        captured = spec
      },
    },
  }
  await import(new URL('../lib/client.js', import.meta.url).href)
  assert.ok(captured !== null, '模块没有调用 __ModuleLoader__.load')
  return captured
}

function reactStub() {
  return {
    createElement: () => null,
    useState: () => [undefined, () => {}],
    useEffect: () => {},
  }
}

/** 宿主注入的 require：模板只向它要 React。 */
function requireStub(name) {
  assert.equal(name, 'react')
  return reactStub()
}

function fakeContext() {
  const registrations = []
  const dictionaries = []
  return {
    registrations,
    dictionaries,
    ctx: {
      slots: {
        inject(name, register) {
          register()
        },
        register(options, component) {
          registrations.push({ options, component })
          return () => {}
        },
      },
      locale: {
        register(namespace, dicts) {
          dictionaries.push({ namespace, dicts })
          return () => {}
        },
        bind: () => (key) => key,
      },
      effect(run) {
        return run()
      },
    },
  }
}

test('模块声明自己的 id 与 factory', async () => {
  const spec = await loadModule()
  assert.equal(spec.id, 'dsh-plugin-template')
  assert.equal(typeof spec.factory, 'function')
})

test('factory 返回 cordis 插件形状', async () => {
  const spec = await loadModule()
  const plugin = spec.factory(requireStub)
  assert.deepEqual(plugin.inject, ['slots', 'locale'])
  assert.equal(typeof plugin.apply, 'function')
})

test('apply 注册中英字典与一个设置页', async () => {
  const spec = await loadModule()
  const plugin = spec.factory(requireStub)
  const { ctx, registrations, dictionaries } = fakeContext()
  plugin.apply(ctx)

  assert.equal(dictionaries.length, 1)
  assert.equal(dictionaries[0].namespace, 'pluginTemplate')
  assert.deepEqual(Object.keys(dictionaries[0].dicts), ['zh', 'en'])

  assert.equal(registrations.length, 1)
  const [entry] = registrations
  assert.equal(entry.options.name, 'settings.section')
  assert.equal(entry.options.id, 'plugin-template')
  assert.equal(entry.options.label(), 'nav')
  assert.equal(typeof entry.component, 'function')
})
