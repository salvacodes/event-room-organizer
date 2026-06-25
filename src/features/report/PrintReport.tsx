import { Printer, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'

export default function PrintReport() {
  const rooms = useWorkspaceStore((s) => s.rooms)
  const participants = useWorkspaceStore((s) => s.participants)

  const [reportTitle, setReportTitle] = useState('Summer Retreat 2026 — Official Room Allocations')
  const [reportNotes, setReportNotes] = useState(
    'Please check in at the reception desk to pick up your key. Absolute quiet hours are from 10:00 PM to 7:00 AM.'
  )
  const [sortBy, setSortBy] = useState<'room' | 'guest'>('room')
  const [searchQuery, setSearchQuery] = useState('')

  const handlePrint = () => {
    window.print()
  }

  const guestRecords = useMemo(() => {
    return participants
      .map((p) => {
        const room = p.assignedRoomId ? rooms.find((r) => r.id === p.assignedRoomId) : null
        const bed = room ? room.beds.find((b) => b.assignedParticipantId === p.id) : null
        return {
          id: p.id,
          name: p.name,
          assignedRoom: p.assignedRoomId || 'Unassigned',
          category: room?.category || '',
          bedType: bed?.type || '',
          preferences: p.sharingPreferences || '-'
        }
      })
      .filter((record) => {
        const query = searchQuery.toLowerCase()
        return (
          record.name.toLowerCase().includes(query) ||
          record.assignedRoom.toLowerCase().includes(query) ||
          record.bedType.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [participants, rooms, searchQuery])

  const roomRecords = useMemo(() => {
    return [...rooms]
      .filter((r) => {
        const query = searchQuery.toLowerCase()
        const hasMatchingOccupant = r.beds.some((b) => {
          if (!b.assignedParticipantId) return false
          const p = participants.find((part) => part.id === b.assignedParticipantId)
          return p?.name.toLowerCase().includes(query) || p?.sharingPreferences.toLowerCase().includes(query)
        })
        return r.id.toLowerCase().includes(query) || r.category.toLowerCase().includes(query) || hasMatchingOccupant
      })
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }))
  }, [rooms, participants, searchQuery])

  return (
    <div id="print-report-module" className="flex gap-6 items-start">
      <div className="print:hidden sticky top-[64px] w-72 flex-shrink-0 bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-600" />
            Report Compiler
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
            Configure the handout then save as PDF via system print.
          </p>
        </div>

        <button
          type="button"
          id="trigger-print-now-btn"
          onClick={handlePrint}
          className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Trigger System Print / PDF
        </button>

        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex flex-col space-y-1.5">
            <label
              htmlFor="report-custom-title"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wide"
            >
              Report Header Title
            </label>
            <input
              id="report-custom-title"
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-semibold text-slate-700"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              htmlFor="report-custom-notes"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wide"
            >
              Footer Instructions
            </label>
            <textarea
              id="report-custom-notes"
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={3}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-650 resize-none"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Handout Layout</span>
            <div className="grid grid-cols-1 gap-1">
              <button
                type="button"
                id="sort-by-room-tab"
                onClick={() => setSortBy('room')}
                className={`py-1.5 px-2 text-left font-bold text-[11px] rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                  sortBy === 'room'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                }`}
              >
                📝 Grouped by Rooms
              </button>
              <button
                type="button"
                id="sort-by-guest-tab"
                onClick={() => setSortBy('guest')}
                className={`py-1.5 px-2 text-left font-bold text-[11px] rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                  sortBy === 'guest'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                }`}
              >
                🗂️ Guests List A-Z
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              htmlFor="print-search-preview"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wide"
            >
              Filter Preview
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                id="print-search-preview"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, room number..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div
          id="printable-report-capture"
          className="bg-white text-slate-900 p-8 border border-slate-300 rounded-lg max-w-4xl mx-auto font-sans leading-normal relative shadow-xs"
        >
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">{reportTitle}</h1>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-mono">
                Printed on the Web Portal:{' '}
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-1 rounded">
                {sortBy === 'room' ? 'LAYOUT: ROOM ALLOCATION' : 'LAYOUT: MASTER GUEST CHECKLIST'}
              </span>
            </div>
          </div>

          {reportNotes && (
            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed text-slate-700 italic">
              <span className="font-bold text-slate-900 not-italic block mb-0.5">⚠️ Notice for Hosts & Guests:</span>"
              {reportNotes}"
            </div>
          )}

          {sortBy === 'room' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomRecords.map((room) => {
                  const _totalBeds = room.beds.length
                  const _assignedCount = room.beds.filter((b) => b.assignedParticipantId).length

                  return (
                    <div
                      key={room.id}
                      className="border-2 border-slate-900 rounded-lg p-4 flex flex-col space-y-3 bg-white hover:shadow-xs break-inside-avoid"
                    >
                      <div className="flex items-center justify-between border-b border-slate-350 pb-2">
                        <span className="font-extrabold text-base text-slate-900">{room.id}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-550 border border-slate-300 px-1.5 py-0.5 rounded">
                          {room.category}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {room.beds.map((bed) => {
                          const guest = bed.assignedParticipantId
                            ? participants.find((p) => p.id === bed.assignedParticipantId)
                            : null

                          return (
                            <div
                              key={bed.id}
                              className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-b-0 text-[11px] leading-tight"
                            >
                              <span className="font-mono text-slate-500 font-bold">{bed.label || bed.type}:</span>
                              <span
                                className={`text-right font-bold ${guest ? 'text-slate-900' : 'text-slate-400 italic'}`}
                              >
                                {guest ? guest.name : 'VACANT / AVAILABLE'}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {room.beds.some((b) => {
                        const p = participants.find((part) => part.id === b.assignedParticipantId)
                        return p?.sharingPreferences
                      }) && (
                        <div className="mt-1 pt-1.5 border-t border-dashed border-slate-200">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wide">
                            Sharing preferences:
                          </span>
                          {room.beds.map((b) => {
                            const p = participants.find((part) => part.id === b.assignedParticipantId)
                            if (!p?.sharingPreferences) return null
                            return (
                              <div key={p.id} className="text-[9px] text-slate-600 leading-normal mt-0.5">
                                <strong className="text-slate-700">{p.name}:</strong> "{p.sharingPreferences}"
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {sortBy === 'guest' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 font-bold bg-slate-100">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Guest Name</th>
                    <th className="py-2.5 px-3 text-center">Room Assignment</th>
                    <th className="py-2.5 px-3">Bed Block</th>
                    <th className="py-2.5 px-3">Sharing Preferences & Signup Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {guestRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-250 hover:bg-slate-50 last:border-0 divide-x divide-slate-100 break-inside-avoid"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">{record.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block font-mono font-black text-sm px-2.5 py-0.5 rounded ${
                            record.assignedRoom === 'Unassigned'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {record.assignedRoom === 'Unassigned' ? 'N/A' : record.assignedRoom}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-750">
                        {record.bedType ? (
                          <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                            {record.bedType} Bed
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No Bed</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-sm whitespace-normal">
                        {record.preferences}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Event Services Coordinator</span>
            <span>End of Report • Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}
