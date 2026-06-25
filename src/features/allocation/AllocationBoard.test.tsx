import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Bed } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import AllocationBoard from './AllocationBoard'

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn()
}))

type MockState = {
  rooms: { id: string; category: string; beds: Bed[]; capacity: number }[]
  participants: []
  assignError: string | null
  autoAllocate: () => void
  resetAllocations: () => void
  clearAssignError: () => void
  assignParticipant: () => void
  removeAssignment: () => void
  setDraggedParticipant: () => void
  historyIndex: number
  history: unknown[]
  undo: () => void
  redo: () => void
  autoAllocateResult: { matchesCount: number } | null
  clearAutoAllocateResult: () => void
  roomTypeFilter: string
  setRoomTypeFilter: () => void
}

function setupMock(overrides: Partial<MockState> = {}) {
  const state: MockState = {
    rooms: [],
    participants: [],
    assignError: null,
    autoAllocate: vi.fn(),
    resetAllocations: vi.fn(),
    clearAssignError: vi.fn(),
    assignParticipant: vi.fn(),
    removeAssignment: vi.fn(),
    setDraggedParticipant: vi.fn(),
    historyIndex: 1,
    history: [{}, {}, {}],
    undo: vi.fn(),
    redo: vi.fn(),
    autoAllocateResult: null,
    clearAutoAllocateResult: vi.fn(),
    roomTypeFilter: 'all',
    setRoomTypeFilter: vi.fn(),
    ...overrides
  }
  // biome-ignore lint/suspicious/noExplicitAny: test mock selector
  vi.mocked(useWorkspaceStore).mockImplementation((selector: (s: any) => unknown) => selector(state))
  return state
}

describe('AllocationBoard — undo/redo buttons', () => {
  it('renders undo and redo buttons in the action bar', () => {
    setupMock()
    render(<AllocationBoard />)
    expect(screen.getByTitle('Undo mapping step')).toBeInTheDocument()
    expect(screen.getByTitle('Redo mapping step')).toBeInTheDocument()
  })

  it('disables undo button when at the start of history', () => {
    setupMock({ historyIndex: 0 })
    render(<AllocationBoard />)
    expect(screen.getByTitle('Undo mapping step')).toBeDisabled()
  })

  it('enables undo button when there is history to undo', () => {
    setupMock({ historyIndex: 1 })
    render(<AllocationBoard />)
    expect(screen.getByTitle('Undo mapping step')).not.toBeDisabled()
  })

  it('disables redo button when at the end of history', () => {
    setupMock({ historyIndex: 2, history: [{}, {}, {}] })
    render(<AllocationBoard />)
    expect(screen.getByTitle('Redo mapping step')).toBeDisabled()
  })

  it('enables redo button when there is history to redo', () => {
    setupMock({ historyIndex: 1, history: [{}, {}, {}] })
    render(<AllocationBoard />)
    expect(screen.getByTitle('Redo mapping step')).not.toBeDisabled()
  })

  it('calls undo when undo button is clicked', () => {
    const undo = vi.fn()
    setupMock({ undo })
    render(<AllocationBoard />)
    fireEvent.click(screen.getByTitle('Undo mapping step'))
    expect(undo).toHaveBeenCalledOnce()
  })

  it('calls redo when redo button is clicked', () => {
    const redo = vi.fn()
    setupMock({ redo })
    render(<AllocationBoard />)
    fireEvent.click(screen.getByTitle('Redo mapping step'))
    expect(redo).toHaveBeenCalledOnce()
  })
})

describe('AllocationBoard — Reset Board confirmation modal', () => {
  it('shows ConfirmationModal when Reset button is clicked', () => {
    setupMock()
    render(<AllocationBoard />)
    fireEvent.click(screen.getByTitle('Remove all allocations'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Reset Board?')).toBeInTheDocument()
  })

  it('calls resetAllocations when modal confirm button is clicked', () => {
    const resetAllocations = vi.fn()
    setupMock({ resetAllocations })
    render(<AllocationBoard />)
    fireEvent.click(screen.getByTitle('Remove all allocations'))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset' }))
    expect(resetAllocations).toHaveBeenCalledOnce()
  })

  it('hides modal when cancel button is clicked', () => {
    setupMock()
    render(<AllocationBoard />)
    fireEvent.click(screen.getByTitle('Remove all allocations'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('AllocationBoard — room type filter', () => {
  const standardRoom = { id: 'Room 101', category: 'Standard', beds: [] as Bed[], capacity: 0 }
  const deluxeRoom = { id: 'Room 201', category: 'Deluxe', beds: [] as Bed[], capacity: 0 }

  it('renders all rooms when filter is "all"', () => {
    setupMock({ rooms: [standardRoom, deluxeRoom], roomTypeFilter: 'all' })
    render(<AllocationBoard />)
    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.getByText('Room 201')).toBeInTheDocument()
  })

  it('renders only matching rooms when a type is selected', () => {
    setupMock({ rooms: [standardRoom, deluxeRoom], roomTypeFilter: 'Standard' })
    render(<AllocationBoard />)
    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.queryByText('Room 201')).not.toBeInTheDocument()
  })
})

describe('AllocationBoard — Auto-Allocate toast', () => {
  it('renders success toast when autoAllocateResult.matchesCount > 0', () => {
    setupMock({ autoAllocateResult: { matchesCount: 5 } })
    render(<AllocationBoard />)
    expect(screen.getByText('Auto-allocation complete! 5 guests have been assigned.')).toBeInTheDocument()
  })

  it('renders warning toast when autoAllocateResult.matchesCount is 0', () => {
    setupMock({ autoAllocateResult: { matchesCount: 0 } })
    render(<AllocationBoard />)
    expect(
      screen.getByText('No matches found. No vacant beds match any unassigned guest preferences.')
    ).toBeInTheDocument()
  })

  it('does not render toast when autoAllocateResult is null', () => {
    setupMock({ autoAllocateResult: null })
    render(<AllocationBoard />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
