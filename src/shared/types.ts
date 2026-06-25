import type { BedType } from './bedTypes'

export type { BedType }

export interface Bed {
  id: string
  type: BedType
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
  requestedRoomType: string[]
  requestedBedType: BedType
  sharingPreferences: string
  assignedRoomId?: string | null
  assignedBedId?: string | null
}

export interface HistoryState {
  rooms: Room[]
  participants: Participant[]
}
