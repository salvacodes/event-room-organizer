import '@testing-library/jest-dom/vitest'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'csvImport', 'allocation', 'report'],
  defaultNS: 'common',
  resources: {
    en: {
      common: {},
      csvImport: {},
      allocation: {},
      report: {}
    }
  },
  interpolation: { escapeValue: false }
})
