import { Search, UserPlus, Users } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import type { Participant } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'

export default function ParticipantPool() {
  const participants = useWorkspaceStore((s) => s.participants)
  const rooms = useWorkspaceStore((s) => s.rooms)
  const assignParticipant = useWorkspaceStore((s) => s.assignParticipant)
  const removeAssignment = useWorkspaceStore((s) => s.removeAssignment)
  const setDraggedParticipant = useWorkspaceStore((s) => s.setDraggedParticipant)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'unassigned' | 'assigned' | 'all'>('unassigned')
  const [roomPrefFilter, setRoomPrefFilter] = useState('all')
  const [selectedForQuickAssign, setSelectedForQuickAssign] = useState<string | null>(null)

  const roomPrefOptions = useMemo(() => {
    const prefs = new Set<string>()
    participants.forEach((p) => {
      if (p.requestedRoomType) prefs.add(p.requestedRoomType)
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
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        p.name.toLowerCase().includes(term) ||
        p.sharingPreferences.toLowerCase().includes(term) ||
        p.requestedRoomType?.toLowerCase().includes(term)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unassigned' && !p.assignedRoomId) ||
        (statusFilter === 'assigned' && p.assignedRoomId)
      const matchesRoomPref = roomPrefFilter === 'all' || p.requestedRoomType === roomPrefFilter
      return matchesSearch && matchesStatus && matchesRoomPref
    })
  }, [participants, searchTerm, statusFilter, roomPrefFilter])

  const getCardBorderLeft = (bedType: string) => {
    const norm = (bedType || '').toLowerCase()
    if (norm.includes('single occupancy')) return 'border-l-4 border-l-purple-400'
    if (norm.includes('shared')) return 'border-l-4 border-l-amber-400'
    return 'border-l-4 border-l-indigo-400'
  }

  const handleDragStart = (e: React.DragEvent, participant: Participant) => {
    e.dataTransfer.setData('text/plain', participant.id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedParticipant(participant)
  }

  const handleDragEnd = () => {
    setDraggedParticipant(null)
  }

  return (
    <div
      id="participant-pool-card"
      className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col h-full"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 id="participant-pool-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Guests Registry Pool
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
            placeholder="Search by name, room choice, shared notes..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <label
              htmlFor="status-filter-select"
              className="text-[10px] font-bold text-slate-450 uppercase tracking-wider"
            >
              Status
            </label>
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'unassigned' | 'assigned' | 'all')
                setSelectedForQuickAssign(null)
              }}
              className="text-xs py-1.5 px-2 border border-slate-200 rounded-md bg-slate-55 text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="unassigned">Unassigned Only</option>
              <option value="assigned">Assigned Only</option>
              <option value="all">Show All Registered</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label
              htmlFor="room-pref-filter-select"
              className="text-[10px] font-bold text-slate-450 uppercase tracking-wider"
            >
              Preferred Room
            </label>
            <select
              id="room-pref-filter-select"
              value={roomPrefFilter}
              onChange={(e) => {
                setRoomPrefFilter(e.target.value)
                setSelectedForQuickAssign(null)
              }}
              className="text-xs py-1.5 px-2 border border-slate-200 rounded-md bg-slate-55 text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
            >
              <option value="all">All room choices</option>
              {roomPrefOptions.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0">
        {filteredParticipants.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/55">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-mono mb-3">
              ?
            </div>
            <p className="text-xs font-semibold text-slate-600">No matching guests found</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              {searchTerm || roomPrefFilter !== 'all'
                ? 'Try clearing filters or search queries above.'
                : 'All guests have already been assigned to rooms!'}
            </p>
          </div>
        ) : (
          filteredParticipants.map((participant) => {
            const isAssigned = !!participant.assignedRoomId
            const isQuickAssignOpen = selectedForQuickAssign === participant.id
            const borderLeftClass = isAssigned
              ? 'border-l-2 border-l-slate-200'
              : getCardBorderLeft(participant.requestedBedType)

            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: draggable participant card
              <div
                key={participant.id}
                id={`participant-${participant.id}`}
                draggable={!isAssigned}
                onDragStart={(e) => handleDragStart(e, participant)}
                onDragEnd={handleDragEnd}
                className={`relative group border rounded-xl p-3.5 transition-all text-left flex flex-col space-y-2 select-none shadow-xs ${borderLeftClass} ${
                  isAssigned
                    ? 'bg-slate-50/60 border-slate-200 text-slate-400'
                    : 'bg-white border-slate-200 hover:border-slate-350 hover:shadow-xs active:cursor-grabbing cursor-grab'
                }`}
              >
                {!isAssigned && (
                  <div className="absolute top-3.5 right-3 w-4 h-5 flex flex-col items-center justify-between py-1 opacity-20 group-hover:opacity-40">
                    <span className="w-3.5 h-[2px] bg-slate-600 rounded-full"></span>
                    <span className="w-3.5 h-[2px] bg-slate-600 rounded-full"></span>
                    <span className="w-3.5 h-[2px] bg-slate-600 rounded-full"></span>
                  </div>
                )}

                <div className="pr-6">
                  <h4 className={`text-xs font-bold ${isAssigned ? 'text-slate-550 line-through' : 'text-slate-800'}`}>
                    {participant.name}
                  </h4>
                  {isAssigned && (
                    <div className="text-[10px] text-indigo-650 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      Assigned to Room {participant.assignedRoomId}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {participant.requestedRoomType && (
                    <span className="bg-amber-50/70 text-amber-800 border border-amber-200/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      🏨 {participant.requestedRoomType}
                    </span>
                  )}
                  {participant.requestedBedType && (
                    <span className="bg-teal-50/70 text-teal-800 border border-teal-200/50 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      🛏️ {participant.requestedBedType}
                    </span>
                  )}
                </div>

                {participant.sharingPreferences && (
                  <div className="p-2 rounded bg-slate-50 text-[10px] text-slate-600 leading-normal border-l-2 border-indigo-200">
                    <span className="font-bold text-indigo-700 block mb-0.5">Preference & Share details:</span>"
                    {participant.sharingPreferences}"
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                  {isAssigned ? (
                    <button
                      type="button"
                      onClick={() => removeAssignment(participant.id)}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 py-1 cursor-pointer"
                    >
                      Unassign guest
                    </button>
                  ) : (
                    <div className="w-full">
                      <button
                        type="button"
                        onClick={() => setSelectedForQuickAssign(isQuickAssignOpen ? null : participant.id)}
                        className="text-[10px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        Quick Allocate Bed...
                      </button>

                      {isQuickAssignOpen && (
                        <div className="absolute left-0 right-0 mt-2 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 z-50 text-xs space-y-2 animate-fadeIn max-h-56 overflow-y-auto">
                          <div className="flex items-center justify-between border-b pb-1.5">
                            <span className="font-bold text-slate-700">Select Available Bed:</span>
                            <button
                              type="button"
                              onClick={() => setSelectedForQuickAssign(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-600"
                            >
                              Close
                            </button>
                          </div>
                          {(() => {
                            const matchingBeds = vacantBeds.filter((bed) => {
                              const targetRoom = rooms.find((r) => r.id === bed.roomId)
                              if (!targetRoom) return false
                              return (
                                targetRoom.category.trim().toLowerCase() ===
                                  participant.requestedRoomType.trim().toLowerCase() &&
                                bed.bedType.trim().toLowerCase() === participant.requestedBedType.trim().toLowerCase()
                              )
                            })

                            if (matchingBeds.length === 0) {
                              return (
                                <div className="p-3 text-center bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 font-bold leading-normal">
                                  ⚠️ No vacant slots available matching:
                                  <div className="mt-1 text-slate-600 font-medium">
                                    🏨 Category {participant.requestedRoomType}
                                    <br />
                                    🛏️ Configuration {participant.requestedBedType}
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
                                      setSelectedForQuickAssign(null)
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
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-[10px] text-slate-400 mt-4 leading-normal bg-slate-50 p-2.5 rounded-lg border border-slate-150">
        💡 <span className="font-semibold text-slate-600">Tip:</span> Pick up any guest card and drag them directly into
        the designated bed circles in the room cards.
      </p>
    </div>
  )
}
