import { Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'

export default function PrintReport() {
  const { t } = useTranslation('report')
  const rooms = useWorkspaceStore((s) => s.rooms)
  const participants = useWorkspaceStore((s) => s.participants)

  const [reportTitle, setReportTitle] = useState(() => t('defaults.title'))
  const [reportNotes, setReportNotes] = useState(() => t('defaults.footerNotes'))
  const [sortBy, setSortBy] = useState<'room' | 'guest'>('room')
  const [showFooterNotes, setShowFooterNotes] = useState(true)

  const handlePrint = () => {
    window.print()
  }

  const guestRecords = useMemo(() => {
    return participants
      .map((p) => {
        const room = p.assignedRoomId ? rooms.find((r) => r.id === p.assignedRoomId) : null
        return {
          id: p.id,
          name: p.name,
          assignedRoom: p.assignedRoomId ?? null,
          category: room?.category || ''
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [participants, rooms])

  const roomRecords = useMemo(() => {
    return [...rooms].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }))
  }, [rooms])

  const maxGuestCount = useMemo(() => {
    if (roomRecords.length === 0) return 1
    return Math.max(1, ...roomRecords.map((r) => r.beds.filter((b) => b.assignedParticipantId).length))
  }, [roomRecords])

  return (
    <div id="print-report-module" className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      <div className="print:hidden w-full lg:w-96 lg:flex-shrink-0 bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4 lg:h-full lg:overflow-y-auto custom-scrollbar">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-600" />
            {t('compiler.title')}
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 leading-snug">{t('compiler.subtitle')}</p>
        </div>

        <button
          type="button"
          id="trigger-print-now-btn"
          onClick={handlePrint}
          className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          {t('compiler.printButton')}
        </button>
        <p className="text-[10px] text-slate-400 leading-snug">
          <Trans ns="report" i18nKey="compiler.printTip" components={{ 1: <strong className="text-slate-500" /> }} />
        </p>

        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex flex-col space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {t('compiler.handoutLayout')}
            </span>
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
                {t('compiler.sortByRoom')}
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
                {t('compiler.sortByGuest')}
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label
              htmlFor="report-custom-title"
              className="text-[10px] font-bold text-slate-500 uppercase tracking-wide"
            >
              {t('compiler.reportHeaderTitle')}
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
            <div className="flex items-center justify-between">
              <label
                htmlFor="report-custom-notes"
                className="text-[10px] font-bold text-slate-500 uppercase tracking-wide"
              >
                {t('compiler.footerInstructions')}
              </label>
              <input
                id="footer-notes-toggle"
                type="checkbox"
                checked={showFooterNotes}
                onChange={(e) => setShowFooterNotes(e.target.checked)}
                aria-label={t('compiler.enableFooterInstructions')}
                className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
              />
            </div>
            <textarea
              id="report-custom-notes"
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              disabled={!showFooterNotes}
              rows={3}
              className={`px-3 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-650 resize-none transition-opacity ${!showFooterNotes ? 'opacity-40 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
        <div
          id="printable-report-capture"
          className="bg-white text-slate-900 p-8 border border-slate-300 rounded-lg max-w-4xl mx-auto font-sans leading-normal relative shadow-xs"
        >
          <div className="border-b-2 border-slate-900 pb-3 mb-5">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">{reportTitle}</h1>
          </div>

          {showFooterNotes && reportNotes && (
            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed text-slate-700 italic">
              <span className="font-bold text-slate-900 not-italic block mb-0.5">{t('noticeLabel')}</span>"{reportNotes}
              "
            </div>
          )}

          {sortBy === 'room' && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
              {roomRecords.map((room) => {
                const guests = room.beds
                  .map((bed) =>
                    bed.assignedParticipantId ? participants.find((p) => p.id === bed.assignedParticipantId) : null
                  )
                  .filter(Boolean)

                return (
                  <div
                    key={room.id}
                    className="flex items-start gap-3 py-1.5 border-b border-slate-100 break-inside-avoid"
                  >
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-white shrink-0">
                      {room.id}
                    </span>
                    <span
                      data-testid={`room-guests-${room.id}`}
                      className="text-xs font-bold text-slate-900 leading-relaxed"
                    >
                      {Array.from({ length: maxGuestCount }, (_, i) => (
                        <span key={guests[i]?.id ?? `slot-${i}`} className={`block ${!guests[i] ? 'invisible' : ''}`}>
                          {guests[i]?.name ?? ' '}
                        </span>
                      ))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {sortBy === 'guest' && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
              {guestRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-2 py-1.5 border-b border-slate-100 break-inside-avoid"
                >
                  <span className="font-extrabold text-slate-900 text-xs flex-1">{record.name}</span>
                  <span
                    className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                      record.assignedRoom === null ? 'bg-rose-100 text-rose-800' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {record.assignedRoom ?? t('unassigned')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
