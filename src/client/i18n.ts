import en from '../../locale/en.json'
import zh from '../../locale/zh.json'

/** Locale namespace registered with the Client locale service. */
export const NS = 'pluginTemplate'

/** The English keys are the compile-time key union. */
export type MessageKey = keyof typeof en.ui
export type Translate = (key: MessageKey) => string

/**
 * Typed dictionaries imported from the same locale JSON the Host reads.
 *
 * The Host only consumes `meta`; the browser half consumes `ui`. esbuild inlines
 * this JSON into client.js, so no runtime request is involved.
 */
export const dictionaries: {
  zh: Record<MessageKey, string>
  en: Record<MessageKey, string>
} = {
  zh: zh.ui,
  en: en.ui,
}
