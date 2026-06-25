import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'
import ParticipantPool from './ParticipantPool'

vi.mock('../../store/useWorkspaceStore', () => ({
  useWorkspaceStore: vi.fn()
}))

const unassigned = {
  id: 'p1',
  name: 'Alice Unassigned',
  requestedRoomType: 'Standard',
  requestedBedType: 'single bed',
  sharingPreferences: '',
  assignedRoomId: null,
  assignedBedId: null
}

const assigned = {
  id: 'p2',
  name: 'Bob Assigned',
  requestedRoomType: 'Standard',
  requestedBedType: 'single bed',
  sharingPreferences: '',
  assignedRoomId: 'Room 101',
  assignedBedId: 'bed-1'
}

function setupMock(participants = [unassigned, assigned]) {
  // biome-ignore lint/suspicious/noExplicitAny: test mock selector
  vi.mocked(useWorkspaceStore).mockImplementation((selector: (s: any) => unknown) =>
    selector({
      participants,
      rooms: [],
      assignParticipant: vi.fn(),
      removeAssignment: vi.fn(),
      setDraggedParticipant: vi.fn()
    })
  )
}

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
