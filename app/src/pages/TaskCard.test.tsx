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

const defaultProps = {
  task,
  contractorName: null,
  prevStatus: null,
  nextStatus: 'planned',
  onSelect: vi.fn(),
  onStatusChange: vi.fn(),
}

describe('TaskCard', () => {
  it('renders title', () => {
    render(<TaskCard {...defaultProps} />)
    expect(screen.getByText('Paint walls')).toBeInTheDocument()
  })

  it('renders contractor name when provided', () => {
    render(<TaskCard {...defaultProps} contractorName="Alice" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('omits contractor row when null', () => {
    render(<TaskCard {...defaultProps} contractorName={null} />)
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('calls onSelect with the task when body is clicked', async () => {
    const onSelect = vi.fn()
    render(<TaskCard {...defaultProps} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /paint walls/i }))
    expect(onSelect).toHaveBeenCalledWith(task)
  })

  it('disables prev button when prevStatus is null', () => {
    render(<TaskCard {...defaultProps} prevStatus={null} />)
    expect(screen.getByRole('button', { name: /previous status/i })).toBeDisabled()
  })

  it('disables next button when nextStatus is null', () => {
    render(<TaskCard {...defaultProps} nextStatus={null} />)
    expect(screen.getByRole('button', { name: /next status/i })).toBeDisabled()
  })

  it('enables prev button when prevStatus is provided', () => {
    render(<TaskCard {...defaultProps} prevStatus="ideation" nextStatus="ready" />)
    expect(screen.getByRole('button', { name: /previous status/i })).not.toBeDisabled()
  })

  it('calls onStatusChange with prevStatus when prev is clicked', async () => {
    const onStatusChange = vi.fn()
    render(<TaskCard {...defaultProps} prevStatus="ideation" onStatusChange={onStatusChange} />)
    await userEvent.click(screen.getByRole('button', { name: /previous status/i }))
    expect(onStatusChange).toHaveBeenCalledWith(task, 'ideation')
  })

  it('calls onStatusChange with nextStatus when next is clicked', async () => {
    const onStatusChange = vi.fn()
    render(<TaskCard {...defaultProps} nextStatus="planned" onStatusChange={onStatusChange} />)
    await userEvent.click(screen.getByRole('button', { name: /next status/i }))
    expect(onStatusChange).toHaveBeenCalledWith(task, 'planned')
  })

  it('does not call onSelect when nav buttons are clicked', async () => {
    const onSelect = vi.fn()
    render(<TaskCard {...defaultProps} prevStatus="ideation" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /previous status/i }))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
