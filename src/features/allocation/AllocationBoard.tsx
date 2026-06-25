import { Sparkles, XCircle } from 'lucide-react'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import ParticipantPool from './ParticipantPool'
import RoomCard from './RoomCard'

export default function AllocationBoard() {
  const rooms = useWorkspaceStore((s) => s.rooms)
  const assignError = useWorkspaceStore((s) => s.assignError)
  const autoAllocate = useWorkspaceStore((s) => s.autoAllocate)
  const resetAllocations = useWorkspaceStore((s) => s.resetAllocations)
  const clearAssignError = useWorkspaceStore((s) => s.clearAssignError)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      <div className="xl:col-span-4 print:hidden">
        <ParticipantPool />
      </div>

      <div className="xl:col-span-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Drag & Drop to Allocate</h2>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Drag guests from the sidebar pool and drop them onto unoccupied bed slots below. Only beds that match
              their exact requested room type and bed configuration are permitted.
            </p>
          </div>
          <div className="items-center gap-2 hidden lg:flex flex-shrink-0">
            <button
              id="header-auto-allocate-btn"
              onClick={autoAllocate}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-150 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Run matching model to auto-assign vacant beds"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Allocate Beds
            </button>
            <button
              id="header-clear-all-btn"
              onClick={resetAllocations}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-150 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Remove all allocations"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reset Board
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
                ⚠️ Permissible Target Limit Restriction
              </h4>
              <p className="text-xs text-rose-700 font-semibold mt-1 leading-normal">{assignError}</p>
              <p className="text-[10px] text-rose-500 mt-1">
                Hint: Check their preferred tags on their guest card. Each guest must be allocated according to their
                specific room and bed type selections!
              </p>
            </div>
            <button
              onClick={clearAssignError}
              className="absolute top-3.5 right-4 text-[10px] uppercase font-bold text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-100/50 rounded-md px-2.5 py-1 transition-colors border border-rose-150 cursor-pointer shadow-2xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="py-24 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-3xl">🏨</div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No rooms configuration loaded</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              To start distributing attendees on beds, set up your Event Rooms spreadsheet list inside the "Raw CSV
              Setup" tab.
            </p>
          </div>
        ) : (
          <div id="rooms-bento-grid" className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
