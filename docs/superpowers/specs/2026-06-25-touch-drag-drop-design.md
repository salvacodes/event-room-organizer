# Touch Drag-and-Drop Support via @dnd-kit

**Date:** 2026-06-25
**Status:** Approved

## Goal

Make the participant drag-and-drop allocation work on touch devices (tablets) in addition to the existing mouse behaviour.

## Approach

Replace the native HTML5 Drag and Drop API with `@dnd-kit/core`, which uses the Pointer Events API and handles mouse and touch in a single unified code path.

## Architecture

`<DndContext>` is mounted inside `AllocationBoard`, wrapping both `ParticipantPool` and the room cards grid. It owns the `onDragStart` and `onDragEnd` callbacks that bridge the DnD lifecycle to the Zustand store.

**Files changed:**
- `AllocationBoard.tsx` — adds `<DndContext>` and `<DragOverlay>`
- `ParticipantPool.tsx` — replaces `draggable` + HTML5 event handlers with `useDraggable`
- `RoomCard.tsx` — replaces `onDragOver` / `onDragLeave` / `onDrop` with `useDroppable`
- `RoomCard.test.tsx` — removes brittle `fireEvent.drop` tests; assignment logic tested by calling the store action directly

**No changes to:**
- Zustand store (`draggedParticipant`, `assignParticipant`, `assignError`, etc.)
- All visual highlighting logic in `RoomCard` (reads `draggedParticipant` as before)
- Compatibility validation (stays in the store's `assignParticipant`)

## Data Flow

1. `useDraggable(participantId, { data: { participantId } })` — attaches drag behaviour to each participant card; exposes `{ attributes, listeners, setNodeRef, isDragging }`.
2. `useDroppable(bedId)` — attaches drop-target behaviour to each bed slot `<div>`; exposes `{ setNodeRef }`.
3. `DndContext.onDragStart` — receives `event.active.id` (participantId), calls `setDraggedParticipant`.
4. `DndContext.onDragEnd` — receives `event.active.data.current.participantId` and `event.over?.id` (bedId or null). If a bed was targeted, calls `assignParticipant(participantId, roomId, bedId)`. Always calls `setDraggedParticipant(null)`.
5. `roomId` is resolved inside `RoomCard` by passing it through the `useDroppable` data: `useDroppable(bedId, { data: { roomId } })`, read back as `event.over.data.current.roomId`.

## Visual Feedback

- **Ghost element (`DragOverlay`):** renders a simplified participant card (name + room/bed type tags only) that follows the pointer/finger. Required for touch — without it the user sees nothing moving. Mounted inside `DndContext` in `AllocationBoard`.
- **Source card opacity:** `isDragging` from `useDraggable` adds `opacity-50` to the original card while the ghost is floating.
- **Room/bed highlighting:** unchanged — driven by `draggedParticipant` in the Zustand store, exactly as before.

## Testing

Existing `RoomCard.test.tsx` drop tests (`fireEvent.drop`) are removed because the drop handler no longer lives on the bed element — it lives on `DndContext.onDragEnd`. They are replaced with direct store-action tests that verify `assignParticipant` is called with the correct arguments. This simplifies the tests and removes their dependency on DnD event mechanics.

No new unit tests are needed for touch behaviour — that is covered by `@dnd-kit`'s own test suite.

## Dependencies Added

- `@dnd-kit/core` — the core drag-and-drop library (~10 KB gzipped)
