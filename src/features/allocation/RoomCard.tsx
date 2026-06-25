import { useDroppable } from '@dnd-kit/core'
import { AlertTriangle, CheckCircle, Trash2 } from 'lucide-react'
import type React from 'react'
import type { Bed, Participant, Room } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'

interface BedSlotProps {
  bed: Bed
  roomId: string
  roomCategory: string
  draggedParticipant: Participant | null
  isRoomCompatible: boolean
  isFull: boolean
  occupant: Participant | null
  onRemove: () => void
}

function BedSlot({
  bed,
  roomId,
  roomCategory,
  draggedParticipant,
  isRoomCompatible,
  isFull,
  occupant,
  onRemove
}: BedSlotProps) {
  const isBedCompatible = draggedParticipant ? draggedParticipant.requestedBedType === bed.type : true
  const isOverallCompatible = isRoomCompatible && isBedCompatible

  const { setNodeRef, isOver } = useDroppable({
    id: bed.id,
    data: { roomId },
    disabled: !isOverallCompatible || !!occupant
  })

  const hasRoomCategoryMismatch =
    occupant?.requestedRoomType != null &&
    occupant.requestedRoomType.trim().toLowerCase() !== roomCategory.trim().toLowerCase()

  const hasBedTypeMismatch = occupant?.requestedBedType != null && occupant.requestedBedType !== bed.type

  let bedContainerStyle = 'group/bed min-h-12 flex items-center justify-between p-2 rounded-lg border transition-all '
  if (draggedParticipant) {
    if (isOverallCompatible) {
      if (isOver) {
        bedContainerStyle += 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-100 animate-pulse text-emerald-900'
      } else {
        bedContainerStyle +=
          'bg-emerald-50/20 border-emerald-250 border-dashed hover:border-emerald-350 hover:bg-emerald-50/50 cursor-copy text-emerald-800'
      }
    } else {
      bedContainerStyle += 'bg-rose-55/10 border-rose-100 opacity-20 cursor-not-allowed select-none pointer-events-none'
    }
  } else {
    if (occupant) {
      if (isFull) {
        bedContainerStyle += 'bg-emerald-50/75 border-emerald-200 hover:bg-emerald-50/90 text-slate-800'
      } else {
        bedContainerStyle += 'bg-blue-50 border-blue-200 hover:bg-blue-100/50 text-blue-900'
      }
    } else if (isOver) {
      bedContainerStyle += 'bg-indigo-50/85 border-indigo-400 border-dashed ring-2 ring-indigo-100 animate-pulse'
    } else {
      bedContainerStyle += 'bg-white border-dashed border-slate-250 hover:border-slate-350 hover:bg-slate-50/30'
    }
  }

  return (
    <div id={`bed-slot-${bed.id}`} ref={setNodeRef} className={bedContainerStyle}>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div
          className={`p-1.5 rounded flex items-center justify-center flex-shrink-0 ${
            occupant ? 'bg-white border border-slate-100 text-slate-700 font-bold' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <span className="text-[10px] uppercase font-mono tracking-tight font-extrabold text-center min-w-4">
            {bed.type === 'double_single' ? 'SO' : bed.type === 'double_shared' ? 'SD' : 'SB'}
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide leading-none">
            {bed.label || bed.type}
          </span>
          {occupant ? (
            <div className="flex items-center gap-1.5 mt-0.5 pr-2">
              <span className="text-xs font-semibold text-slate-800 truncate">{occupant.name}</span>
              {(hasRoomCategoryMismatch || hasBedTypeMismatch) && (
                <div className="relative group/warn flex-shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/warn:block w-48 p-2 bg-slate-900 border border-slate-800 text-[10px] text-slate-250 rounded-lg shadow-md z-30 leading-normal pointer-events-none">
                    <span className="font-bold text-amber-400 block mb-0.5">Allocation Mismatch:</span>
                    {hasRoomCategoryMismatch && `• Requested Room: ${occupant.requestedRoomType}`}
                    {hasRoomCategoryMismatch && hasBedTypeMismatch && <br />}
                    {hasBedTypeMismatch && `• Requested Bed: ${occupant.requestedBedType}`}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic mt-0.5">Empty Slot</span>
          )}
        </div>
      </div>

      <div>
        {occupant ? (
          <button
            type="button"
            id={`unassign-${bed.id}`}
            onClick={onRemove}
            className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded-sm hover:bg-rose-50 cursor-pointer"
            title="Unassign occupant"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 border border-slate-200 py-0.5 px-1.5 rounded-sm select-none uppercase tracking-wide group-hover/bed:bg-indigo-50/50 group-hover/bed:text-indigo-600 group-hover/bed:border-indigo-100">
            Drop Here
          </span>
        )}
      </div>
    </div>
  )
}

interface RoomCardProps {
  room: Room
  key?: React.Key
}

export default function RoomCard({ room }: RoomCardProps) {
  const participants = useWorkspaceStore((s) => s.participants)
  const draggedParticipant = useWorkspaceStore((s) => s.draggedParticipant)
  const removeAssignment = useWorkspaceStore((s) => s.removeAssignment)

  const totalBedsCount = room.beds.length
  const occupiedBedsCount = room.beds.filter((b) => !!b.assignedParticipantId).length
  const isFull = occupiedBedsCount >= totalBedsCount

  const isRoomCompatible = draggedParticipant
    ? draggedParticipant.requestedRoomType.trim().toLowerCase() === room.category.trim().toLowerCase()
    : true

  let cardClassName = 'relative bg-white rounded-xl border p-4 transition-all duration-200 flex flex-col space-y-4'
  if (draggedParticipant) {
    if (isRoomCompatible) {
      cardClassName += ' border-emerald-300 ring-2 ring-emerald-50/50 shadow-xs'
    } else {
      cardClassName +=
        ' border-rose-100/50 opacity-25 bg-slate-50/60 pointer-events-none cursor-not-allowed select-none'
    }
  } else {
    if (occupiedBedsCount === 0) {
      cardClassName += ' border-2 border-dashed border-slate-200 shadow-xs'
    } else if (isFull) {
      cardClassName += ' border-2 border-green-500 shadow-md shadow-green-50 bg-white'
    } else {
      cardClassName += ' border border-indigo-200 shadow-xs bg-white'
    }
  }

  return (
    <div id={`room-card-${room.id}`} className={cardClassName}>
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full select-none ${
            room.category.toLowerCase().includes('vip') || room.category.toLowerCase().includes('suite')
              ? 'bg-amber-100 text-amber-800 border border-amber-200'
              : room.category.toLowerCase().includes('dorm')
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {room.category}
        </span>
      </div>

      <div className="pr-16">
        <h3
          id={`room-title-${room.id}`}
          className="text-sm font-extrabold text-slate-850 flex items-center gap-1.5 leading-snug"
        >
          {room.id}
        </h3>

        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
          <span className="font-semibold text-slate-600 font-mono">
            {occupiedBedsCount} / {totalBedsCount} Beds Occupied
          </span>
          <div className="flex-1 max-w-[120px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFull ? 'bg-emerald-500' : occupiedBedsCount > 0 ? 'bg-blue-500' : 'bg-slate-200'
              }`}
              style={{ width: `${(occupiedBedsCount / totalBedsCount) * 100}%` }}
            />
          </div>
          {isFull && (
            <span className="text-emerald-700 font-bold text-[9px] flex items-center gap-0.5 whitespace-nowrap bg-emerald-50 px-1 rounded border border-emerald-150">
              <CheckCircle className="w-2.5 h-2.5" /> FULL
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {room.beds.map((bed) => {
          const occupant = bed.assignedParticipantId
            ? (participants.find((p) => p.id === bed.assignedParticipantId) ?? null)
            : null
          return (
            <BedSlot
              key={bed.id}
              bed={bed}
              roomId={room.id}
              roomCategory={room.category}
              draggedParticipant={draggedParticipant}
              isRoomCompatible={isRoomCompatible}
              isFull={isFull}
              occupant={occupant}
              onRemove={() => removeAssignment(occupant!.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
