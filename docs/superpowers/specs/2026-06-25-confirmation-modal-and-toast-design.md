# Confirmation Modal & Toast Notification

**Date:** 2026-06-25
**Scope:** Replace `window.confirm` / `window.alert` in the Allocation page with native React UI

---

## Problem

`resetAllocations` uses `window.confirm` and `autoAllocate` uses `window.alert`. Both are browser-native dialogs that break the visual continuity of the app and cannot be styled.

---

## Solution

- **Reset Board** → centered overlay `ConfirmationModal` (blocks until user chooses)
- **Auto-Allocate result** → fixed top-right `ToastNotification` (non-blocking, auto-dismisses)

---

## New Components (`src/shared/components/`)

### `ConfirmationModal.tsx`

Props:
- `title: string`
- `message: string`
- `confirmLabel: string`
- `confirmVariant: 'danger' | 'primary'`
- `onConfirm: () => void`
- `onCancel: () => void`

Behaviour:
- Fixed full-screen semi-transparent backdrop
- White `rounded-xl` card centered on screen
- Two buttons: Cancel (slate) + Confirm (rose for danger, indigo for primary)
- Closes on backdrop click or Escape key

### `ToastNotification.tsx`

Props:
- `message: string`
- `variant: 'success' | 'warning'`
- `onDismiss: () => void`

Behaviour:
- Fixed top-right position
- Auto-dismisses after **8 seconds**
- Manual ✕ button always available
- Slide-from-right + fade-in animation on mount

---

## Store Changes (`useWorkspaceStore.ts`)

### New state field
```ts
autoAllocateResult: { matchesCount: number } | null
```

### New action
```ts
clearAutoAllocateResult: () => void
```

### `resetAllocations` change
Remove `window.confirm`. The action becomes a pure mutation: clears all bed assignments and commits to history.

### `autoAllocate` change
Remove both `window.alert` calls. Instead:
- When `matchesCount > 0`: call `commitWorkspaceState`, then `set({ autoAllocateResult: { matchesCount } })`
- When `matchesCount === 0`: only `set({ autoAllocateResult: { matchesCount: 0 } })` — **no `commitWorkspaceState` call, no history entry created**

**Invariant:** a zero-match auto-allocate run must never push a new history entry. This will be covered by a regression test.

---

## `AllocationBoard` Changes

- Add local state `showResetModal: boolean` (default `false`)
- Reset button sets `showResetModal = true` instead of calling `resetAllocations` directly
- `ConfirmationModal` rendered when `showResetModal` is true; on Confirm: calls `resetAllocations()` and sets `showResetModal = false`; on Cancel: sets `showResetModal = false`
- Read `autoAllocateResult` and `clearAutoAllocateResult` from store
- Render `<ToastNotification>` when `autoAllocateResult` is non-null, passing `onDismiss={clearAutoAllocateResult}`

### Toast message content
| Condition | Variant | Message |
|---|---|---|
| `matchesCount > 0` | `success` | "Auto-allocation complete! {matchesCount} guests have been assigned." |
| `matchesCount === 0` | `warning` | "No matches found. No vacant beds match any unassigned guest preferences." |

---

## Testing

- `ConfirmationModal.test.tsx`: renders title/message; calls onConfirm on Confirm click; calls onCancel on Cancel click; calls onCancel on backdrop click; calls onCancel on Escape key
- `ToastNotification.test.tsx`: renders message; calls onDismiss on ✕ click; calls onDismiss after 8 seconds (fake timers)
- `useWorkspaceStore` tests for `autoAllocate`: history length unchanged when no matches found; history length incremented when matches found; `autoAllocateResult` set correctly for both cases
- `AllocationBoard` tests updated: clicking Reset shows ConfirmationModal; confirming reset calls `resetAllocations`; auto-allocate result triggers toast

---

## Visual Style

Follows existing app design language:
- Backdrop: `bg-black/40` or similar semi-transparent overlay
- Modal card: `bg-white rounded-xl shadow-xl border border-slate-200 p-6`
- Danger confirm button: rose palette (matching Reset button)
- Toast success: indigo/emerald palette; toast warning: amber palette (matching existing `assignError` banner tones)
- The `frontend-design` skill will be consulted during implementation for visual details
