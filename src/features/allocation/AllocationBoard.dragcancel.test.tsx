import type { DragCancelEvent } from '@dnd-kit/core'
import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Bed } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import AllocationBoard from './AllocationBoard'

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn()
}))

let capturedOnDragCancel: ((event: DragCancelEvent) => void) | undefined

vi.mock('@dnd-kit/core', async () => {
  const mod = await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core')
  return {
    ...mod,
    DndContext: ({ children, onDragCancel }: React.ComponentProps<typeof mod.DndContext>) => {
      capturedOnDragCancel = onDragCancel
      return <>{children}</>
    }
  }
})

function setupMock(setDraggedParticipant = vi.fn()) {
  const state = {
    rooms: [] as { id: string; category: string; beds: Bed[]; capacity: number }[],
    participants: [],
    draggedParticipant: null,
    assignError: null,
    autoAllocate: vi.fn(),
    resetAllocations: vi.fn(),
    clearAssignError: vi.fn(),
    assignParticipant: vi.fn(),
    removeAssignment: vi.fn(),
    setDraggedParticipant,
    historyIndex: 0,
    history: [{}],
    undo: vi.fn(),
    redo: vi.fn(),
    autoAllocateResult: null,
    clearAutoAllocateResult: vi.fn(),
    roomTypeFilter: 'all',
    setRoomTypeFilter: vi.fn()
  }
  // biome-ignore lint/suspicious/noExplicitAny: test mock selector
  vi.mocked(useWorkspaceStore).mockImplementation((selector: (s: any) => unknown) => selector(state))
  return state
}

describe('AllocationBoard — drag cancel', () => {
  it('calls setDraggedParticipant with null when drag is cancelled', () => {
    const setDraggedParticipant = vi.fn()
    setupMock(setDraggedParticipant)
    render(<AllocationBoard />)

    act(() => {
      capturedOnDragCancel?.({} as DragCancelEvent)
    })

    expect(setDraggedParticipant).toHaveBeenCalledWith(null)
  })
})
