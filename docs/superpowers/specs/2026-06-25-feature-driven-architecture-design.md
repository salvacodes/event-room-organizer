# Feature-Driven Architecture Refactor

**Date:** 2026-06-25
**Status:** Approved

## Goal

Refactor from a flat layer-based structure (`src/components/`, `src/utils.ts`, `src/types.ts`) to vertical feature slices.
Each feature owns its own components and utilities. Shared state moves to a Zustand store. `App.tsx` becomes a thin shell.

## Target Structure

```
src/
  features/
    csv-import/
      CsvImport.tsx       — unchanged component, now self-contained
      csvParser.ts        — parseCSV + parseBedConfiguration (from utils.ts)
      sampleData.ts       — SAMPLE_EXACT_ROOMS_CSV + SAMPLE_EXACT_REGISTRATION_CSV (from utils.ts)
    allocation/
      AllocationBoard.tsx — new: board JSX extracted from App.tsx (~150 lines)
      ParticipantPool.tsx — unchanged component
      RoomCard.tsx        — unchanged component
      RoomCard.test.tsx   — unchanged test
    report/
      PrintReport.tsx     — unchanged component
  store/
    useWorkspaceStore.ts  — Zustand store: all state + actions (~150 lines)
  shared/
    types.ts              — Room, Bed, Participant, HistoryState
  App.tsx                 — shell only: header, nav, tab switch (~80 lines)
  main.tsx
  index.css
  testSetup.ts
```

**Deleted:**
- `src/types.ts` → moved to `src/shared/types.ts`
- `src/utils.ts` → split into `csv-import/csvParser.ts` and `csv-import/sampleData.ts`; `getBedCapacity` (always returns 1, no callers) deleted
- `src/components/` directory removed entirely

## Zustand Store

**State shape:**
```ts
interface WorkspaceStore {
  rooms: Room[]
  participants: Participant[]
  history: HistoryState[]
  historyIndex: number
  draggedParticipant: Participant | null
  assignError: string | null
}
```

**Actions:**
| Action | Source | Notes |
|--------|--------|-------|
| `commitWorkspaceState(rooms, participants)` | App.tsx | Internal only — not exported |
| `loadDefaultRetreatDataset()` | App.tsx | Parses SAMPLE_EXACT_* CSVs on boot |
| `loadData(rooms, participants)` | App.tsx `handleDataLoaded` | Called from CsvImport |
| `assignParticipant(participantId, roomId, bedId)` | App.tsx `handleAssignParticipant` | Sets assignError on mismatch |
| `removeAssignment(participantId)` | App.tsx `handleRemoveAssignment` | |
| `resetAllocations()` | App.tsx `handleResetAllocations` | Owns window.confirm |
| `autoAllocate()` | App.tsx `handleAutoAllocate` | Owns window.alert |
| `undo()` | App.tsx `handleUndo` | |
| `redo()` | App.tsx `handleRedo` | |
| `setDraggedParticipant(participant \| null)` | App.tsx setter | |
| `clearAssignError()` | App.tsx setter | |

`window.confirm` and `window.alert` calls stay co-located with the actions that need them (`resetAllocations`, `autoAllocate`).

## Feature Slice Details

### `csv-import/`

- `CsvImport.tsx` loses all props (`onDataLoaded`, `currentRoomsCount`, `currentParticipantsCount`). It calls `loadData` from the store and reads `rooms.length` / `participants.length` from the store directly.
- `csvParser.ts` and `sampleData.ts` are pure modules — no store dependency. Imported by both `CsvImport.tsx` and `useWorkspaceStore.ts`.

### `allocation/`

- `AllocationBoard.tsx` (new) contains the board JSX currently embedded in `App.tsx`: the two-column grid, empty-state card, error banner, drag-and-drop instruction card, and the Auto-Allocate/Reset Board action buttons (moved from the nav bar). Reads from store, calls store actions. No props.
- `ParticipantPool.tsx` loses all props (`participants`, `rooms`, `onManualAssign`, `onRemoveAssignment`, `onDragStartGuest`, `onDragEndGuest`). Reads from store, calls store actions directly.
- `RoomCard.tsx` loses `participants`, `onAssignParticipant`, `onRemoveAssignment`, `draggedParticipant` props. Reads those from the store directly. Retains `room: Room` as a prop — the parent iterates rooms and passes the specific room down.

### `report/`

- `PrintReport.tsx` loses `rooms` and `participants` props. Reads from store directly.

### `App.tsx` (shell)

Owns only `activeTab` state. Renders header, nav with tab buttons, and the active feature:

```tsx
const [activeTab, setActiveTab] = useState<'board' | 'csv' | 'report'>('board')

// header JSX
// nav JSX (tab buttons only, no action buttons)
// {activeTab === 'board' && <AllocationBoard />}
// {activeTab === 'csv' && <CsvImport />}
// {activeTab === 'report' && <PrintReport />}
```

The inline `<PrintReport />` in the print injection div at the bottom of `App.tsx` remains — it reads from the store so no props needed.

## What Does Not Change

- Component JSX and styling — no visual changes
- Business logic — all allocation rules, validation, undo/redo, auto-allocate algorithm stay identical; they just move into the store
- localStorage keys (`event_room_organizer_rooms_v1`, `event_room_organizer_participants_v1`)
- Test coverage — `RoomCard.test.tsx` moves with `RoomCard.tsx` into `features/allocation/` and must be updated: the four props being removed (`participants`, `onAssignParticipant`, `onRemoveAssignment`, `draggedParticipant`) are replaced with a Zustand store mock; the `types` import path updates to `'../../shared/types'`; the `room` prop remains and the assertions stay identical
- `index.html`, `vite.config.ts`, `tsconfig.json`, `biome.json`, CI pipeline

## New Dependency

- `zustand` — added to `dependencies` in `package.json`
