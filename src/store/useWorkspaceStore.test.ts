import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bed, Participant, Room } from '../shared/types'
import { useWorkspaceStore } from './useWorkspaceStore'

function makeRoom(id: string, category: string, bedTypes: Bed['type'][]): Room {
  return {
    id,
    category,
    capacity: bedTypes.length,
    beds: bedTypes.map((type, i) => ({
      id: `${id}-bed-${i}`,
      type,
      label: `Bed ${i}`,
      assignedParticipantId: null
    }))
  }
}

function makeParticipant(id: string, roomType: string | string[], bedType: Bed['type']): Participant {
  return {
    id,
    name: `Guest ${id}`,
    requestedRoomType: Array.isArray(roomType) ? roomType : [roomType],
    requestedBedType: bedType,
    sharingPreferences: '',
    assignedRoomId: null,
    assignedBedId: null
  }
}

function resetStore(rooms: Room[], participants: Participant[]) {
  useWorkspaceStore.setState({
    rooms,
    participants,
    history: [{ rooms, participants }],
    historyIndex: 0,
    autoAllocateResult: null,
    assignError: null
  })
}

describe('assignParticipant', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('assigns a participant to a room matching any of their multiple requested room types', () => {
    const room = makeRoom('Room 2B', '2B', ['single'])
    const participant: Participant = {
      id: 'p-multi',
      name: 'Multi Guest',
      requestedRoomType: ['2A', '2B'],
      requestedBedType: 'single',
      sharingPreferences: '',
      assignedRoomId: null,
      assignedBedId: null
    }
    resetStore([room], [participant])
    useWorkspaceStore.getState().assignParticipant('p-multi', 'Room 2B', 'Room 2B-bed-0')
    expect(useWorkspaceStore.getState().assignError).toBeNull()
    expect(useWorkspaceStore.getState().participants[0].assignedRoomId).toBe('Room 2B')
  })

  it('blocks assignment when room category is not in participant requested room type list', () => {
    const room = makeRoom('Room 3A', '3A', ['single'])
    const participant: Participant = {
      id: 'p-multi',
      name: 'Multi Guest',
      requestedRoomType: ['2A', '2B'],
      requestedBedType: 'single',
      sharingPreferences: '',
      assignedRoomId: null,
      assignedBedId: null
    }
    resetStore([room], [participant])
    useWorkspaceStore.getState().assignParticipant('p-multi', 'Room 3A', 'Room 3A-bed-0')
    expect(useWorkspaceStore.getState().assignError).not.toBeNull()
    expect(useWorkspaceStore.getState().participants[0].assignedRoomId).toBeNull()
  })
})

describe('autoAllocate', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('when there are matches', () => {
    it('sets autoAllocateResult.matchesCount when guests are assigned', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single'])]
      const participants = [makeParticipant('p1', 'Standard', 'single')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      expect(useWorkspaceStore.getState().autoAllocateResult).toEqual({ matchesCount: 1 })
    })

    it('increments history when guests are assigned', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single'])]
      const participants = [makeParticipant('p1', 'Standard', 'single')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      expect(useWorkspaceStore.getState().historyIndex).toBe(1)
      expect(useWorkspaceStore.getState().history).toHaveLength(2)
    })
  })

  describe('when there are no matches', () => {
    it('sets autoAllocateResult.matchesCount to 0 when no guests match', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single'])]
      const participants = [makeParticipant('p1', 'Deluxe', 'double_shared')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      expect(useWorkspaceStore.getState().autoAllocateResult).toEqual({ matchesCount: 0 })
    })

    it('does not modify history when no guests match', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single'])]
      const participants = [makeParticipant('p1', 'Deluxe', 'double_shared')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      expect(useWorkspaceStore.getState().historyIndex).toBe(0)
      expect(useWorkspaceStore.getState().history).toHaveLength(1)
    })
  })

  describe('clearAutoAllocateResult', () => {
    it('sets autoAllocateResult to null', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single'])]
      const participants = [makeParticipant('p1', 'Standard', 'single')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      useWorkspaceStore.getState().clearAutoAllocateResult()
      expect(useWorkspaceStore.getState().autoAllocateResult).toBeNull()
    })
  })
})

describe('roomTypeFilter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to "all"', () => {
    useWorkspaceStore.setState({ roomTypeFilter: 'all' })
    expect(useWorkspaceStore.getState().roomTypeFilter).toBe('all')
  })

  it('setRoomTypeFilter updates the filter value', () => {
    useWorkspaceStore.setState({ roomTypeFilter: 'all' })
    useWorkspaceStore.getState().setRoomTypeFilter('Standard')
    expect(useWorkspaceStore.getState().roomTypeFilter).toBe('Standard')
  })

  it('setRoomTypeFilter resets back to "all"', () => {
    useWorkspaceStore.setState({ roomTypeFilter: 'Standard' })
    useWorkspaceStore.getState().setRoomTypeFilter('all')
    expect(useWorkspaceStore.getState().roomTypeFilter).toBe('all')
  })
})

describe('loadInitialState — stale localStorage migration', () => {
  it('normalizes requestedRoomType from string to array when loading from localStorage', async () => {
    const staleParticipants = [
      {
        id: 'p1',
        name: 'Guest One',
        requestedRoomType: 'Standard',
        requestedBedType: 'single',
        sharingPreferences: '',
        assignedRoomId: null,
        assignedBedId: null
      }
    ]
    const rooms = [
      {
        id: 'Room A',
        category: 'Standard',
        capacity: 1,
        beds: [{ id: 'Room A-bed-0', type: 'single', label: 'Bed 0', assignedParticipantId: null }]
      }
    ]
    localStorage.setItem('event_room_organizer_rooms_v1', JSON.stringify(rooms))
    localStorage.setItem('event_room_organizer_participants_v1', JSON.stringify(staleParticipants))

    vi.resetModules()
    const { useWorkspaceStore: freshStore } = await import('./useWorkspaceStore')
    const participants = freshStore.getState().participants

    expect(participants[0].requestedRoomType).toEqual(['Standard'])
  })
})

describe('resetAllocations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('clears all bed assignments and commits to history', () => {
    const rooms = [makeRoom('Room A', 'Standard', ['single'])]
    const participants = [makeParticipant('p1', 'Standard', 'single')]
    rooms[0].beds[0].assignedParticipantId = 'p1'
    participants[0].assignedRoomId = 'Room A'
    participants[0].assignedBedId = rooms[0].beds[0].id
    resetStore(rooms, participants)
    useWorkspaceStore.getState().resetAllocations()
    const state = useWorkspaceStore.getState()
    expect(state.rooms[0].beds[0].assignedParticipantId).toBeNull()
    expect(state.participants[0].assignedRoomId).toBeNull()
    expect(state.participants[0].assignedBedId).toBeNull()
    expect(state.historyIndex).toBe(1)
  })
})
