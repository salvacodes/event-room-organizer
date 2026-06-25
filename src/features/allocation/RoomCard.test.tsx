import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Participant, Room } from '../../shared/types'

import RoomCard from './RoomCard'

type MockState = {
  participants: Participant[]
  draggedParticipant: Participant | null
  assignParticipant: () => void
  removeAssignment: () => void
}

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn().mockImplementation((selector: (s: MockState) => unknown) =>
    selector({
      participants: [],
      draggedParticipant: null,
      assignParticipant: vi.fn(),
      removeAssignment: vi.fn()
    })
  )
}))

describe('RoomCard', () => {
  const room: Room = {
    id: 'Room 101',
    category: 'Standard',
    capacity: 2,
    beds: [
      { id: 'bed-1', type: 'single bed', label: 'Single Bed 1', assignedParticipantId: null },
      { id: 'bed-2', type: 'single bed', label: 'Single Bed 2', assignedParticipantId: null }
    ]
  }

  it('renders the room information and beds correctly', () => {
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
