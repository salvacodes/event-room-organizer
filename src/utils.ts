/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, Bed, Participant } from "./types";

/**
 * Parses a CSV string into an array of string arrays, respecting double quotes.
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"'; // escaped quote
        i++;
      } else {
        inQuotes = !inQuotes; // toggle quotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue.trim());
      currentValue = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(currentValue.trim());
      if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
        lines.push(row);
      }
      row = [];
      currentValue = "";
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentValue += char;
    }
  }

  // Push last field & row
  if (currentValue !== "" || row.length > 0) {
    row.push(currentValue.trim());
  }
  if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
    lines.push(row);
  }

  return lines;
}

/**
 * Parses bed configuration string like "1 single bed", "1 double bed (single occupancy)", or "1 double bed (shared), 2 single bed"
 * returns collection of Bed items.
 */
export function parseBedConfiguration(configStr: string, roomId: string): Bed[] {
  if (!configStr) return [];
  const beds: Bed[] = [];
  
  // Try split by comma or semi-colon
  const elements = configStr.split(/[,;]/);
  let bedIndex = 0;

  for (const element of elements) {
    const trimmed = element.trim();
    if (!trimmed) continue;

    // Check if starts with a number, like "2 single bed" or "1 double bed (shared)"
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    let count = 1;
    let bedDescription = trimmed;
    if (match) {
      count = parseInt(match[1], 10);
      bedDescription = match[2].trim();
    }

    const norm = bedDescription.toLowerCase();

    if (norm.includes("single occupancy") || norm.includes("for single") || norm.includes("double occupancy single") || norm.includes("(single occupancy)")) {
      // "double bed (single occupancy)"
      for (let i = 0; i < count; i++) {
        beds.push({
          id: `${roomId}-bed-${bedIndex++}`,
          type: "double bed (single occupancy)",
          label: "Double Bed (Single Occupancy)",
          assignedParticipantId: null,
        });
      }
    } else if (norm.includes("shared") || norm.includes("2 people") || norm.includes("for 2") || norm.includes("shared for 2 people") || norm.includes("(shared)")) {
      // "double bed (shared)" - generates 2 occupant slots
      for (let i = 0; i < count; i++) {
        const uniqueBedId = bedIndex++;
        beds.push({
          id: `${roomId}-bed-${uniqueBedId}-spot1`,
          type: "double bed (shared)",
          label: "Double Bed (Shared) - Slot A",
          assignedParticipantId: null,
        });
        beds.push({
          id: `${roomId}-bed-${uniqueBedId}-spot2`,
          type: "double bed (shared)",
          label: "Double Bed (Shared) - Slot B",
          assignedParticipantId: null,
        });
      }
    } else {
      // "single bed"
      for (let i = 0; i < count; i++) {
        beds.push({
          id: `${roomId}-bed-${bedIndex++}`,
          type: "single bed",
          label: "Single Bed",
          assignedParticipantId: null,
        });
      }
    }
  }

  return beds;
}

/**
 * Calculates bed sleep capacity based on bed type.
 * Note: Our parser breaks "shared" beds into individual single-occupancy slots directly,
 * so each slot in room.beds represents room capacity = 1 occupant.
 */
export function getBedCapacity(bedType: string): number {
  return 1;
}

/**
 * Generates sample data for the User's exact room setup configuration
 */
export const SAMPLE_EXACT_ROOMS_CSV = `Room,Type,Beds
A101 - Standard Solo,Type A,1 double bed (single occupancy)
A102 - Standard Solo,Type A,1 double bed (single occupancy)
A103 - Standard Solo,Type A,1 double bed (single occupancy)
A104 - Standard Solo,Type A,1 double bed (single occupancy)
A105 - Standard Solo,Type A,1 double bed (single occupancy)
B101 - Standard Duo,Type B,1 double bed (shared)
B102 - Standard Duo,Type B,1 double bed (shared)
B103 - Standard Duo,Type B,1 double bed (shared)
C101 - Master Suite,Type C,"1 double bed (single occupancy), 1 single bed"
C102 - Master Suite,Type C,"1 double bed (single occupancy), 1 single bed"
C103 - Master Suite,Type C,"1 double bed (single occupancy), 1 single bed"
C104 - Master Suite,Type C,"1 double bed (single occupancy), 1 single bed"
C105 - Master Suite,Type C,"1 double bed (single occupancy), 1 single bed"
C106 - Master Suite,Type C,"1 double bed (single occupancy), 1 single bed"
C107 - Master Suite,Type C,"1 double bed (single occupancy), 1 single bed"`;

export const SAMPLE_EXACT_REGISTRATION_CSV = `Name,Room,Bed,Notes
"David Miller",Type B,double bed (shared),"Agreed to share bed with Harry Peterson"
"Harry Peterson",Type B,double bed (shared),"Agreed to share bed with David Miller"
"Alice Vance",Type C,double bed (single occupancy),"Agreed to share room with Bob Vance"
"Bob Vance",Type C,single bed,"Agreed to share room with Alice Vance"
"Charlotte Webb",Type A,double bed (single occupancy),Prefer quiet corner if available
"Sarah Jenkins",Type C,single bed,Excited for any single bed option!
"Emily Watson",Type C,single bed,No specific room preference
"Frank Castle",Type A,double bed (single occupancy),Prefer isolated room
"Grace Hopper",Type C,double bed (single occupancy),No sharing preferred
"Tony Stark",Type C,double bed (single occupancy),Needs high-speed outlet nearby
"Steve Rogers",Type C,single bed,"Comfortable bunking with Bucky Barnes"
"Bucky Barnes",Type C,single bed,"Agreed to share with Steve Rogers"`;

/**
 * Generates sample data for "Summer Forest Retreat"
 */
export const SAMPLE_RETREAT_ROOMS_CSV = `Room,Type,Beds
101 - Pine Cabin,Standard,1 double bed (single occupancy)
102 - Lakeside Cabin,VIP,1 double bed (shared)
103 - Oak Lodge,Dorm,4 single bed
104 - River Cabin,Standard,1 double bed (shared)
105 - Mountain Nest,VIP,1 double bed (single occupancy)
106 - Valley Shelter,Standard,2 single bed
107 - Sunset Dome,VIP,1 double bed (shared)`;

export const SAMPLE_RETREAT_REGISTRATION_CSV = `Name,Room,Bed,Notes
"David Miller",Standard,single bed,"Agreed to share with Harry Peterson"
"Harry Peterson",Standard,single bed,"Agreed to share with David Miller"
"Alice Vance",VIP,double bed (shared),"Agreed to share with Bob Vance"
"Bob Vance",VIP,double bed (shared),"Agreed to share with Alice Vance"
"Charlotte Webb",Standard,double bed (single occupancy),Prefer private room if available
"Sarah Jenkins",Dorm,single bed,Excited for the group dorm!
"Emily Watson",Dorm,single bed,No preference
"Frank Castle",Standard,single bed,Prefer quiet room if possible
"Grace Hopper",VIP,double bed (single occupancy),No sharing. Needs private bed
"Tony Stark",VIP,double bed (shared),Needs high-speed internet nearby
"Steve Rogers",Dorm,single bed,Agreed to share bunk with Bucky
"Bucky Barnes",Dorm,single bed,Agreed to share bunk with Steve
"Natasha Romanoff",Standard,single bed,No notes
"Clint Barton",Standard,single bed,Agreed to share with Natasha`;

/**
 * Generates sample data for "Executive Leadership Summit"
 */
export const SAMPLE_CORP_ROOMS_CSV = `Room,Type,Beds
Suite A - Executive Suite,VIP Suite,1 double bed (single occupancy)
Suite B - Director Suite,VIP Suite,1 double bed (single occupancy)
Room 201 - Maple Room,Double Room,1 double bed (shared)
Room 202 - Birch Room,Double Room,1 double bed (shared)
Room 203 - Cedar Room,Single Room,1 double bed (single occupancy)
Room 204 - Aspen Room,Single Room,1 double bed (single occupancy)
Room 205 - Spruce Room,Double Room,2 single bed`;

export const SAMPLE_CORP_REGISTRATION_CSV = `Name,Room,Bed,Notes
"CEO Elena Rostova",VIP Suite,double bed (single occupancy),Wants private suite
"CTO Marcus Aurelius",VIP Suite,double bed (single occupancy),Need late night desk access
"Devin Smith",Double Room,double bed (shared),"Agreed to share with Josh Adams"
"Josh Adams",Double Room,double bed (shared),"Agreed to share with Devin Smith"
"Anna Lee",Double Room,double bed (shared),"Agreed to share with Clara Oswald"
"Clara Oswald",Double Room,double bed (shared),"Agreed to share with Anna Lee"
"Oliver Queen",Single Room,double bed (single occupancy),No sharing
"Barry Allen",Single Room,double bed (single occupancy),Prefers rapid early morning checkouts
"Diana Prince",Double Room,single bed,Agreed to share room
"Arthur Curry",Double Room,single bed,Agreed to share room`;
