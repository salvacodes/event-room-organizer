import { AlertTriangle, CheckCircle, FileText, HelpCircle, RefreshCw, Upload } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import type { Participant, Room } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import { parseBedConfiguration, parseCSV } from './csvParser'
import { SAMPLE_EXACT_REGISTRATION_CSV, SAMPLE_EXACT_ROOMS_CSV } from './sampleData'

export default function CsvImport() {
  const rooms = useWorkspaceStore((s) => s.rooms)
  const participants = useWorkspaceStore((s) => s.participants)
  const loadData = useWorkspaceStore((s) => s.loadData)

  const [roomsCsv, setRoomsCsv] = useState<string>(SAMPLE_EXACT_ROOMS_CSV)
  const [guestsCsv, setGuestsCsv] = useState<string>(SAMPLE_EXACT_REGISTRATION_CSV)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleProcess = () => {
    try {
      setErrorMsg(null)
      setSuccessMsg(null)

      const roomRows = parseCSV(roomsCsv)
      if (roomRows.length < 2) {
        throw new Error('Rooms CSV must have at least a header and one row of data.')
      }

      const roomHeader = roomRows[0].map((h) => h.toLowerCase())
      const idxRoomId = roomHeader.findIndex((h) => h.includes('room') || h.includes('id') || h.includes('number'))
      const idxBedConfig = roomHeader.findIndex(
        (h) => h.includes('bed') || h.includes('config') || h.includes('layout')
      )
      const idxCategory = roomHeader.findIndex((h) => h.includes('category') || h.includes('type'))

      if (idxRoomId === -1) {
        throw new Error("Rooms CSV requires a column named 'Room' or 'Room ID'.")
      }
      if (idxBedConfig === -1) {
        throw new Error("Rooms CSV requires a column named 'Bed Configuration' or 'Beds'.")
      }

      const parsedRooms: Room[] = []
      for (let i = 1; i < roomRows.length; i++) {
        const row = roomRows[i]
        if (row.length === 0 || (row.length === 1 && !row[0])) continue

        const id = row[idxRoomId] || `Room ${i}`
        const bedConfigStr = row[idxBedConfig] || ''
        const category = idxCategory !== -1 ? row[idxCategory] || 'Standard' : 'Standard'
        const beds = parseBedConfiguration(bedConfigStr, id)

        parsedRooms.push({ id, beds, capacity: beds.length, category })
      }

      const guestRows = parseCSV(guestsCsv)
      if (guestRows.length < 2) {
        throw new Error('Participants CSV must have at least a header and one row of data.')
      }

      const guestHeader = guestRows[0].map((h) => h.toLowerCase())
      const idxGuestName = guestHeader.findIndex(
        (h) =>
          h.includes('name') ||
          h.includes('person') ||
          h.includes('guest') ||
          h.includes('attendee') ||
          h.includes('participant')
      )
      const idxReqRoom = guestHeader.findIndex(
        (h) => h.includes('room') || h.includes('category') || h.includes('preferredroom')
      )
      const idxReqBed = guestHeader.findIndex(
        (h) => h.includes('bed') || h.includes('preferredbed') || h.includes('type')
      )
      const idxSharing = guestHeader.findIndex(
        (h) =>
          h.includes('share') ||
          h.includes('sharing') ||
          h.includes('preferences') ||
          h.includes('notes') ||
          h.includes('agreement')
      )

      if (idxGuestName === -1) {
        throw new Error("Participants CSV requires a column named 'Guest Name', 'Attendee Name', or 'Name'.")
      }

      const parsedParticipants: Participant[] = []
      for (let i = 1; i < guestRows.length; i++) {
        const row = guestRows[i]
        if (row.length === 0 || (row.length === 1 && !row[0])) continue

        const name = row[idxGuestName]
        if (!name) continue

        parsedParticipants.push({
          id: `p-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          requestedRoomType: idxReqRoom !== -1 ? row[idxReqRoom] || 'Standard' : 'Standard',
          requestedBedType: idxReqBed !== -1 ? row[idxReqBed] || 'Any' : 'Any',
          sharingPreferences: idxSharing !== -1 ? row[idxSharing] || '' : '',
          assignedRoomId: null,
          assignedBedId: null
        })
      }

      if (parsedRooms.length === 0) {
        throw new Error('No rooms successfully parsed. Check formatting.')
      }

      loadData(parsedRooms, parsedParticipants)
      setSuccessMsg(
        `Successfully loaded ${parsedRooms.length} Rooms and ${parsedParticipants.length} Participants to the allocation board!`
      )
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected parsing error occurred.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'rooms' | 'guests') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (target === 'rooms') {
        setRoomsCsv(text)
      } else {
        setGuestsCsv(text)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div id="csv-import-module" className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
      <div className="pb-4 border-b border-slate-100 mb-6">
        <h2 id="csv-import-title" className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600" />
          CSV Data Setup Coordinator
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Initialize or overwrite your event planning lists. Paste data manually or drag in CSV spreadsheets.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="bg-amber-100 text-amber-800 text-xs w-5 h-5 flex items-center justify-center rounded-full font-mono">
                1
              </span>
              Rooms List (CSV format)
            </label>
            <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Upload .csv file
              <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'rooms')} className="hidden" />
            </label>
          </div>
          <div className="relative">
            <textarea
              id="raw-rooms-csv-editor"
              value={roomsCsv}
              onChange={(e) => setRoomsCsv(e.target.value)}
              placeholder='Room,Type,Beds&#10;101 - Pine Cabin,Standard,"1 double bed (single occupancy), 1 single bed"'
              className="w-full h-56 font-mono text-xs p-3 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed custom-scrollbar"
            />
            <div className="absolute top-2 right-2 flex items-center text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded text-[10px] font-semibold select-none pointer-events-none">
              CSV Editor
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="bg-teal-100 text-teal-800 text-xs w-5 h-5 flex items-center justify-center rounded-full font-mono">
                2
              </span>
              Registrants & Signups (CSV format)
            </label>
            <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              Upload .csv file
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'guests')}
                className="hidden"
                id="registrants-csv-file-input"
              />
            </label>
          </div>
          <div className="relative">
            <textarea
              id="raw-registrants-csv-editor"
              value={guestsCsv}
              onChange={(e) => setGuestsCsv(e.target.value)}
              placeholder='Name,Room,Bed,Notes&#10;"David Miller",Standard,single bed,"Agreed to share with Harry"'
              className="w-full h-56 font-mono text-xs p-3 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed custom-scrollbar opacity-100"
            />
            <div className="absolute top-2 right-2 flex items-center text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded text-[10px] font-semibold select-none pointer-events-none">
              CSV Editor
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-semibold text-slate-700 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          CSV Column Format & Mapping Guidelines
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
          <div>
            <span className="font-semibold text-slate-700">Room Bed Configuration Rules:</span>
            <ul className="list-disc pl-4 mt-1 space-y-1 block">
              <li>
                <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">single bed</code> (Single/Bunk, cap=1)
              </li>
              <li>
                <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">double bed (single occupancy)</code>{' '}
                (Double bed for solo use, cap=1)
              </li>
              <li>
                <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">double bed (shared)</code> (Double bed
                for 2 people, parsed as 2 assignable slots)
              </li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Registrant Columns:</span> Need name (
            <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">Name</code>). The preferred bed should map
            directly to one of the bed configurations, and preferred rooms will match the Room Type (e.g.,{' '}
            <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">Type A</code>,{' '}
            <code className="bg-slate-200 px-1 rounded">Type C</code>).
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="text-slate-500 text-xs text-center md:text-left">
            <span className="font-medium text-slate-700 block md:inline">Current Workspace State: </span>
            <span className="bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded mr-2">
              {rooms.length} Rooms
            </span>
            <span className="bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded">
              {participants.length} Registrants
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button
            id="apply-csv-data-btn"
            onClick={handleProcess}
            className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Process and Load Lists
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  )
}
