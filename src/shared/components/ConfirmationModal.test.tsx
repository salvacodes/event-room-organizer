import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ConfirmationModal from './ConfirmationModal'

const defaultProps = {
  title: 'Reset Board?',
  message: 'All bed assignments will be cleared.',
  confirmLabel: 'Reset',
  confirmVariant: 'danger' as const,
  onConfirm: vi.fn(),
  onCancel: vi.fn()
}

describe('ConfirmationModal', () => {
  it('renders the title and message', () => {
    render(<ConfirmationModal {...defaultProps} />)
    expect(screen.getByText('Reset Board?')).toBeInTheDocument()
    expect(screen.getByText('All bed assignments will be cleared.')).toBeInTheDocument()
  })

  it('renders the confirm button with the given label', () => {
    render(<ConfirmationModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when the cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when the backdrop is clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByTestId('modal-backdrop'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Escape key is pressed', async () => {
    const onCancel = vi.fn()
    render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />)
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('does not call onCancel when clicking inside the modal card', () => {
    const onCancel = vi.fn()
    render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onCancel).not.toHaveBeenCalled()
  })
})
