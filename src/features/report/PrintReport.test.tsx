import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Participant, Room } from '../../shared/types'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import PrintReport from './PrintReport'

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn()
}))

const room: Room = {
  id: 'Room 101',
  category: 'Standard',
  capacity: 2,
  beds: [
    { id: 'bed-1', type: 'single', label: 'Single Bed', assignedParticipantId: 'p-1' },
    { id: 'bed-2', type: 'single', label: 'Double Bed', assignedParticipantId: null }
  ]
}

const participant: Participant = {
  id: 'p-1',
  name: 'Alice Smith',
  requestedRoomType: ['Standard'],
  requestedBedType: 'single',
  sharingPreferences: 'No strong preferences',
  assignedRoomId: 'Room 101',
  assignedBedId: 'bed-1'
}

function setupMock(rooms: Room[] = [], participants: Participant[] = []) {
  // biome-ignore lint/suspicious/noExplicitAny: test mock selector
  vi.mocked(useWorkspaceStore).mockImplementation((selector: (s: any) => unknown) => selector({ rooms, participants }))
}

describe('PrintReport — sidebar controls', () => {
  it('does not render the filter preview input', () => {
    setupMock()
    render(<PrintReport />)

    expect(screen.queryByPlaceholderText('Name, room number...')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/filter preview/i)).not.toBeInTheDocument()
  })
})

describe('PrintReport — report header', () => {
  it('does not show a print date in the report', () => {
    setupMock()
    render(<PrintReport />)

    expect(screen.queryByText(/Printed on the Web Portal/i)).not.toBeInTheDocument()
  })

  it('does not show the layout type badge', () => {
    setupMock()
    render(<PrintReport />)

    expect(screen.queryByText(/LAYOUT:/i)).not.toBeInTheDocument()
  })
})

describe('PrintReport — report footer', () => {
  it('does not show the report footer', () => {
    setupMock()
    render(<PrintReport />)

    expect(screen.queryByText(/Event Services Coordinator/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/End of Report/i)).not.toBeInTheDocument()
  })
})

describe('PrintReport — footer instructions toggle', () => {
  it('has a toggle checkbox for footer instructions', () => {
    setupMock()
    render(<PrintReport />)

    expect(screen.getByRole('checkbox', { name: /footer instructions/i })).toBeInTheDocument()
  })

  it('hides footer instructions from the report when toggle is turned off', () => {
    setupMock()
    render(<PrintReport />)
    fireEvent.click(screen.getByRole('checkbox', { name: /footer instructions/i }))

    expect(screen.queryByText(/Notice for Hosts & Guests/i)).not.toBeInTheDocument()
  })

  it('disables the footer notes textarea when toggle is off', () => {
    setupMock()
    render(<PrintReport />)
    fireEvent.click(screen.getByRole('checkbox', { name: /footer instructions/i }))

    expect(screen.getByLabelText('Footer Instructions')).toBeDisabled()
  })
})

describe('PrintReport — room view (compact)', () => {
  it('shows room id and guest names', () => {
    setupMock([room], [participant])
    render(<PrintReport />)

    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
  })

  it('renders the same number of guest slots in every room row, equal to the max guest count', () => {
    const twoGuestRoom: Room = {
      id: 'Room A',
      category: 'Standard',
      capacity: 2,
      beds: [
        { id: 'b1', type: 'single', assignedParticipantId: 'p-1' },
        { id: 'b2', type: 'single', assignedParticipantId: 'p-2' }
      ]
    }
    const oneGuestRoom: Room = {
      id: 'Room B',
      category: 'Standard',
      capacity: 1,
      beds: [{ id: 'b3', type: 'single', assignedParticipantId: 'p-3' }]
    }
    const threeParticipants: Participant[] = [
      {
        id: 'p-1',
        name: 'Alice',
        requestedRoomType: [],
        requestedBedType: 'single',
        sharingPreferences: '',
        assignedRoomId: 'Room A',
        assignedBedId: 'b1'
      },
      {
        id: 'p-2',
        name: 'Bob',
        requestedRoomType: [],
        requestedBedType: 'single',
        sharingPreferences: '',
        assignedRoomId: 'Room A',
        assignedBedId: 'b2'
      },
      {
        id: 'p-3',
        name: 'Carol',
        requestedRoomType: [],
        requestedBedType: 'single',
        sharingPreferences: '',
        assignedRoomId: 'Room B',
        assignedBedId: 'b3'
      }
    ]
    setupMock([twoGuestRoom, oneGuestRoom], threeParticipants)
    render(<PrintReport />)

    // Room A has 2 guests (the max), Room B has 1 — both should render 2 slots
    const roomASlots = screen.getByTestId('room-guests-Room A')
    const roomBSlots = screen.getByTestId('room-guests-Room B')
    expect(roomASlots.children).toHaveLength(2)
    expect(roomBSlots.children).toHaveLength(2)
  })

  it('does not show room category', () => {
    setupMock([room], [participant])
    render(<PrintReport />)

    expect(screen.queryByText('Standard')).not.toBeInTheDocument()
  })

  it('does not show bed type labels', () => {
    setupMock([room], [participant])
    render(<PrintReport />)

    expect(screen.queryByText(/Single Bed:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Double Bed:/)).not.toBeInTheDocument()
  })

  it('does not show sharing preferences', () => {
    setupMock([room], [participant])
    render(<PrintReport />)

    expect(screen.queryByText(/sharing preferences/i)).not.toBeInTheDocument()
    expect(screen.queryByText('No strong preferences')).not.toBeInTheDocument()
  })
})

describe('PrintReport — guest list view (compact)', () => {
  function renderGuestView() {
    setupMock([room], [participant])
    render(<PrintReport />)
    fireEvent.click(screen.getByText(/Guests List A-Z/))
  }

  it('shows guest name and room assignment', () => {
    renderGuestView()

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Room 101')).toBeInTheDocument()
  })

  it('does not show a row number column', () => {
    renderGuestView()

    expect(screen.queryByRole('columnheader', { name: '#' })).not.toBeInTheDocument()
  })

  it('does not show bed block information', () => {
    renderGuestView()

    expect(screen.queryByText(/Bed Block/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/single Bed/i)).not.toBeInTheDocument()
  })

  it('does not show sharing preferences or signup notes', () => {
    renderGuestView()

    expect(screen.queryByText(/Sharing Preferences/i)).not.toBeInTheDocument()
    expect(screen.queryByText('No strong preferences')).not.toBeInTheDocument()
  })
})
