import { useDraggable } from '@dnd-kit/core'
import { Search, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Participant, Room } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'

function getCardBorderLeft(bedType: string) {
  if (bedType === 'double_single') return 'border-l-4 border-l-purple-400'
  if (bedType === 'double_shared') return 'border-l-4 border-l-amber-400'
  return 'border-l-4 border-l-indigo-400'
}

function DraggableParticipantCard({
  participant,
  isQuickAssignOpen,
  onToggleQuickAssign,
  vacantBeds,
  rooms,
  assignParticipant
}: {
  participant: Participant
  isQuickAssignOpen: boolean
  onToggleQuickAssign: () => void
  vacantBeds: Array<{ roomName: string; roomId: string; bedId: string; bedType: string }>
  rooms: Room[]
  assignParticipant: (participantId: string, roomId: string, bedId: string) => void
}) {
  const { t } = useTranslation('allocation')
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: participant.id,
    data: { participant }
  })

  return (
    <div
      id={`participant-${participant.id}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.5 : 1, touchAction: 'none' }}
      className={`relative group border rounded-xl p-3.5 transition-all text-left flex flex-col space-y-2 select-none shadow-xs ${getCardBorderLeft(participant.requestedBedType)} bg-white border-slate-200 hover:border-slate-350 hover:shadow-xs active:cursor-grabbing cursor-grab`}
    >
      <div className="absolute top-3.5 right-3 w-4 h-5 flex flex-col items-center justify-between py-1 opacity-20 group-hover:opacity-40">
        <span className="w-3.5 h-[2px] bg-slate-600 rounded-full" />
        <span className="w-3.5 h-[2px] bg-slate-600 rounded-full" />
        <span className="w-3.5 h-[2px] bg-slate-600 rounded-full" />
      </div>

      <div className="pr-6">
        <h4 className="text-xs font-bold text-slate-800">{participant.name}</h4>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {participant.requestedRoomType.length > 0 && (
          <span className="bg-amber-50/70 text-amber-800 border border-amber-200/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            🏨 {participant.requestedRoomType.join(' / ')}
          </span>
        )}
        {participant.requestedBedType && (
          <span className="bg-teal-50/70 text-teal-800 border border-teal-200/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            🛏️ {t(`roomCard.bedTypeLabel.${participant.requestedBedType}`)}
          </span>
        )}
      </div>

      {participant.sharingPreferences && (
        <div className="p-2 rounded bg-slate-50 text-[10px] text-slate-600 leading-normal border-l-2 border-indigo-200">
          <span className="font-bold text-indigo-700 block mb-0.5">{t('pool.sharingDetails')}</span>"
          {participant.sharingPreferences}"
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
        <div className="w-full">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onToggleQuickAssign}
            className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer"
          >
            <UserPlus className="w-3 h-3" />
            {t('pool.quickAllocate')}
          </button>

          {isQuickAssignOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute left-0 right-0 mt-2 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 z-50 text-xs space-y-2 animate-fadeIn max-h-56 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-1.5">
                <span className="font-bold text-slate-700">{t('pool.selectAvailableBed')}</span>
                <button
                  type="button"
                  onClick={onToggleQuickAssign}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  {t('pool.close')}
                </button>
              </div>
              {(() => {
                const matchingBeds = vacantBeds.filter((bed) => {
                  const targetRoom = rooms.find((r) => r.id === bed.roomId)
                  if (!targetRoom) return false
                  return (
                    participant.requestedRoomType.some(
                      (rt) => rt.trim().toLowerCase() === targetRoom.category.trim().toLowerCase()
                    ) && bed.bedType.trim().toLowerCase() === participant.requestedBedType.trim().toLowerCase()
                  )
                })

                if (matchingBeds.length === 0) {
                  return (
                    <div className="p-3 text-center bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 font-bold leading-normal">
                      ⚠️ {t('pool.noVacantSlots')}
                      <div className="mt-1 text-slate-600 font-medium">
                        {t('pool.noVacantCategory', { types: participant.requestedRoomType.join(' / ') })}
                        <br />
                        {t('pool.noVacantBed', { bedType: participant.requestedBedType })}
                      </div>
                    </div>
                  )
                }

                return (
                  <div className="space-y-1">
                    {matchingBeds.map((bed) => (
                      <button
                        type="button"
                        key={bed.bedId}
                        onClick={() => {
                          assignParticipant(participant.id, bed.roomId, bed.bedId)
                          onToggleQuickAssign()
                        }}
                        className="w-full text-left p-1.5 hover:bg-emerald-50 rounded text-[11px] text-slate-705 font-semibold flex items-center justify-between border border-transparent hover:border-emerald-250 cursor-pointer"
                      >
                        <span>{bed.roomName}</span>
                        <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {bed.bedType}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ParticipantPool() {
  const { t } = useTranslation('allocation')
  const participants = useWorkspaceStore((s) => s.participants)
  const rooms = useWorkspaceStore((s) => s.rooms)
  const assignParticipant = useWorkspaceStore((s) => s.assignParticipant)
  const roomTypeFilter = useWorkspaceStore((s) => s.roomTypeFilter)
  const setRoomTypeFilter = useWorkspaceStore((s) => s.setRoomTypeFilter)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedForQuickAssign, setSelectedForQuickAssign] = useState<string | null>(null)

  const roomPrefOptions = useMemo(() => {
    const prefs = new Set<string>()
    participants.forEach((p) => {
      p.requestedRoomType.forEach((rt) => {
        if (rt) prefs.add(rt)
      })
    })
    return Array.from(prefs).sort()
  }, [participants])

  const vacantBeds = useMemo(() => {
    const list: Array<{ roomName: string; roomId: string; bedId: string; bedType: string }> = []
    rooms.forEach((room) => {
      room.beds.forEach((bed) => {
        if (!bed.assignedParticipantId) {
          list.push({ roomName: room.id, roomId: room.id, bedId: bed.id, bedType: bed.type })
        }
      })
    })
    return list
  }, [rooms])

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      if (p.assignedRoomId !== null) return false
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        p.name.toLowerCase().includes(term) ||
        p.sharingPreferences.toLowerCase().includes(term) ||
        p.requestedRoomType.some((rt) => rt.toLowerCase().includes(term))
      const matchesRoomPref = roomTypeFilter === 'all' || p.requestedRoomType.includes(roomTypeFilter)
      return matchesSearch && matchesRoomPref
    })
  }, [participants, searchTerm, roomTypeFilter])

  return (
    <div
      id="participant-pool-card"
      className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col h-full"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 id="participant-pool-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            {t('pool.title')}
          </h3>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="pool-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('pool.searchPlaceholder')}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label
            htmlFor="room-type-filter-select"
            className="text-[10px] font-bold text-slate-450 uppercase tracking-wider"
          >
            {t('pool.roomTypeLabel')}
          </label>
          <select
            id="room-type-filter-select"
            value={roomTypeFilter}
            onChange={(e) => {
              setRoomTypeFilter(e.target.value)
              setSelectedForQuickAssign(null)
            }}
            className="text-xs py-1.5 px-2 border border-slate-200 rounded-md bg-slate-55 text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
          >
            <option value="all">{t('pool.allRoomTypes')}</option>
            {roomPrefOptions.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0">
        {filteredParticipants.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/55">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-mono mb-3">
              ?
            </div>
            <p className="text-xs font-semibold text-slate-600">{t('pool.emptyTitle')}</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              {searchTerm || roomTypeFilter !== 'all' ? t('pool.emptyFilteredHint') : t('pool.emptyAllAssignedHint')}
            </p>
          </div>
        ) : (
          filteredParticipants.map((participant) => {
            const isQuickAssignOpen = selectedForQuickAssign === participant.id
            return (
              <DraggableParticipantCard
                key={participant.id}
                participant={participant}
                isQuickAssignOpen={isQuickAssignOpen}
                onToggleQuickAssign={() => setSelectedForQuickAssign(isQuickAssignOpen ? null : participant.id)}
                vacantBeds={vacantBeds}
                rooms={rooms}
                assignParticipant={assignParticipant}
              />
            )
          })
        )}
      </div>

      <p className="text-[10px] text-slate-400 mt-4 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-150">
        💡 <span className="font-semibold text-slate-600">Tip:</span> {t('pool.tip')}
      </p>
    </div>
  )
}
