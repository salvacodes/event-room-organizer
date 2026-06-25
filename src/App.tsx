import { DoorOpen, FileText, Printer } from 'lucide-react'
import AllocationBoard from './features/allocation/AllocationBoard'
import CsvImport from './features/csv-import/CsvImport'
import PrintReport from './features/report/PrintReport'
import { useWorkspaceStore } from './store/useWorkspaceStore'

export default function App() {
  const activeTab = useWorkspaceStore((s) => s.activeTab)
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab)
  const rooms = useWorkspaceStore((s) => s.rooms)
  const participants = useWorkspaceStore((s) => s.participants)

  const totalBedsCount = rooms.reduce((sum, r) => sum + r.beds.length, 0)
  const assignedCount = participants.filter((p) => !!p.assignedRoomId).length
  const unassignedCount = participants.filter((p) => !p.assignedRoomId).length

  return (
    <div
      id="application-container"
      className="h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 flex flex-col font-sans print:h-auto print:overflow-visible"
    >
      <header
        id="application-header"
        className="bg-slate-900 text-white border-b border-slate-950 sticky top-0 z-40 print:hidden shadow-md"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black select-none pointer-events-none flex-shrink-0">
              <span className="text-base">🛏️</span>
            </div>
            <div>
              <h1 id="app-branded-title" className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                Event Bed Coordinator
                <span className="bg-slate-800 text-[10px] text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-full font-mono">
                  v0.1
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none hidden md:block">
                Room assigner, CSV mappings & print sheets.
              </p>
            </div>
          </div>

          <nav id="workspace-navigation" className="flex items-center gap-1">
            <button
              type="button"
              id="tab-csv-selector"
              onClick={() => setActiveTab('csv')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'csv'
                  ? 'bg-indigo-500 text-white border border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Rooms & Signups
            </button>

            <button
              type="button"
              id="tab-board-selector"
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-indigo-500 text-white border border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              Rooming
            </button>

            <button
              type="button"
              id="tab-report-selector"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-indigo-500 text-white border border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              PDF Report
            </button>
          </nav>

          <div className="flex justify-end">
            <div className="items-center gap-3 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg hidden sm:flex">
              <div className="text-center font-mono">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Assigned</span>
                <span className="text-xs text-white font-extrabold">
                  {assignedCount} / {totalBedsCount}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div className="text-center font-mono">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Unassigned</span>
                <span className="text-xs text-amber-400 font-extrabold">{unassignedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="workspace-core-view" className="flex-1 min-h-0 w-full print:p-0 overflow-hidden">
        {activeTab === 'board' && (
          <div className="h-full flex flex-col px-4 sm:px-6 py-4 sm:py-6">
            <AllocationBoard />
          </div>
        )}
        {activeTab === 'csv' && (
          <div className="animate-fadeIn h-full flex flex-col px-4 sm:px-6 py-4 sm:py-6">
            <CsvImport />
          </div>
        )}
        {activeTab === 'report' && (
          <div className="animate-fadeIn h-full flex flex-col px-4 sm:px-6 py-4 sm:py-6">
            <PrintReport />
          </div>
        )}
      </main>
    </div>
  )
}
