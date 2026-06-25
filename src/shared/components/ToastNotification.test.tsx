import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ToastNotification from './ToastNotification'

describe('ToastNotification', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the message', () => {
    render(<ToastNotification message="All done!" variant="success" onDismiss={vi.fn()} />)
    expect(screen.getByText('All done!')).toBeInTheDocument()
  })

  it('calls onDismiss when the dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<ToastNotification message="All done!" variant="success" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText('Dismiss notification'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('does not call onDismiss before 8 seconds', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<ToastNotification message="All done!" variant="success" onDismiss={onDismiss} />)
    vi.advanceTimersByTime(7999)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('calls onDismiss after 8 seconds', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<ToastNotification message="All done!" variant="success" onDismiss={onDismiss} />)
    vi.advanceTimersByTime(8000)
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
