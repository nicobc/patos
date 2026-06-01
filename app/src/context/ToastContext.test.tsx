import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ToastProvider } from './ToastContext'
import { useToast } from './useToast'

function Trigger({ message = 'Hello' }: { message?: string }) {
  const { showToast } = useToast()
  return <button onClick={() => showToast(message)}>trigger</button>
}

function MultiTrigger() {
  const { showToast } = useToast()
  return (
    <>
      <button onClick={() => showToast('First')}>first</button>
      <button onClick={() => showToast('Second')}>second</button>
    </>
  )
}

function ActionTrigger({ onAction }: { onAction: () => void }) {
  const { showToast } = useToast()
  return (
    <button onClick={() => showToast('Moved', { action: { label: 'Undo', onAction } })}>
      trigger
    </button>
  )
}

afterEach(() => vi.useRealTimers())

describe('ToastProvider', () => {
  it('shows toast message when triggered', async () => {
    const user = userEvent.setup()
    render(<ToastProvider><Trigger message="Task saved" /></ToastProvider>)
    await user.click(screen.getByRole('button', { name: 'trigger' }))
    expect(screen.getByText('Task saved')).toBeInTheDocument()
  })

  it('renders action button when action is provided', async () => {
    const user = userEvent.setup()
    render(<ToastProvider><ActionTrigger onAction={vi.fn()} /></ToastProvider>)
    await user.click(screen.getByRole('button', { name: 'trigger' }))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('calls onAction when action button is clicked', async () => {
    const onAction = vi.fn()
    const user = userEvent.setup()
    render(<ToastProvider><ActionTrigger onAction={onAction} /></ToastProvider>)
    await user.click(screen.getByRole('button', { name: 'trigger' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('dismisses toast after 2.5 seconds', () => {
    vi.useFakeTimers()
    render(<ToastProvider><Trigger message="Task saved" /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'trigger' }))
    expect(screen.getByText('Task saved')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2500))
    act(() => vi.advanceTimersByTime(150))
    expect(screen.queryByText('Task saved')).not.toBeInTheDocument()
  })

  it('replaces existing toast when a new one is triggered', async () => {
    const user = userEvent.setup()
    render(<ToastProvider><MultiTrigger /></ToastProvider>)
    await user.click(screen.getByRole('button', { name: 'first' }))
    expect(screen.getByText('First')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'second' }))
    expect(screen.queryByText('First')).not.toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})
