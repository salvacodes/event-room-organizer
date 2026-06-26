import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en_allocation from './locales/en/allocation.json'
import en_common from './locales/en/common.json'
import en_csvImport from './locales/en/csvImport.json'
import en_report from './locales/en/report.json'
import es_allocation from './locales/es/allocation.json'
import es_common from './locales/es/common.json'
import es_csvImport from './locales/es/csvImport.json'
import es_report from './locales/es/report.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'csvImport', 'allocation', 'report'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    resources: {
      en: {
        common: en_common,
        csvImport: en_csvImport,
        allocation: en_allocation,
        report: en_report
      },
      es: {
        common: es_common,
        csvImport: es_csvImport,
        allocation: es_allocation,
        report: es_report
      }
    },
    interpolation: { escapeValue: false }
  })

export default i18n
