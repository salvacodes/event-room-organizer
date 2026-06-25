import { beforeEach, describe, expect, it } from 'vitest'
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

function makeParticipant(id: string, roomType: string, bedType: Bed['type']): Participant {
  return {
    id,
    name: `Guest ${id}`,
    requestedRoomType: roomType,
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

describe('autoAllocate', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('when there are matches', () => {
    it('sets autoAllocateResult.matchesCount when guests are assigned', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single bed'])]
      const participants = [makeParticipant('p1', 'Standard', 'single bed')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      expect(useWorkspaceStore.getState().autoAllocateResult).toEqual({ matchesCount: 1 })
    })

    it('increments history when guests are assigned', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single bed'])]
      const participants = [makeParticipant('p1', 'Standard', 'single bed')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      expect(useWorkspaceStore.getState().historyIndex).toBe(1)
      expect(useWorkspaceStore.getState().history).toHaveLength(2)
    })
  })

  describe('when there are no matches', () => {
    it('sets autoAllocateResult.matchesCount to 0 when no guests match', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single bed'])]
      const participants = [makeParticipant('p1', 'Deluxe', 'double bed (shared)')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      expect(useWorkspaceStore.getState().autoAllocateResult).toEqual({ matchesCount: 0 })
    })

    it('does not modify history when no guests match', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single bed'])]
      const participants = [makeParticipant('p1', 'Deluxe', 'double bed (shared)')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      expect(useWorkspaceStore.getState().historyIndex).toBe(0)
      expect(useWorkspaceStore.getState().history).toHaveLength(1)
    })
  })

  describe('clearAutoAllocateResult', () => {
    it('sets autoAllocateResult to null', () => {
      const rooms = [makeRoom('Room A', 'Standard', ['single bed'])]
      const participants = [makeParticipant('p1', 'Standard', 'single bed')]
      resetStore(rooms, participants)
      useWorkspaceStore.getState().autoAllocate()
      useWorkspaceStore.getState().clearAutoAllocateResult()
      expect(useWorkspaceStore.getState().autoAllocateResult).toBeNull()
    })
  })
})

describe('resetAllocations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('clears all bed assignments and commits to history', () => {
    const rooms = [makeRoom('Room A', 'Standard', ['single bed'])]
    const participants = [makeParticipant('p1', 'Standard', 'single bed')]
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
