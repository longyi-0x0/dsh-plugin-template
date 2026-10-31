import type { ClientContext, SlotProps } from './context'
import { dictionaries, NS } from './i18n'
import { STYLES } from './styles'

/** Services required by the browser half. */
export const inject = ['slots', 'locale']

/** Empty settings page: shows the slot, locale and close wiring only. */
function TemplateSection({ close, t }: SlotProps) {
  return (
    <div style={STYLES.page}>
      <div style={STYLES.head}>
        <div>
          <h2 style={STYLES.title}>{t('title')}</h2>
          <p style={STYLES.sub}>{t('subtitle')}</p>
        </div>
        {typeof close === 'function' ? (
          <button type="button" style={STYLES.button} onClick={close}>
            {t('close')}
          </button>
        ) : null}
      </div>
      <p style={STYLES.hint}>{t('hint')}</p>
    </div>
  )
}

/** Mount the browser half; all registrations are context-owned effects. */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, dictionaries), 'plugin-template: dictionaries')

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      { name: 'settings.section', id: 'plugin-template', order: 100, label: () => t('nav') },
      TemplateSection,
    ),
  )
}
