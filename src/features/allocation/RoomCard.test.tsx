import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Participant, Room } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import RoomCard from './RoomCard'

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn()
}))

const room: Room = {
  id: 'Room 101',
  category: 'Standard',
  capacity: 2,
  beds: [
    { id: 'bed-1', type: 'single bed', label: 'Single Bed 1', assignedParticipantId: null },
    { id: 'bed-2', type: 'single bed', label: 'Single Bed 2', assignedParticipantId: null }
  ]
}

const compatibleParticipant: Participant = {
  id: 'p1',
  name: 'Alice',
  requestedRoomType: 'Standard',
  requestedBedType: 'single bed',
  sharingPreferences: '',
  assignedRoomId: null,
  assignedBedId: null
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

describe('RoomCard — drag and drop', () => {
  it('assigns the participant and clears draggedParticipant on a compatible drop', () => {
    const { assignParticipant, setDraggedParticipant } = setupMock(compatibleParticipant)
    render(<RoomCard room={room} />)

    fireEvent.drop(document.getElementById('bed-slot-bed-1')!, {
      dataTransfer: { getData: () => 'p1' }
    })

    expect(assignParticipant).toHaveBeenCalledWith('p1', 'Room 101', 'bed-1')
    expect(setDraggedParticipant).toHaveBeenCalledWith(null)
  })

  it('does not clear draggedParticipant when dropping on an incompatible room', () => {
    const { setDraggedParticipant } = setupMock(compatibleParticipant)
    const incompatibleRoom: Room = { ...room, category: 'Deluxe' }
    render(<RoomCard room={incompatibleRoom} />)

    fireEvent.drop(document.getElementById('bed-slot-bed-1')!, {
      dataTransfer: { getData: () => 'p1' }
    })

    expect(setDraggedParticipant).not.toHaveBeenCalled()
  })
})
