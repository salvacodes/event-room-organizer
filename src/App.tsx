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
    <div id="application-container" className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      <header
        id="application-header"
        className="bg-slate-900 text-white border-b border-slate-950 sticky top-0 z-40 print:hidden shadow-md"
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black select-none pointer-events-none flex-shrink-0">
              <span className="text-lg">🛏️</span>
            </div>
            <div>
              <h1 id="app-branded-title" className="text-base font-extrabold tracking-tight flex items-center gap-2">
                Event Bed Coordinator
                <span className="bg-slate-800 text-[10px] text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                  v0.1
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-none">
                Interactive room assigner, custom CSV mappings & instant print sheets.
              </p>
            </div>
          </div>

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

          <div />
        </div>
      </header>

      <nav
        id="workspace-navigation"
        className="bg-white border-b border-slate-200 sticky top-[73px] md:top-[72px] z-30 print:hidden shadow-xs"
      >
        <div className="px-6">
          <div className="flex items-center justify-center py-3 space-x-1.5">
            <button
              type="button"
              id="tab-csv-selector"
              onClick={() => setActiveTab('csv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'csv'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-150'
                  : 'text-slate-650 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              Rooms & Signups
            </button>

            <button
              type="button"
              id="tab-board-selector"
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-150'
                  : 'text-slate-650 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <DoorOpen className="w-4 h-4" />
              Rooming
            </button>

            <button
              type="button"
              id="tab-report-selector"
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-150'
                  : 'text-slate-650 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Printer className="w-4 h-4" />
              PDF Report
            </button>
          </div>
        </div>
      </nav>

      <main id="workspace-core-view" className="flex-1 w-full print:p-0">
        {activeTab === 'board' && (
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <AllocationBoard />
          </div>
        )}
        {activeTab === 'csv' && (
          <div className="animate-fadeIn px-4 sm:px-6 py-4 sm:py-6">
            <CsvImport />
          </div>
        )}
        {activeTab === 'report' && (
          <div className="animate-fadeIn px-4 sm:px-6 py-4 sm:py-6">
            <PrintReport />
          </div>
        )}
      </main>

      <div id="physical-page-print-injection" className="hidden print:block">
        <PrintReport />
      </div>
    </div>
  )
}
