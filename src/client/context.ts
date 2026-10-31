import type { ComponentType } from 'react'

import type { Translate } from './i18n'

/** Props the settings.section slot passes to a registered component. */
export interface SlotProps {
  close?: () => void
  t: Translate
}

/** Options accepted by the Client slot registry. */
export interface SlotRegistrationOptions {
  name: string
  id: string
  order?: number
  label?: () => string
}

export interface SlotsService {
  inject(owner: string, register: () => void): void
  register(options: SlotRegistrationOptions, component: ComponentType<SlotProps>): () => void
}

export interface LocaleService {
  bind(namespace: string): Translate
  register(namespace: string, dictionaries: { zh: Record<string, string>; en: Record<string, string> }): () => void
}

/** The subset of the Client Cordis context used by this plugin. */
export interface ClientContext {
  effect(callback: () => void | (() => void), label?: string): unknown
  slots: SlotsService
  locale: LocaleService
}
