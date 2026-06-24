import { AlertTriangle, CheckCircle, ShieldAlert, Star, Trash2, User } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Bed, type Participant, type Room } from '../types'

interface RoomCardProps {
  key?: React.Key
  room: Room
  participants: Participant[]
  onAssignParticipant: (participantId: string, roomId: string, bedId: string) => void
  onRemoveAssignment: (participantId: string) => void
  draggedParticipant: Participant | null
}

export default function RoomCard({
  room,
  participants,
  onAssignParticipant,
  onRemoveAssignment,
  draggedParticipant
}: RoomCardProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [activeDragBedId, setActiveDragBedId] = useState<string | null>(null)

  // Map participant assigned to this room
  const roomOccupants = participants.filter((p) => p.assignedRoomId === room.id)
  const totalBedsCount = room.beds.length
  const occupiedBedsCount = room.beds.filter((b) => !!b.assignedParticipantId).length
  const isFull = occupiedBedsCount >= totalBedsCount

  const isRoomCompatible = draggedParticipant
    ? draggedParticipant.requestedRoomType.trim().toLowerCase() === room.category.trim().toLowerCase()
    : true

  // Drag over room card level
  const handleDragOverCard = (e: React.DragEvent) => {
    if (!isRoomCompatible) {
      return // Do not call preventDefault to show the browser's 🚫 standard forbidden cursor
    }
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeaveCard = () => {
    setIsDragOver(false)
  }

  // Drag over individual Bed tray level
  const handleBedDragOver = (e: React.DragEvent, bedId: string, isCompatible: boolean) => {
    if (!isCompatible) {
      return // Show 🚫 standard forbidden cursor
    }
    e.preventDefault()
    e.stopPropagation()
    setActiveDragBedId(bedId)
  }

  const handleBedDragLeave = () => {
    setActiveDragBedId(null)
  }

  const handleBedDrop = (e: React.DragEvent, bedId: string, isCompatible: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setActiveDragBedId(null)

    if (!isCompatible) {
      return // Explicitly block drops onto non-matching slots
    }

    const participantId = e.dataTransfer.getData('text/plain')
    if (participantId) {
      onAssignParticipant(participantId, room.id, bedId)
    }
  }

  // Compute borders and colors derived from Sleek Interfaced styles
  let cardClassName = 'relative bg-white rounded-xl border p-4 transition-all duration-200 flex flex-col space-y-4'
  if (draggedParticipant) {
    if (isRoomCompatible) {
      if (isDragOver) {
        cardClassName += ' border-emerald-500 ring-4 ring-emerald-100 shadow-md scale-[1.01]'
      } else {
        cardClassName += ' border-emerald-300 ring-2 ring-emerald-50/50 shadow-xs'
      }
    } else {
      cardClassName +=
        ' border-rose-100/50 opacity-25 bg-slate-50/60 pointer-events-none cursor-not-allowed select-none'
    }
  } else {
    if (isDragOver) {
      cardClassName += ' border-indigo-500 ring-2 ring-indigo-100 shadow-md'
    } else if (occupiedBedsCount === 0) {
      cardClassName += ' border-2 border-dashed border-slate-200 shadow-xs'
    } else if (isFull) {
      cardClassName += ' border-2 border-green-500 shadow-md shadow-green-50 bg-white'
    } else {
      cardClassName += ' border border-indigo-200 shadow-xs bg-white'
    }
  }

  return (
    <div
      id={`room-card-${room.id}`}
      onDragOver={handleDragOverCard}
      onDragLeave={handleDragLeaveCard}
      className={cardClassName}
    >
      {/* Category corner element */}
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

      {/* Header section: Room detail */}
      <div className="pr-16">
        <h3
          id={`room-title-${room.id}`}
          className="text-sm font-extrabold text-slate-850 flex items-center gap-1.5 leading-snug"
        >
          {room.id}
        </h3>

        {/* Capacity overview bar */}
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

      {/* Beds list */}
      <div className="space-y-2.5 pt-1">
        {room.beds.map((bed) => {
          const occupant = bed.assignedParticipantId
            ? participants.find((p) => p.id === bed.assignedParticipantId)
            : null

          const isBedDragTarget = activeDragBedId === bed.id

          // Check for mismatch warnings
          const hasRoomCategoryMismatch =
            occupant &&
            occupant.requestedRoomType &&
            !room.category.toLowerCase().includes(occupant.requestedRoomType.toLowerCase()) &&
            !occupant.requestedRoomType.toLowerCase().includes(room.category.toLowerCase())

          const hasBedTypeMismatch =
            occupant &&
            occupant.requestedBedType &&
            !bed.type.toLowerCase().includes(occupant.requestedBedType.toLowerCase()) &&
            !occupant.requestedBedType.toLowerCase().includes(bed.type.toLowerCase())

          const isBedCompatible = draggedParticipant
            ? draggedParticipant.requestedBedType.trim().toLowerCase() === bed.type.trim().toLowerCase()
            : true

          const isOverallCompatible = isRoomCompatible && isBedCompatible

          // Dynamic colors in Sleek theme
          let bedContainerStyle =
            'group/bed min-h-12 flex items-center justify-between p-2 rounded-lg border transition-all '
          if (draggedParticipant) {
            if (isOverallCompatible) {
              if (isBedDragTarget) {
                bedContainerStyle +=
                  'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-100 animate-pulse text-emerald-900'
              } else {
                bedContainerStyle +=
                  'bg-emerald-50/20 border-emerald-250 border-dashed hover:border-emerald-350 hover:bg-emerald-50/50 cursor-copy text-emerald-800'
              }
            } else {
              bedContainerStyle +=
                'bg-rose-55/10 border-rose-100 opacity-20 cursor-not-allowed select-none pointer-events-none'
            }
          } else {
            if (occupant) {
              if (isFull) {
                bedContainerStyle += 'bg-emerald-50/75 border-emerald-200 hover:bg-emerald-50/90 text-slate-800'
              } else {
                bedContainerStyle += 'bg-blue-50 border-blue-200 hover:bg-blue-100/50 text-blue-900'
              }
            } else if (isBedDragTarget) {
              bedContainerStyle +=
                'bg-indigo-50/85 border-indigo-400 border-dashed ring-2 ring-indigo-100 animate-pulse'
            } else {
              bedContainerStyle += 'bg-white border-dashed border-slate-250 hover:border-slate-350 hover:bg-slate-50/30'
            }
          }

          return (
            <div
              key={bed.id}
              id={`bed-slot-${bed.id}`}
              onDragOver={(e) => handleBedDragOver(e, bed.id, isOverallCompatible)}
              onDragLeave={handleBedDragLeave}
              onDrop={(e) => handleBedDrop(e, bed.id, isOverallCompatible)}
              className={bedContainerStyle}
            >
              {/* Bed specifications */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Bed Icon Representation */}
                <div
                  className={`p-1.5 rounded flex items-center justify-center flex-shrink-0 ${
                    occupant
                      ? 'bg-white border border-slate-100 text-slate-700 font-bold'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono tracking-tight font-extrabold text-center min-w-4">
                    {bed.type.toLowerCase().includes('single occupancy')
                      ? 'SO'
                      : bed.type.toLowerCase().includes('shared')
                        ? 'SD'
                        : 'SG'}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide leading-none">
                    {bed.label || bed.type}
                  </span>
                  {occupant ? (
                    <div className="flex items-center gap-1.5 mt-0.5 pr-2">
                      <span className="text-xs font-semibold text-slate-800 truncate">{occupant.name}</span>

                      {/* Warnings if mismatch */}
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

              {/* Bed occupant actions */}
              <div>
                {occupant ? (
                  <button
                    id={`unassign-${bed.id}`}
                    onClick={() => onRemoveAssignment(occupant.id)}
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
        })}
      </div>
    </div>
  )
}
