import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Board } from './Board'

vi.mock('../services/projectsService', () => ({
  listProjects: vi.fn(),
}))

import { listProjects } from '../services/projectsService'
const mockListProjects = vi.mocked(listProjects)

const projects = [
  { id: 'p1', name: 'Short-term reno', description: null, created_at: '' },
  { id: 'p2', name: 'Long-term reno',  description: null, created_at: '' },
]

beforeEach(() => vi.clearAllMocks())

describe('Board', () => {
  it('shows loading state initially', () => {
    mockListProjects.mockImplementation(() => new Promise(() => {}))
    render(<Board />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders project selector and 5 columns after load', async () => {
    mockListProjects.mockResolvedValue(projects)
    render(<Board />)

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /select project/i })).toBeInTheDocument()
    )

    for (const label of ['Ideation', 'Planned', 'Ready', 'In Progress', 'Done']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('auto-selects the first project', async () => {
    mockListProjects.mockResolvedValue(projects)
    render(<Board />)

    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('p1')
    })
  })

  it('updates selected project on change', async () => {
    mockListProjects.mockResolvedValue(projects)
    render(<Board />)

    const select = await screen.findByRole('combobox')
    await userEvent.selectOptions(select, 'p2')

    expect((select as HTMLSelectElement).value).toBe('p2')
  })

  it('shows 5 empty-state messages', async () => {
    mockListProjects.mockResolvedValue(projects)
    render(<Board />)

    await waitFor(() => {
      expect(screen.getAllByText('No tasks')).toHaveLength(5)
    })
  })

  it('shows error state when fetch fails', async () => {
    mockListProjects.mockRejectedValue(new Error('network error'))
    render(<Board />)

    await waitFor(() =>
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument()
    )
  })
})
