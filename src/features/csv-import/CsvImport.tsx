import { AlertTriangle, CheckCircle, HelpCircle, RefreshCw, Upload } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { BedType } from '../../shared/bedTypes'
import type { Participant, Room, TranslatableError } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import { ParseError, parseBedConfiguration, parseCSV, parseRoomTypes } from './csvParser'
import { SAMPLE_EXACT_REGISTRATION_CSV, SAMPLE_EXACT_ROOMS_CSV } from './sampleData'

export default function CsvImport() {
  const { t } = useTranslation('csvImport')
  const rooms = useWorkspaceStore((s) => s.rooms)
  const participants = useWorkspaceStore((s) => s.participants)
  const loadData = useWorkspaceStore((s) => s.loadData)

  const [roomsCsv, setRoomsCsv] = useState<string>(SAMPLE_EXACT_ROOMS_CSV)
  const [guestsCsv, setGuestsCsv] = useState<string>(SAMPLE_EXACT_REGISTRATION_CSV)
  const [errorMsg, setErrorMsg] = useState<TranslatableError | null>(null)
  const [successMsg, setSuccessMsg] = useState<TranslatableError | null>(null)

  const handleProcess = () => {
    try {
      setErrorMsg(null)
      setSuccessMsg(null)

      const roomRows = parseCSV(roomsCsv)
      if (roomRows.length < 2) {
        throw new ParseError('errors.roomsMinRows')
      }

      const roomHeader = roomRows[0].map((h) => h.toLowerCase())
      const idxRoomId = roomHeader.findIndex((h) => h.includes('room') || h.includes('id') || h.includes('number'))
      const idxBedConfig = roomHeader.findIndex(
        (h) => h.includes('bed') || h.includes('config') || h.includes('layout')
      )
      const idxCategory = roomHeader.findIndex((h) => h.includes('category') || h.includes('type'))

      if (idxRoomId === -1) {
        throw new ParseError('errors.roomsMissingRoomColumn')
      }
      if (idxBedConfig === -1) {
        throw new ParseError('errors.roomsMissingBedColumn')
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
        throw new ParseError('errors.participantsMinRows')
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
        throw new ParseError('errors.participantsMissingNameColumn')
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
          requestedRoomType: parseRoomTypes(idxReqRoom !== -1 ? row[idxReqRoom] || 'Standard' : 'Standard'),
          requestedBedType: (idxReqBed !== -1 ? row[idxReqBed] || 'single' : 'single') as BedType,
          sharingPreferences: idxSharing !== -1 ? row[idxSharing] || '' : '',
          assignedRoomId: null,
          assignedBedId: null
        })
      }

      if (parsedRooms.length === 0) {
        throw new ParseError('errors.noRoomsParsed')
      }

      loadData(parsedRooms, parsedParticipants)
      setSuccessMsg({ key: 'success', params: { rooms: parsedRooms.length, participants: parsedParticipants.length } })
    } catch (err: unknown) {
      if (err instanceof ParseError) {
        setErrorMsg({ key: err.translationKey, params: err.params })
      } else {
        setErrorMsg({ key: 'errors.unexpected' })
      }
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
    <div
      id="csv-import-module"
      className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 h-full flex flex-col min-h-0"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 mb-4 flex-shrink-0">
        <div>
          <h2 id="csv-import-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            {t('title')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block text-right">
            <span className="bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded mr-1.5">
              {t('rooms.count', { count: rooms.length })}
            </span>
            <span className="bg-slate-100 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded">
              {t('registrants.count', { count: participants.length })}
            </span>
          </div>
          <button
            type="button"
            id="apply-csv-data-btn"
            onClick={handleProcess}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('processButton')}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2 animate-fadeIn flex-shrink-0">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{t(errorMsg.key, errorMsg.params)}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn flex-shrink-0">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
          <span>{t(successMsg.key, successMsg.params)}</span>
        </div>
      )}

      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex-shrink-0">
        <h4 className="font-semibold text-slate-700 flex items-center gap-1 mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          {t('columnGuide.title')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 leading-relaxed">
          <div>
            <span className="font-semibold text-slate-700">{t('columnGuide.bedRulesTitle')}</span>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>
                <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">single</code>{' '}
                {t('columnGuide.singleDesc')}
              </li>
              <li>
                <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">double_single</code>{' '}
                {t('columnGuide.doubleSingleDesc')}
              </li>
              <li>
                <code className="bg-slate-200 px-1 rounded font-mono text-[10px]">double_shared</code>{' '}
                {t('columnGuide.doubleSharedDesc')}
              </li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-slate-700">{t('columnGuide.registrantColumnsTitle')}</span>{' '}
            <Trans
              i18nKey="columnGuide.registrantColumnsDetail"
              ns="csvImport"
              components={{ code: <code className="bg-slate-200 px-1 rounded font-mono text-[10px]" /> }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <label
              htmlFor="raw-rooms-csv-editor"
              className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <span className="bg-amber-100 text-amber-800 text-xs w-5 h-5 flex items-center justify-center rounded-full font-mono">
                1
              </span>
              {t('rooms.label')}
            </label>
            <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              {t('rooms.uploadFile')}
              <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'rooms')} className="hidden" />
            </label>
          </div>
          <div className="flex-1 min-h-0 relative">
            <textarea
              id="raw-rooms-csv-editor"
              value={roomsCsv}
              onChange={(e) => setRoomsCsv(e.target.value)}
              placeholder="Room,Type,Beds&#10;101 - Pine Cabin,Standard,1 double_single 1 single"
              className="w-full h-full font-mono text-xs p-3 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed custom-scrollbar resize-none"
            />
            <div className="absolute top-2 right-2 flex items-center text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded text-[10px] font-semibold select-none pointer-events-none">
              CSV Editor
            </div>
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <label
              htmlFor="raw-registrants-csv-editor"
              className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <span className="bg-teal-100 text-teal-800 text-xs w-5 h-5 flex items-center justify-center rounded-full font-mono">
                2
              </span>
              {t('registrants.label')}
            </label>
            <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              {t('registrants.uploadFile')}
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'guests')}
                className="hidden"
                id="registrants-csv-file-input"
              />
            </label>
          </div>
          <div className="flex-1 min-h-0 relative">
            <textarea
              id="raw-registrants-csv-editor"
              value={guestsCsv}
              onChange={(e) => setGuestsCsv(e.target.value)}
              placeholder='Name,Room,Bed,Notes&#10;"David Miller",Standard,single,"Agreed to share with Harry"'
              className="w-full h-full font-mono text-xs p-3 bg-slate-900 text-slate-200 rounded-lg border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed custom-scrollbar resize-none"
            />
            <div className="absolute top-2 right-2 flex items-center text-slate-500 bg-slate-900/60 px-2 py-0.5 rounded text-[10px] font-semibold select-none pointer-events-none">
              CSV Editor
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
