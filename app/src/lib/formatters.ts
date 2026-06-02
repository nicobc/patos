export function formatCost(value: number | null): string {
  if (value == null) return '—'
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K€`
  return `€${value}`
}

export function formatDate(value: string | null): string {
  if (!value) return '—'
  const [y, m, day] = value.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}
