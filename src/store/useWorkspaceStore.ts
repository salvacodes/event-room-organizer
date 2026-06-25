import { create } from 'zustand'
import { parseBedConfiguration, parseCSV, parseRoomTypes } from '../features/csv-import/csvParser'
import { SAMPLE_EXACT_REGISTRATION_CSV, SAMPLE_EXACT_ROOMS_CSV } from '../features/csv-import/sampleData'
import type { BedType } from '../shared/bedTypes'
import { getBedTypeLabel } from '../shared/bedTypes'
import type { HistoryState, Participant, Room } from '../shared/types'

type ActiveTab = 'board' | 'csv' | 'report'

interface WorkspaceStore {
  rooms: Room[]
  participants: Participant[]
  history: HistoryState[]
  historyIndex: number
  draggedParticipant: Participant | null
  assignError: string | null
  autoAllocateResult: { matchesCount: number } | null
  activeTab: ActiveTab
  roomTypeFilter: string

  loadData: (rooms: Room[], participants: Participant[]) => void
  assignParticipant: (participantId: string, roomId: string, bedId: string) => void
  removeAssignment: (participantId: string) => void
  resetAllocations: () => void
  autoAllocate: () => void
  undo: () => void
  redo: () => void
  setDraggedParticipant: (participant: Participant | null) => void
  clearAssignError: () => void
  clearAutoAllocateResult: () => void
  setActiveTab: (tab: ActiveTab) => void
  setRoomTypeFilter: (filter: string) => void
}

const ROOMS_KEY = 'event_room_organizer_rooms_v1'
const PARTICIPANTS_KEY = 'event_room_organizer_participants_v1'

function buildDefaultDataset(): { rooms: Room[]; participants: Participant[] } {
  const roomRows = parseCSV(SAMPLE_EXACT_ROOMS_CSV)
  const rooms: Room[] = []
  for (let i = 1; i < roomRows.length; i++) {
    const row = roomRows[i]
    if (row.length < 3) continue
    const id = row[0]
    const category = row[1] || 'Standard'
    const beds = parseBedConfiguration(row[2], id)
    rooms.push({ id, beds, capacity: beds.length, category })
  }

  const guestRows = parseCSV(SAMPLE_EXACT_REGISTRATION_CSV)
  const participants: Participant[] = []
  for (let i = 1; i < guestRows.length; i++) {
    const row = guestRows[i]
    if (row.length < 1 || !row[0]) continue
    participants.push({
      id: `p-default-${i}`,
      name: row[0],
      requestedRoomType: parseRoomTypes(row[1] || 'Type A'),
      requestedBedType: (row[2] as BedType) || 'single',
      sharingPreferences: row[3] || '',
      assignedRoomId: null,
      assignedBedId: null
    })
  }

  return { rooms, participants }
}

function loadInitialState(): Pick<WorkspaceStore, 'rooms' | 'participants' | 'history' | 'historyIndex'> {
  const savedRooms = localStorage.getItem(ROOMS_KEY)
  const savedParticipants = localStorage.getItem(PARTICIPANTS_KEY)

  if (savedRooms && savedParticipants) {
    try {
      const rooms = JSON.parse(savedRooms) as Room[]
      const rawParticipants = JSON.parse(savedParticipants) as Array<
        Omit<Participant, 'requestedRoomType'> & { requestedRoomType: string | string[] }
      >
      const participants: Participant[] = rawParticipants.map((p) => ({
        ...p,
        requestedRoomType: Array.isArray(p.requestedRoomType)
          ? p.requestedRoomType
          : [p.requestedRoomType].filter(Boolean)
      }))
      return { rooms, participants, history: [{ rooms, participants }], historyIndex: 0 }
    } catch {
      console.warn('Stale local storage format. Re-rendering default pre-sets.')
    }
  }

  const { rooms, participants } = buildDefaultDataset()
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms))
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants))
  return { rooms, participants, history: [{ rooms, participants }], historyIndex: 0 }
}

export const useWorkspaceStore = create<WorkspaceStore>()((set, get) => {
  function commitWorkspaceState(rooms: Room[], participants: Participant[]) {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms))
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants))

    const { history, historyIndex } = get()
    const currentHistory = history.slice(0, historyIndex + 1)
    const updatedHistory = [...currentHistory, { rooms, participants }]
    if (updatedHistory.length > 50) updatedHistory.shift()

    set({ rooms, participants, history: updatedHistory, historyIndex: updatedHistory.length - 1 })
  }

  return {
    ...loadInitialState(),
    draggedParticipant: null,
    assignError: null,
    autoAllocateResult: null,
    activeTab: 'board' as ActiveTab,
    roomTypeFilter: 'all',

    loadData: (rooms, participants) => {
      commitWorkspaceState(rooms, participants)
      set({ activeTab: 'board' })
    },

    assignParticipant: (participantId, roomId, bedId) => {
      const { rooms, participants } = get()
      const updatedRooms = rooms.map((r) => ({ ...r, beds: r.beds.map((b) => ({ ...b })) }))
      const updatedParticipants = participants.map((p) => ({ ...p }))

      const participant = updatedParticipants.find((p) => p.id === participantId)
      if (!participant) return
      const room = updatedRooms.find((r) => r.id === roomId)
      if (!room) return
      const bed = room.beds.find((b) => b.id === bedId)
      if (!bed) return

      const normStr = (s: string) => (s || '').trim().toLowerCase()
      const roomTypeMatch = participant.requestedRoomType.some((rt) => normStr(rt) === normStr(room.category))
      if (!roomTypeMatch || participant.requestedBedType !== bed.type) {
        set({
          assignError: `Assignment Blocked: "${participant.name}" requested Room Category [${participant.requestedRoomType.join(' / ')}] and Bed Config [${getBedTypeLabel(participant.requestedBedType)}]. You attempted to place them in a Room of Category [${room.category}] and Bed Config [${bed.label || getBedTypeLabel(bed.type)}].`
        })
        return
      }

      set({ assignError: null })

      if (participant.assignedRoomId && participant.assignedBedId) {
        const prevRoom = updatedRooms.find((r) => r.id === participant.assignedRoomId)
        const prevBed = prevRoom?.beds.find((b) => b.id === participant.assignedBedId)
        if (prevBed) prevBed.assignedParticipantId = null
      }

      if (bed.assignedParticipantId) {
        const evicted = updatedParticipants.find((p) => p.id === bed.assignedParticipantId)
        if (evicted) {
          evicted.assignedRoomId = null
          evicted.assignedBedId = null
        }
      }

      bed.assignedParticipantId = participantId
      participant.assignedRoomId = roomId
      participant.assignedBedId = bedId

      commitWorkspaceState(updatedRooms, updatedParticipants)
    },

    removeAssignment: (participantId) => {
      const { rooms, participants } = get()
      const updatedRooms = rooms.map((r) => ({ ...r, beds: r.beds.map((b) => ({ ...b })) }))
      const updatedParticipants = participants.map((p) => ({ ...p }))

      const guest = updatedParticipants.find((p) => p.id === participantId)
      if (!guest) return

      if (guest.assignedRoomId && guest.assignedBedId) {
        const room = updatedRooms.find((r) => r.id === guest.assignedRoomId)
        const bed = room?.beds.find((b) => b.id === guest.assignedBedId)
        if (bed) bed.assignedParticipantId = null
      }

      guest.assignedRoomId = null
      guest.assignedBedId = null

      commitWorkspaceState(updatedRooms, updatedParticipants)
    },

    resetAllocations: () => {
      const { rooms, participants } = get()
      const clearedRooms = rooms.map((r) => ({
        ...r,
        beds: r.beds.map((b) => ({ ...b, assignedParticipantId: null }))
      }))
      const clearedParticipants = participants.map((p) => ({ ...p, assignedRoomId: null, assignedBedId: null }))
      commitWorkspaceState(clearedRooms, clearedParticipants)
    },

    autoAllocate: () => {
      set({ assignError: null })
      const { rooms, participants } = get()
      const updatedRooms = rooms.map((r) => ({ ...r, beds: r.beds.map((b) => ({ ...b })) }))
      const updatedParticipants = participants.map((p) => ({ ...p }))

      let matchesCount = 0

      for (const participant of updatedParticipants) {
        if (participant.assignedRoomId) continue
        let assigned = false

        for (const room of updatedRooms) {
          if (
            !participant.requestedRoomType.some((rt) => rt.trim().toLowerCase() === room.category.trim().toLowerCase())
          )
            continue

          for (const bed of room.beds) {
            if (bed.assignedParticipantId) continue
            if (bed.type !== participant.requestedBedType) continue

            bed.assignedParticipantId = participant.id
            participant.assignedRoomId = room.id
            participant.assignedBedId = bed.id
            assigned = true
            matchesCount++
            break
          }
          if (assigned) break
        }
      }

      if (matchesCount > 0) {
        commitWorkspaceState(updatedRooms, updatedParticipants)
      }
      set({ autoAllocateResult: { matchesCount } })
    },

    undo: () => {
      const { history, historyIndex } = get()
      if (historyIndex <= 0) return
      const prevIndex = historyIndex - 1
      const state = history[prevIndex]
      localStorage.setItem(ROOMS_KEY, JSON.stringify(state.rooms))
      localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(state.participants))
      set({ rooms: state.rooms, participants: state.participants, historyIndex: prevIndex })
    },

    redo: () => {
      const { history, historyIndex } = get()
      if (historyIndex >= history.length - 1) return
      const nextIndex = historyIndex + 1
      const state = history[nextIndex]
      localStorage.setItem(ROOMS_KEY, JSON.stringify(state.rooms))
      localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(state.participants))
      set({ rooms: state.rooms, participants: state.participants, historyIndex: nextIndex })
    },

    setDraggedParticipant: (participant) => set({ draggedParticipant: participant }),
    clearAssignError: () => set({ assignError: null }),
    clearAutoAllocateResult: () => set({ autoAllocateResult: null }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setRoomTypeFilter: (filter) => set({ roomTypeFilter: filter })
  }
})
