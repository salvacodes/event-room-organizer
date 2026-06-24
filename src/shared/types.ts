export interface Bed {
  id: string
  type: 'single bed' | 'double bed (single occupancy)' | 'double bed (shared)'
  label?: string
  assignedParticipantId?: string | null
}

export interface Room {
  id: string
  beds: Bed[]
  capacity: number
  category: string
}

export interface Participant {
  id: string
  name: string
  requestedRoomType: string
  requestedBedType: string
  sharingPreferences: string
  assignedRoomId?: string | null
  assignedBedId?: string | null
}

export interface HistoryState {
  rooms: Room[]
  participants: Participant[]
}
