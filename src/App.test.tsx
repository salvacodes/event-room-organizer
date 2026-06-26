import { render, screen } from '@testing-library/react'
import i18n from 'i18next'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

const enCommon = {
  appTitle: 'Event Bed Coordinator',
  appVersion: 'v0.1',
  appSubtitle: 'Room assigner, CSV mappings & print sheets.',
  nav: { roomsAndSignups: 'Rooms & Signups', rooming: 'Rooming', pdfReport: 'PDF Report' },
  stats: { assigned: 'Assigned', unassigned: 'Unassigned' },
  languageSwitcher: { ariaLabel: 'Select language' }
}

const esCommon = {
  appTitle: 'Coordinador de Camas',
  appVersion: 'v0.1',
  appSubtitle: 'Asignador de habitaciones, mapeos CSV e informes para imprimir.',
  nav: { roomsAndSignups: 'Habitaciones e Inscripciones', rooming: 'Asignación', pdfReport: 'Informe PDF' },
  stats: { assigned: 'Asignados', unassigned: 'Sin asignar' },
  languageSwitcher: { ariaLabel: 'Seleccionar idioma' }
}

beforeEach(() => {
  i18n.addResourceBundle('en', 'common', enCommon, true, true)
  i18n.addResourceBundle('es', 'common', esCommon, true, true)
})

afterEach(() => {
  i18n.changeLanguage('en')
})

describe('App — common namespace', () => {
  it('renders Spanish nav labels when locale is es', async () => {
    await i18n.changeLanguage('es')
    render(<App />)
    expect(screen.getByText('Habitaciones e Inscripciones')).toBeInTheDocument()
    expect(screen.getByText('Asignación')).toBeInTheDocument()
    expect(screen.getByText('Informe PDF')).toBeInTheDocument()
  })

  it('renders Spanish app title when locale is es', async () => {
    await i18n.changeLanguage('es')
    render(<App />)
    expect(screen.getByText('Coordinador de Camas')).toBeInTheDocument()
  })

  it('renders Spanish stats labels when locale is es', async () => {
    await i18n.changeLanguage('es')
    render(<App />)
    expect(screen.getByText('Asignados')).toBeInTheDocument()
    expect(screen.getByText('Sin asignar')).toBeInTheDocument()
  })
})
