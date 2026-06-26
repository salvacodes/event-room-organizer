import type { DragCancelEvent, DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { RotateCcw, RotateCw, Sparkles, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationModal from '../../shared/components/ConfirmationModal'
import ToastNotification from '../../shared/components/ToastNotification'
import type { Participant } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import ParticipantPool from './ParticipantPool'
import RoomCard from './RoomCard'

export default function AllocationBoard() {
  const allRooms = useWorkspaceStore((s) => s.rooms)
  const roomTypeFilter = useWorkspaceStore((s) => s.roomTypeFilter)
  const rooms = roomTypeFilter === 'all' ? allRooms : allRooms.filter((r) => r.category === roomTypeFilter)
  const assignError = useWorkspaceStore((s) => s.assignError)
  const autoAllocate = useWorkspaceStore((s) => s.autoAllocate)
  const resetAllocations = useWorkspaceStore((s) => s.resetAllocations)
  const clearAssignError = useWorkspaceStore((s) => s.clearAssignError)
  const historyIndex = useWorkspaceStore((s) => s.historyIndex)
  const historyLength = useWorkspaceStore((s) => s.history.length)
  const undo = useWorkspaceStore((s) => s.undo)
  const redo = useWorkspaceStore((s) => s.redo)
  const autoAllocateResult = useWorkspaceStore((s) => s.autoAllocateResult)
  const clearAutoAllocateResult = useWorkspaceStore((s) => s.clearAutoAllocateResult)
  const assignParticipant = useWorkspaceStore((s) => s.assignParticipant)
  const setDraggedParticipant = useWorkspaceStore((s) => s.setDraggedParticipant)
  const draggedParticipant = useWorkspaceStore((s) => s.draggedParticipant)

  const { t } = useTranslation('allocation')
  const [showResetModal, setShowResetModal] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const toastMessage =
    autoAllocateResult === null
      ? null
      : autoAllocateResult.matchesCount > 0
        ? t('toast.successMessage', { count: autoAllocateResult.matchesCount })
        : t('toast.noMatchesMessage')

  const toastVariant = autoAllocateResult?.matchesCount ? 'success' : 'warning'

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedParticipant(event.active.data.current?.participant as Participant)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedParticipant(null)
    if (!event.over) return
    const participantId = event.active.id as string
    const bedId = event.over.id as string
    const roomId = event.over.data.current?.roomId as string
    if (bedId && roomId) {
      assignParticipant(participantId, roomId, bedId)
    }
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    setDraggedParticipant(null)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-6 h-full min-h-0">
        <div className="h-full overflow-y-auto w-80 flex-shrink-0 print:hidden custom-scrollbar">
          <ParticipantPool />
        </div>

        <div className="flex-1 min-w-0 h-full overflow-y-auto space-y-6 pb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800">{t('board.title')}</h2>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t('board.subtitle')}</p>
            </div>
            <div className="items-center gap-2 hidden lg:flex flex-shrink-0">
              <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-lg">
                <button
                  type="button"
                  id="undo-btn"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-20 text-slate-600 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title={t('board.undoTitle')}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-300 mx-1" />
                <button
                  type="button"
                  id="redo-btn"
                  onClick={redo}
                  disabled={historyIndex >= historyLength - 1}
                  className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-20 text-slate-600 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title={t('board.redoTitle')}
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                id="header-auto-allocate-btn"
                onClick={autoAllocate}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-150 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title={t('board.autoAllocateTitle')}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('board.autoAllocate')}
              </button>
              <button
                type="button"
                id="header-clear-all-btn"
                onClick={() => setShowResetModal(true)}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-150 transition-all flex items-center gap-1.5 cursor-pointer"
                title={t('board.resetTitle')}
              >
                <XCircle className="w-3.5 h-3.5" />
                {t('board.reset')}
              </button>
            </div>
          </div>

          {assignError && (
            <div
              id="allocation-error-banner"
              className="bg-rose-50 border-2 border-rose-200 text-rose-900 rounded-xl p-4 flex items-start gap-3 relative animate-fadeIn shadow-xs"
            >
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 pr-16 text-left">
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-rose-800 flex items-center gap-1">
                  ⚠️ {t('board.errorTitle')}
                </h4>
                <p className="text-xs text-rose-700 font-semibold mt-1 leading-normal">
                  {assignError ? t(assignError.key, assignError.params) : null}
                </p>
                <p className="text-[10px] text-rose-500 mt-1">{t('board.errorHint')}</p>
              </div>
              <button
                type="button"
                onClick={clearAssignError}
                className="absolute top-3.5 right-4 text-[10px] uppercase font-bold text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-100/50 rounded-md px-2.5 py-1 transition-colors border border-rose-150 cursor-pointer shadow-2xs"
              >
                {t('board.dismiss')}
              </button>
            </div>
          )}

          {rooms.length === 0 ? (
            <div className="py-24 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-3xl">
                🏨
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">{t('board.emptyTitle')}</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">{t('board.emptySubtitle')}</p>
            </div>
          ) : (
            <div id="rooms-bento-grid" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </div>

        {showResetModal && (
          <ConfirmationModal
            title={t('resetModal.title')}
            message={t('resetModal.message')}
            confirmLabel={t('resetModal.confirm')}
            confirmVariant="danger"
            onConfirm={() => {
              resetAllocations()
              setShowResetModal(false)
            }}
            onCancel={() => setShowResetModal(false)}
          />
        )}

        {toastMessage && (
          <ToastNotification message={toastMessage} variant={toastVariant} onDismiss={clearAutoAllocateResult} />
        )}
      </div>

      <DragOverlay>
        {draggedParticipant ? (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-lg opacity-95 w-64 cursor-grabbing pointer-events-none">
            <h4 className="text-xs font-bold text-slate-800">{draggedParticipant.name}</h4>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {draggedParticipant.requestedRoomType.length > 0 && (
                <span className="bg-amber-50/70 text-amber-800 border border-amber-200/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  🏨 {draggedParticipant.requestedRoomType.join(' / ')}
                </span>
              )}
              {draggedParticipant.requestedBedType && (
                <span className="bg-teal-50/70 text-teal-800 border border-teal-200/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  🛏️ {draggedParticipant.requestedBedType}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
