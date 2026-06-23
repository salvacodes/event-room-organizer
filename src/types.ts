/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Bed {
  id: string;                      // Unique ID (e.g., "room-101-bed-0")
  type: "single bed" | "double bed (single occupancy)" | "double bed (shared)"; // canonical configurations
  label?: string;                  // Screen representation e.g. "Double Bed (Shared) - Spot 1"
  assignedParticipantId?: string | null;
}

export interface Room {
  id: string;                      // Room designation (acts as both name and identifier, e.g., "A101 - Standard Solo")
  beds: Bed[];                     // Beds configured in this room
  capacity: number;                // Total capacity of people (usually sum of bed capabilities, e.g. Single=1, Double=2)
  category: string;                // "Standard", "VIP", "Cabin", "Dorm", etc.
}

export interface Participant {
  id: string;                      // Unique ID
  name: string;                    // Guest's name
  requestedRoomType: string;       // Preferred room category
  requestedBedType: string;        // Preferred bed type (e.g., "Single", "Double")
  sharingPreferences: string;      // Free text notes (e.g., "Agreed to share with Alex Smith")
  assignedRoomId?: string | null;  // Assigned room ID
  assignedBedId?: string | null;   // Assigned bed ID (within that room)
}

export interface HistoryState {
  rooms: Room[];
  participants: Participant[];
}
