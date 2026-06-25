import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import AllocationBoard from './AllocationBoard'

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn()
}))

type MockState = {
  rooms: []
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
    ...overrides
  }
  // biome-ignore lint/suspicious/noExplicitAny: test mock selector
  vi.mocked(useWorkspaceStore).mockImplementation((selector: (s: any) => unknown) => selector(state))
  return state
}

describe('AllocationBoard', () => {
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
