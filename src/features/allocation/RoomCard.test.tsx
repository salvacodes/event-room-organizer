import { render, screen } from '@testing-library/react'
import i18n from 'i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Participant, Room } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import RoomCard from './RoomCard'

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn()
}))

beforeEach(() => {
  i18n.addResourceBundle(
    'en',
    'allocation',
    {
      roomCard: {
        bedsOccupied: '{{occupied}} / {{total}} Beds Occupied',
        full: 'FULL',
        emptySlot: 'Empty Slot',
        dropHere: 'Drop Here',
        unassignTitle: 'Unassign occupant',
        mismatchTitle: 'Allocation Mismatch:',
        mismatchRoom: 'Requested Room: {{types}}',
        mismatchBed: 'Requested Bed: {{type}}'
      }
    },
    true,
    true
  )
  i18n.changeLanguage('en')
})

const room: Room = {
  id: 'Room 101',
  category: 'Standard',
  capacity: 2,
  beds: [
    { id: 'bed-1', type: 'single', label: 'Single Bed 1', assignedParticipantId: null },
    { id: 'bed-2', type: 'single', label: 'Single Bed 2', assignedParticipantId: null }
  ]
}

function setupMock(draggedParticipant: Participant | null = null) {
  const assignParticipant = vi.fn()
  const removeAssignment = vi.fn()
  const setDraggedParticipant = vi.fn()

  // biome-ignore lint/suspicious/noExplicitAny: test mock selector
  vi.mocked(useWorkspaceStore).mockImplementation((selector: (s: any) => unknown) =>
    selector({ participants: [], draggedParticipant, assignParticipant, removeAssignment, setDraggedParticipant })
  )

  return { assignParticipant, setDraggedParticipant }
}

describe('RoomCard — rendering', () => {
  it('renders the room information and beds correctly', () => {
    setupMock()
    render(<RoomCard room={room} />)

    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('0 / 2 Beds Occupied')).toBeInTheDocument()
    expect(screen.getByText('Single Bed 1')).toBeInTheDocument()
    expect(screen.getByText('Single Bed 2')).toBeInTheDocument()
    expect(screen.getAllByText('Empty Slot')).toHaveLength(2)
    expect(screen.getAllByText('Drop Here')).toHaveLength(2)
  })
})
