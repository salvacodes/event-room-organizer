import { render, screen } from '@testing-library/react'
import i18n from 'i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import ParticipantPool from './ParticipantPool'

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn()
}))

beforeEach(() => {
  i18n.addResourceBundle(
    'en',
    'allocation',
    {
      pool: {
        title: 'Guests Registry Pool',
        searchPlaceholder: 'Search by name, room choice, shared notes...',
        roomTypeLabel: 'Room Type',
        allRoomTypes: 'All room types',
        emptyTitle: 'No matching guests found',
        emptyFilteredHint: 'Try clearing filters or search queries above.',
        emptyAllAssignedHint: 'All guests have already been assigned to rooms!',
        tip: 'Pick up any guest card and drag them directly into the designated bed circles in the room cards.',
        quickAllocate: 'Quick Allocate Bed...',
        selectAvailableBed: 'Select Available Bed:',
        close: 'Close',
        noVacantSlots: 'No vacant slots available matching:',
        noVacantCategory: '🏨 Category {{types}}',
        noVacantBed: '🛏️ Configuration {{bedType}}',
        sharingDetails: 'Preference & Share details:'
      }
    },
    true,
    true
  )
  i18n.changeLanguage('en')
})

const unassigned = {
  id: 'p1',
  name: 'Alice Unassigned',
  requestedRoomType: ['Standard'],
  requestedBedType: 'single bed',
  sharingPreferences: '',
  assignedRoomId: null,
  assignedBedId: null
}

const assigned = {
  id: 'p2',
  name: 'Bob Assigned',
  requestedRoomType: ['Standard'],
  requestedBedType: 'single bed',
  sharingPreferences: '',
  assignedRoomId: 'Room 101',
  assignedBedId: 'bed-1'
}

function setupMock(participants = [unassigned, assigned], roomTypeFilter = 'all') {
  // biome-ignore lint/suspicious/noExplicitAny: test mock selector
  vi.mocked(useWorkspaceStore).mockImplementation((selector: (s: any) => unknown) =>
    selector({
      participants,
      rooms: [],
      assignParticipant: vi.fn(),
      removeAssignment: vi.fn(),
      setDraggedParticipant: vi.fn(),
      roomTypeFilter,
      setRoomTypeFilter: vi.fn()
    })
  )
}

describe('ParticipantPool — multi-room-type filter', () => {
  it('shows a participant when the room type filter matches any of their requested room types', () => {
    const multiRoomParticipant = {
      id: 'p-multi',
      name: 'Multi Room Guest',
      requestedRoomType: ['2B', '2C'],
      requestedBedType: 'single' as const,
      sharingPreferences: '',
      assignedRoomId: null,
      assignedBedId: null
    }
    setupMock([multiRoomParticipant], '2C')
    render(<ParticipantPool />)
    expect(screen.getByText('Multi Room Guest')).toBeInTheDocument()
  })

  it('hides a participant when the room type filter does not match any of their requested room types', () => {
    const multiRoomParticipant = {
      id: 'p-multi',
      name: 'Multi Room Guest',
      requestedRoomType: ['2B', '2C'],
      requestedBedType: 'single' as const,
      sharingPreferences: '',
      assignedRoomId: null,
      assignedBedId: null
    }
    setupMock([multiRoomParticipant], '3A')
    render(<ParticipantPool />)
    expect(screen.queryByText('Multi Room Guest')).not.toBeInTheDocument()
  })
})

describe('ParticipantPool — room type filter label', () => {
  it('labels the filter "Room Type"', () => {
    setupMock()
    render(<ParticipantPool />)
    expect(screen.getByLabelText('Room Type')).toBeInTheDocument()
  })
})

describe('ParticipantPool — touch drag support', () => {
  it('sets touch-action none on draggable participant cards to prevent iPad scroll interference', () => {
    setupMock([unassigned])
    render(<ParticipantPool />)
    const card = document.getElementById(`participant-${unassigned.id}`)
    expect(card?.style.touchAction).toBe('none')
  })
})

describe('ParticipantPool — unassigned-only visibility', () => {
  it('renders unassigned participants', () => {
    setupMock()
    render(<ParticipantPool />)
    expect(screen.getByText('Alice Unassigned')).toBeInTheDocument()
  })

  it('does not render assigned participants', () => {
    setupMock()
    render(<ParticipantPool />)
    expect(screen.queryByText('Bob Assigned')).not.toBeInTheDocument()
  })

  it('shows empty state when all participants are assigned', () => {
    setupMock([assigned])
    render(<ParticipantPool />)
    expect(screen.getByText('No matching guests found')).toBeInTheDocument()
  })
})

describe('ParticipantPool — bed type translation', () => {
  it('shows translated bed type label on guest card when locale changes to Spanish', async () => {
    const participant = {
      id: 'p-single',
      name: 'Guest A',
      requestedRoomType: ['Standard'],
      requestedBedType: 'single' as const,
      sharingPreferences: '',
      assignedRoomId: null,
      assignedBedId: null
    }
    i18n.addResourceBundle(
      'es',
      'allocation',
      { roomCard: { bedTypeLabel: { single: 'Cama Individual' } } },
      true,
      true
    )
    await i18n.changeLanguage('es')
    setupMock([participant])
    render(<ParticipantPool />)
    expect(screen.getByText(/Cama Individual/)).toBeInTheDocument()
    await i18n.changeLanguage('en')
  })
})
