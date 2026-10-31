import { expect, test } from 'vitest'

/**
 * Smoke test for the built browser bundle: capture __ModuleLoader__.load with a
 * minimal window, then run the plugin apply against a fake Client context.
 * The component is not rendered; this verifies registration wiring only.
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
  await import(new URL('../target/client.js', import.meta.url).href)
  expect(captured).not.toBe(null)
  return captured
}

function reactStub() {
  return {
    createElement: () => null,
    useState: () => [undefined, () => {}],
    useEffect: () => {},
  }
}

function jsxRuntimeStub() {
  return {
    Fragment: Symbol('Fragment'),
    jsx: () => null,
    jsxs: () => null,
  }
}

/** The Host-injected require: this template asks for React and its JSX runtime. */
function requireStub(name) {
  if (name === 'react') return reactStub()
  if (name === 'react/jsx-runtime' || name === 'react/jsx-dev-runtime') return jsxRuntimeStub()
  throw new Error(`unexpected require: ${name}`)
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

test('module declares its own id and factory', async () => {
  const spec = await loadModule()
  expect(spec.id).toBe('dsh-plugin-template')
  expect(typeof spec.factory).toBe('function')
})

test('factory returns the Cordis plugin shape', async () => {
  const spec = await loadModule()
  const plugin = spec.factory(requireStub)
  expect(plugin.inject).toEqual(['slots', 'locale'])
  expect(typeof plugin.apply).toBe('function')
})

test('apply registers both dictionaries and one settings section', async () => {
  const spec = await loadModule()
  const plugin = spec.factory(requireStub)
  const { ctx, registrations, dictionaries } = fakeContext()
  plugin.apply(ctx)

  expect(dictionaries).toHaveLength(1)
  expect(dictionaries[0].namespace).toBe('pluginTemplate')
  expect(Object.keys(dictionaries[0].dicts)).toEqual(['zh', 'en'])

  expect(registrations).toHaveLength(1)
  const [entry] = registrations
  expect(entry.options.name).toBe('settings.section')
  expect(entry.options.id).toBe('plugin-template')
  expect(entry.options.label()).toBe('nav')
  expect(typeof entry.component).toBe('function')
})
