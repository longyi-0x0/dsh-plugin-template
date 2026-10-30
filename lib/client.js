/**
 * 浏览器半区。
 *
 * 宿主加载这个文件时只登记 factory；模块体等到插件第一次被用到才执行。
 * 信封只做三件事：模块 id、宿主注入的 require、把 React 交给模块体。
 *
 * 这里注册的是「设置」里的一页（settings.section）。界面只读同源的
 * /plugin-template/api，样式只用 --dsw-alias-* 主题变量，不引 CSS 文件。
 */

window.__ModuleLoader__.load({
  id: 'dsh-plugin-template',
  factory: (require) => createClient(require('react')),
})

/** 文案按语言分列：加语言加一列，加文案加一行。键名在两种语言里保持一致。 */
const STRINGS = {
  zh: {
    nav: '插件模板',
    title: '插件模板',
    subtitle: '这一页由浏览器半区注册，数据来自宿主挂的 /plugin-template/api。',
    close: '返回',
    nameLabel: '称呼',
    namePlaceholder: '留空就是 world',
    send: '请求宿主',
    loading: '请求中…',
    resultTitle: '宿主返回',
    greeting: '问候',
    serverTime: '服务端时间',
    error: '请求失败',
    hint: '宿主半区在 lib/index.js，路由在 lib/routes.js。换插件时先改这两个文件的业务，再改这一页。',
  },
  en: {
    nav: 'Plugin template',
    title: 'Plugin template',
    subtitle: 'This page is registered by the browser half; its data comes from /plugin-template/api on the host.',
    close: 'Back',
    nameLabel: 'Name',
    namePlaceholder: 'Empty means world',
    send: 'Ask the host',
    loading: 'Loading…',
    resultTitle: 'Host response',
    greeting: 'Greeting',
    serverTime: 'Server time',
    error: 'Request failed',
    hint: 'The host half lives in lib/index.js and its routes in lib/routes.js. Replace that business logic first, then this page.',
  },
}

function makeStyles() {
  const button = {
    border: '1px solid var(--dsw-alias-border-l)',
    background: 'transparent',
    color: 'var(--dsw-alias-label-primary)',
    borderRadius: 8,
    padding: '4px 10px',
    font: 'inherit',
    fontSize: 12,
    lineHeight: '18px',
    cursor: 'pointer',
  }
  return {
    page: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 760,
      padding: '2px 0 8px',
      font: '13px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif',
      color: 'var(--dsw-alias-label-primary)',
    },
    head: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
    title: { margin: 0, fontSize: 18, fontWeight: 600 },
    sub: { margin: '4px 0 0', fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' },
    button,
    primary: { ...button, borderColor: 'transparent', background: 'var(--dsw-alias-brand-primary)', color: '#ffffff' },
    card: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '12px 14px',
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: 10,
      background: 'var(--dsw-alias-fill-l1)',
    },
    cardTitle: { margin: 0, fontSize: 13, fontWeight: 600 },
    label: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
    row: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    input: {
      flex: '1 1 220px',
      minWidth: 0,
      padding: '5px 10px',
      border: '1px solid var(--dsw-alias-border-l)',
      borderRadius: 8,
      background: 'var(--dsw-alias-bg-base)',
      color: 'var(--dsw-alias-label-primary)',
      font: 'inherit',
      fontSize: 12,
      lineHeight: '18px',
    },
    dl: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', margin: 0 },
    dt: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 },
    dd: { margin: 0, fontSize: 12, color: 'var(--dsw-alias-label-secondary)', overflowWrap: 'anywhere' },
    error: { margin: 0, fontSize: 12, color: 'var(--dsw-alias-state-error-primary)', overflowWrap: 'anywhere' },
    hint: { margin: 0, fontSize: 11, color: 'var(--dsw-alias-label-caption)', lineHeight: 1.6 },
  }
}

/**
 * @param {typeof import('react')} React 宿主注入的 React，不打包。
 * @returns {{ inject: string[], apply: (ctx: any) => void }} 一行 cordis 插件。
 */
function createClient(React) {
  const h = React.createElement
  const { useEffect, useState } = React

  const NS = 'pluginTemplate'
  const API = '/plugin-template/api'
  const styles = makeStyles()

  /** 设置页：输入一个称呼，向宿主要一句话。 */
  function makeSection(t) {
    return function TemplateSection({ close }) {
      const [name, setName] = useState('')
      const [busy, setBusy] = useState(false)
      const [result, setResult] = useState(null)
      const [error, setError] = useState(null)

      async function ask() {
        setBusy(true)
        setError(null)
        try {
          const response = await fetch(`${API}/greeting?name=${encodeURIComponent(name)}`, {
            credentials: 'same-origin',
          })
          const data = await response.json().catch(() => null)
          if (!response.ok) throw new Error(data?.error?.message ?? `HTTP ${response.status}`)
          setResult(data)
        } catch (cause) {
          setResult(null)
          setError(String(cause?.message ?? cause))
        } finally {
          setBusy(false)
        }
      }

      useEffect(() => {
        ask()
      }, [])

      return h(
        'div',
        { style: styles.page, 'data-plugin-template': 'section' },
        h(
          'div',
          { style: styles.head },
          h(
            'div',
            null,
            h('h2', { style: styles.title }, t('title')),
            h('p', { style: styles.sub }, t('subtitle')),
          ),
          typeof close === 'function'
            ? h('button', { type: 'button', style: styles.button, onClick: close }, t('close'))
            : null,
        ),
        h(
          'section',
          { style: styles.card },
          h('label', { style: styles.label, htmlFor: 'plugin-template-name' }, t('nameLabel')),
          h(
            'div',
            { style: styles.row },
            h('input', {
              id: 'plugin-template-name',
              style: styles.input,
              value: name,
              placeholder: t('namePlaceholder'),
              onChange: (event) => setName(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') ask()
              },
            }),
            h(
              'button',
              { type: 'button', style: styles.primary, disabled: busy, onClick: ask },
              busy ? t('loading') : t('send'),
            ),
          ),
        ),
        error === null
          ? null
          : h('p', { style: styles.error, 'data-plugin-template': 'error' }, `${t('error')}: ${error}`),
        result === null
          ? null
          : h(
              'section',
              { style: styles.card, 'data-plugin-template': 'result' },
              h('h3', { style: styles.cardTitle }, t('resultTitle')),
              h(
                'dl',
                { style: styles.dl },
                h('dt', { style: styles.dt }, t('greeting')),
                h('dd', { style: styles.dd }, String(result.greeting ?? '—')),
                h('dt', { style: styles.dt }, t('serverTime')),
                h('dd', { style: styles.dd }, String(result.serverTime ?? '—')),
              ),
            ),
        h('p', { style: styles.hint }, t('hint')),
      )
    }
  }

  return {
    inject: ['slots', 'locale'],

    apply(ctx) {
      // t 每次调用都按当前语言取词，切换语言后不用重新注册。
      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.locale.register(NS, { zh: STRINGS.zh, en: STRINGS.en }), 'plugin-template: dictionaries')

      // id 用自己的：复用内置项的 id 会顶掉那一项。
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          { name: 'settings.section', id: 'plugin-template', order: 100, label: () => t('nav') },
          makeSection(t),
        ),
      )
    },
  }
}
