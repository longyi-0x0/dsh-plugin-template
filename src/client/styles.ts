import type { CSSProperties } from 'react'

const button: CSSProperties = {
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

/** Styles for the empty settings page; only theme variables, no CSS files. */
export const STYLES = {
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
  hint: { margin: 0, fontSize: 11, color: 'var(--dsw-alias-label-caption)', lineHeight: 1.6 },
} satisfies Record<string, CSSProperties>
