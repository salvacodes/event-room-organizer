import { DoorOpen, FileText, Printer, RotateCcw, RotateCw, Sparkles, XCircle } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import CsvImport from './components/CsvImport'
import ParticipantPool from './components/ParticipantPool'
import PrintReport from './components/PrintReport'
import RoomCard from './components/RoomCard'
import type { HistoryState, Participant, Room } from './types'
import { parseBedConfiguration, parseCSV, SAMPLE_EXACT_REGISTRATION_CSV, SAMPLE_EXACT_ROOMS_CSV } from './utils'

export default function App() {
  // State 1: Active Workspace Tab
  const [activeTab, setActiveTab] = useState<'board' | 'csv' | 'report'>('board')

  // State 2: Active Core Lists
  const [rooms, setRooms] = useState<Room[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])

  // State 3: Undo / Redo stacks
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  // State 4: Dragged guest state (used for dynamic styling and browser-native drop constraint validation)
  const [draggedParticipant, setDraggedParticipant] = useState<Participant | null>(null)

  // State 5: Allocation Error notification
  const [assignError, setAssignError] = useState<string | null>(null)

  // Default Fallback: Boot with the exact room configuration of standard categories
  useEffect(() => {
    const savedRooms = localStorage.getItem('event_room_organizer_rooms_v1')
    const savedParticipants = localStorage.getItem('event_room_organizer_participants_v1')

    if (savedRooms && savedParticipants) {
      try {
        const parsedR = JSON.parse(savedRooms)
        const parsedP = JSON.parse(savedParticipants)
        setRooms(parsedR)
        setParticipants(parsedP)

        // Seed initial history
        setHistory([{ rooms: parsedR, participants: parsedP }])
        setHistoryIndex(0)
        return
      } catch (e) {
        console.warn('Stale local storage format. Re-rendering default pre-sets.')
      }
    }

    // Default Fallback: Boot with the exact prompt configs
    loadDefaultRetreatDataset()
  }, [])

  // Save changes to localStorage and record in history stack
  const commitWorkspaceState = (newRooms: Room[], newParticipants: Participant[]) => {
    setRooms(newRooms)
    setParticipants(newParticipants)

    localStorage.setItem('event_room_organizer_rooms_v1', JSON.stringify(newRooms))
    localStorage.setItem('event_room_organizer_participants_v1', JSON.stringify(newParticipants))

    // Clear redo history and push new state
    const currentHistory = history.slice(0, historyIndex + 1)
    const updatedHistory = [...currentHistory, { rooms: newRooms, participants: newParticipants }]

    // Cap history length to 50 for memory protection
    if (updatedHistory.length > 50) {
      updatedHistory.shift()
    }

    setHistory(updatedHistory)
    setHistoryIndex(updatedHistory.length - 1)
  }

  // Loads Exact A/B/C Standard Categories default dataset
  const loadDefaultRetreatDataset = () => {
    // Rooms
    const roomRows = parseCSV(SAMPLE_EXACT_ROOMS_CSV)
    const mockRooms: Room[] = []
    for (let i = 1; i < roomRows.length; i++) {
      const row = roomRows[i]
      if (row.length < 3) continue
      const id = row[0]
      const category = row[1] || 'Standard'
      const beds = parseBedConfiguration(row[2], id)
      const capacity = beds.length // slots calculated directly
      mockRooms.push({ id, beds, capacity, category })
    }

    // Guests
    const guestRows = parseCSV(SAMPLE_EXACT_REGISTRATION_CSV)
    const mockParticipants: Participant[] = []
    for (let i = 1; i < guestRows.length; i++) {
      const row = guestRows[i]
      if (row.length < 1 || !row[0]) continue
      mockParticipants.push({
        id: `p-default-${i}`,
        name: row[0],
        requestedRoomType: row[1] || 'Type A',
        requestedBedType: row[2] || 'single bed',
        sharingPreferences: row[3] || '',
        assignedRoomId: null,
        assignedBedId: null
      })
    }

    setRooms(mockRooms)
    setParticipants(mockParticipants)
    localStorage.setItem('event_room_organizer_rooms_v1', JSON.stringify(mockRooms))
    localStorage.setItem('event_room_organizer_participants_v1', JSON.stringify(mockParticipants))

    setHistory([{ rooms: mockRooms, participants: mockParticipants }])
    setHistoryIndex(0)
  }

  // Undo Handler
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      const state = history[prevIndex]
      setRooms(state.rooms)
      setParticipants(state.participants)
      setHistoryIndex(prevIndex)

      localStorage.setItem('event_room_organizer_rooms_v1', JSON.stringify(state.rooms))
      localStorage.setItem('event_room_organizer_participants_v1', JSON.stringify(state.participants))
    }
  }

  // Redo Handler
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      const state = history[nextIndex]
      setRooms(state.rooms)
      setParticipants(state.participants)
      setHistoryIndex(nextIndex)

      localStorage.setItem('event_room_organizer_rooms_v1', JSON.stringify(state.rooms))
      localStorage.setItem('event_room_organizer_participants_v1', JSON.stringify(state.participants))
    }
  }

  // Clear Allocation Map (Vacate all rooms but keep rooms & guests lists intact!)
  const handleResetAllocations = () => {
    const confirmation = window.confirm(
      'Are you sure you want to clear all current bed assignments? Participants details will remain, but everyone will return to the unassigned list.'
    )
    if (!confirmation) return

    const clearedRooms = rooms.map((room) => ({
      ...room,
      beds: room.beds.map((bed) => ({ ...bed, assignedParticipantId: null }))
    }))

    const clearedParticipants = participants.map((p) => ({
      ...p,
      assignedRoomId: null,
      assignedBedId: null
    }))

    commitWorkspaceState(clearedRooms, clearedParticipants)
  }

  // Assign Guest to a specific Room and Bed
  const handleAssignParticipant = (participantId: string, roomId: string, bedId: string) => {
    // 1. Deep clone state
    const updatedRooms = rooms.map((r) => ({
      ...r,
      beds: r.beds.map((b) => ({ ...b }))
    }))
    const updatedParticipants = participants.map((p) => ({ ...p }))

    const targetParticipant = updatedParticipants.find((p) => p.id === participantId)
    if (!targetParticipant) return

    const targetRoom = updatedRooms.find((r) => r.id === roomId)
    if (!targetRoom) return

    const targetBed = targetRoom.beds.find((b) => b.id === bedId)
    if (!targetBed) return

    // Strict validation check for permissible configurations
    const norm = (s: string) => (s || '').trim().toLowerCase()
    const reqRoom = norm(targetParticipant.requestedRoomType)
    const roomCat = norm(targetRoom.category)
    const reqBed = norm(targetParticipant.requestedBedType)
    const bedType = norm(targetBed.type)

    const roomMatches = reqRoom === roomCat
    const bedMatches = reqBed === bedType

    if (!roomMatches || !bedMatches) {
      setAssignError(
        `Assignment Blocked: "${targetParticipant.name}" requested Room Category [${targetParticipant.requestedRoomType}] and Bed Config [${targetParticipant.requestedBedType}]. You attempted to place them in a Room of Category [${targetRoom.category}] and Bed Config [${targetBed.label || targetBed.type}].`
      )
      return // Reject assignment completely!
    }

    // Success! Clear error state
    setAssignError(null)

    // Remove guest from any previous bed they occupied (vacate previous bed)
    if (targetParticipant.assignedRoomId && targetParticipant.assignedBedId) {
      const prevRoom = updatedRooms.find((r) => r.id === targetParticipant.assignedRoomId)
      if (prevRoom) {
        const prevBed = prevRoom.beds.find((b) => b.id === targetParticipant.assignedBedId)
        if (prevBed) {
          prevBed.assignedParticipantId = null
        }
      }
    }

    // Check if the target bed has an occupant. If so, evict that occupant back to unassigned list
    if (targetBed.assignedParticipantId) {
      const evictedGuestId = targetBed.assignedParticipantId
      const evictedGuest = updatedParticipants.find((p) => p.id === evictedGuestId)
      if (evictedGuest) {
        evictedGuest.assignedRoomId = null
        evictedGuest.assignedBedId = null
      }
    }

    // Make the new assignment
    targetBed.assignedParticipantId = participantId
    targetParticipant.assignedRoomId = roomId
    targetParticipant.assignedBedId = bedId

    commitWorkspaceState(updatedRooms, updatedParticipants)
  }

  // Unassign Participant (vacate their bed)
  const handleRemoveAssignment = (participantId: string) => {
    const updatedRooms = rooms.map((r) => ({
      ...r,
      beds: r.beds.map((b) => ({ ...b }))
    }))
    const updatedParticipants = participants.map((p) => ({ ...p }))

    const guest = updatedParticipants.find((p) => p.id === participantId)
    if (!guest) return

    if (guest.assignedRoomId && guest.assignedBedId) {
      const targetRoom = updatedRooms.find((r) => r.id === guest.assignedRoomId)
      if (targetRoom) {
        const targetBed = targetRoom.beds.find((b) => b.id === guest.assignedBedId)
        if (targetBed) {
          targetBed.assignedParticipantId = null
        }
      }
    }

    guest.assignedRoomId = null
    guest.assignedBedId = null

    commitWorkspaceState(updatedRooms, updatedParticipants)
  }

  // Auto-Allocation Algorithm
  // Matches unassigned participants strictly to rooms and beds that match their category & bed requests!
  const handleAutoAllocate = () => {
    // Clear any previous allocation errors
    setAssignError(null)

    const updatedRooms = rooms.map((r) => ({
      ...r,
      beds: r.beds.map((b) => ({ ...b }))
    }))
    const updatedParticipants = participants.map((p) => ({ ...p }))

    let matchesCount = 0

    // Loop through unassigned participants
    for (const participant of updatedParticipants) {
      if (participant.assignedRoomId) continue // Already assigned

      let assigned = false

      // Scan all rooms for an exact preferred category and bed type configuration match
      for (const room of updatedRooms) {
        const roomMatchesPref =
          room.category.trim().toLowerCase() === participant.requestedRoomType.trim().toLowerCase()
        if (!roomMatchesPref) continue

        for (const bed of room.beds) {
          if (bed.assignedParticipantId) continue // Bed occupied

          const bedMatchesPref = bed.type.trim().toLowerCase() === participant.requestedBedType.trim().toLowerCase()

          if (bedMatchesPref) {
            // Found exact compatible allocation!
            bed.assignedParticipantId = participant.id
            participant.assignedRoomId = room.id
            participant.assignedBedId = bed.id
            assigned = true
            matchesCount++
            break
          }
        }
        if (assigned) break
      }
    }

    if (matchesCount > 0) {
      commitWorkspaceState(updatedRooms, updatedParticipants)
      alert(
        `Auto-allocation complete! Automatically assigned ${matchesCount} unassigned guests matching their exact requested room type and bed configuration.`
      )
    } else {
      alert(
        'No additional unassigned participants could be auto-allocated. There are either no vacant beds remaining, or the available empty slots do not match any unassigned guest preferences!'
      )
    }
  }

  // Called from CsvImport when custom arrays are processed
  const handleDataLoaded = (newRooms: Room[], newParticipants: Participant[]) => {
    commitWorkspaceState(newRooms, newParticipants)
    setActiveTab('board') // bounce back to main board to see the new map
  }

  // Stats derivations
  const totalBedsCount = useMemo(() => rooms.reduce((sum, r) => sum + r.beds.length, 0), [rooms])
  const assignedCount = useMemo(() => participants.filter((p) => !!p.assignedRoomId).length, [participants])
  const unassignedCount = useMemo(() => participants.filter((p) => !p.assignedRoomId).length, [participants])

  return (
    <div id="application-container" className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* 
        ====================================================
        HEADER BANNER (Hides automatically during printing)
        ==================================================== 
      */}
      <header
        id="application-header"
        className="bg-slate-900 text-white border-b border-slate-950 px-6 py-4 sticky top-0 z-40 print:hidden shadow-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Platform details */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black select-none pointer-events-none">
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

          {/* Quick Metrics & Undo tools */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Realtime database status bar */}
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

            <div className="flex items-center bg-slate-800 border border-slate-700 p-1 rounded-lg">
              <button
                id="undo-btn"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-md hover:bg-slate-750 disabled:opacity-20 text-slate-300 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Undo mapping step"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <button
                id="redo-btn"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-md hover:bg-slate-750 disabled:opacity-20 text-slate-300 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Redo mapping step"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav
        id="workspace-navigation"
        className="bg-white border-b border-slate-200 sticky top-[73px] md:top-[68px] z-30 print:hidden shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* View selectors */}
            <div className="flex items-center space-x-1.5 py-3">
              <button
                id="tab-board-selector"
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'board'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-150'
                    : 'text-slate-650 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <DoorOpen className="w-4 h-4" />
                Accommodation Board
              </button>

              <button
                id="tab-csv-selector"
                onClick={() => setActiveTab('csv')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'csv'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-150'
                    : 'text-slate-650 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4" />
                Raw CSV Setup
              </button>

              <button
                id="tab-report-selector"
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'report'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-150'
                    : 'text-slate-650 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Printer className="w-4 h-4" />
                Official Handout PDF
              </button>
            </div>

            {/* Quick Action bar */}
            {activeTab === 'board' && (
              <div className="items-center gap-2 hidden lg:flex">
                <button
                  id="header-auto-allocate-btn"
                  onClick={handleAutoAllocate}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-150 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Run matching model to auto-assign vacant beds"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Allocate Beds
                </button>
                <button
                  id="header-clear-all-btn"
                  onClick={handleResetAllocations}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-150 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Remove all allocations"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reset Board
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main id="workspace-core-view" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 print:p-0">
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-4 print:hidden">
              <ParticipantPool
                participants={participants}
                rooms={rooms}
                onManualAssign={handleAssignParticipant}
                onRemoveAssignment={handleRemoveAssignment}
                onDragStartGuest={setDraggedParticipant}
                onDragEndGuest={() => setDraggedParticipant(null)}
              />
            </div>

            {/* Right Column: Rooms & Beds Layout */}
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Drag & Drop to Allocate</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Drag guests from the sidebar pool and drop them onto unoccupied bed slots below. Only beds that
                    match their exact requested room type and bed configuration are permitted.
                  </p>
                </div>
              </div>

              {/* Allocation Error alert banner */}
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
                      Hint: Check their preferred tags on their guest card. Each guest must be allocated according to
                      their specific room and bed type selections!
                    </p>
                  </div>
                  <button
                    onClick={() => setAssignError(null)}
                    className="absolute top-3.5 right-4 text-[10px] uppercase font-bold text-rose-600 hover:text-rose-800 bg-white hover:bg-rose-100/50 rounded-md px-2.5 py-1 transition-colors border border-rose-150 cursor-pointer shadow-2xs"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Rooms Map Grid */}
              {rooms.length === 0 ? (
                <div className="py-24 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-3xl">
                    🏨
                  </div>
                  <h3 className="text-base font-bold text-slate-700 mb-1">No rooms configuration loaded</h3>
                  <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                    To start distributing attendees on beds, set up your Event Rooms spreadsheet list inside the "Raw
                    CSV Setup" tab.
                  </p>
                  <button
                    onClick={() => setActiveTab('csv')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                  >
                    Open CSV Import Panel
                  </button>
                </div>
              ) : (
                <div id="rooms-bento-grid" className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      participants={participants}
                      onAssignParticipant={handleAssignParticipant}
                      onRemoveAssignment={handleRemoveAssignment}
                      draggedParticipant={draggedParticipant}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW 2: RAW CSV LOAD EDITOR --- */}
        {activeTab === 'csv' && (
          <div className="animate-fadeIn">
            <CsvImport
              onDataLoaded={handleDataLoaded}
              currentRoomsCount={rooms.length}
              currentParticipantsCount={participants.length}
            />
          </div>
        )}

        {/* --- VIEW 3: PRINT REPORT COMPILE & PRINT PREVIEW --- */}
        {activeTab === 'report' && (
          <div className="animate-fadeIn">
            <PrintReport rooms={rooms} participants={participants} />
          </div>
        )}
      </main>

      {/* 
        ====================================================
        NATIVE CSS PRINT DIRECTIVE (Invisible standard browser elements, active in physical printing)
        ==================================================== 
      */}
      <div id="physical-page-print-injection" className="hidden print:block">
        <PrintReport rooms={rooms} participants={participants} />
      </div>
    </div>
  )
}
