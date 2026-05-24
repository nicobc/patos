import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TaskCard } from './TaskCard'

const task = {
  id: 't1', title: 'Paint walls', description: null,
  project_id: 'p1', owner_id: null, contractor_id: 'c1',
  expected_cost: null, actual_cost: null, expected_duration_days: null,
  actual_start: null, actual_end: null, status: 'ideation',
  created_at: '2026-01-01T00:00:00Z',
}

describe('TaskCard', () => {
  it('renders title', () => {
    render(<TaskCard task={task} contractorName={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Paint walls')).toBeInTheDocument()
  })

  it('renders contractor name when provided', () => {
    render(<TaskCard task={task} contractorName="Alice" onSelect={vi.fn()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('omits contractor row when null', () => {
    render(<TaskCard task={task} contractorName={null} onSelect={vi.fn()} />)
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('calls onSelect with the task when clicked', async () => {
    const onSelect = vi.fn()
    render(<TaskCard task={task} contractorName={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(task)
  })
})
