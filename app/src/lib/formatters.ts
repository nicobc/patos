export function formatCost(value: number | null): string {
  if (value == null) return '—'
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K€`
  return `€${value}`
}

export function formatDate(value: string | null): string {
  if (!value) return '—'
  const [y, m, day] = value.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
}
