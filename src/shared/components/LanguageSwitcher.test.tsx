import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from 'i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LanguageSwitcher from './LanguageSwitcher'

beforeEach(() => {
  i18n.addResourceBundle('en', 'common', { languageSwitcher: { ariaLabel: 'Select language' } }, true, true)
  i18n.addResourceBundle('es', 'common', { languageSwitcher: { ariaLabel: 'Seleccionar idioma' } }, true, true)
  i18n.changeLanguage('en')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LanguageSwitcher', () => {
  it('renders the current locale flag and name', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByText(/English/)).toBeInTheDocument()
    expect(screen.getByText(/🇬🇧/)).toBeInTheDocument()
  })

  it('opens a dropdown with all locale options on click', async () => {
    render(<LanguageSwitcher />)
    await userEvent.click(screen.getByRole('button', { name: /Select language/i }))
    expect(screen.getByText(/Español/)).toBeInTheDocument()
    expect(screen.getByText(/🇪🇸/)).toBeInTheDocument()
  })

  it('calls i18n.changeLanguage when a different locale is selected', async () => {
    const spy = vi.spyOn(i18n, 'changeLanguage').mockResolvedValue(i18n.t)
    render(<LanguageSwitcher />)
    await userEvent.click(screen.getByRole('button', { name: /Select language/i }))
    await userEvent.click(screen.getByText(/Español/))
    expect(spy).toHaveBeenCalledWith('es')
  })

  it('closes the dropdown after selecting a locale', async () => {
    vi.spyOn(i18n, 'changeLanguage').mockResolvedValue(i18n.t)
    render(<LanguageSwitcher />)
    await userEvent.click(screen.getByRole('button', { name: /Select language/i }))
    await userEvent.click(screen.getByText(/Español/))
    expect(screen.queryByText(/🇪🇸/)).not.toBeInTheDocument()
  })

  it('shows a checkmark indicator on the currently active locale in the dropdown', async () => {
    render(<LanguageSwitcher />)
    await userEvent.click(screen.getByRole('button', { name: /Select language/i }))
    const englishOption = screen.getByRole('button', { name: /English/ })
    expect(englishOption).toHaveAttribute('aria-current', 'true')
  })
})
