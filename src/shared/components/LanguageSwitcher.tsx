import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n/index'

const LOCALES = [
  { code: 'es', flagCode: 'es', name: 'Español' },
  { code: 'en', flagCode: 'gb', name: 'English' }
]

export default function LanguageSwitcher() {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const current = LOCALES.find((l) => l.code === i18n.language) ?? LOCALES[0]

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t('languageSwitcher.ariaLabel')}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
      >
        <span role="img" aria-label={`${current.name} flag`} className={`fi fi-${current.flagCode}`} />
        <span>{current.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 min-w-[130px] overflow-hidden">
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              type="button"
              aria-current={locale.code === current.code ? 'true' : undefined}
              onClick={() => handleSelect(locale.code)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span role="img" aria-label={`${locale.name} flag`} className={`fi fi-${locale.flagCode}`} />
              <span>{locale.name}</span>
              {locale.code === current.code && <span className="ml-auto text-indigo-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
