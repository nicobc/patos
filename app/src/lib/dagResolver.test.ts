import { describe, it, expect } from 'vitest'
import { buildAdjacency, topoSort } from './dagResolver'

function dep(task_id: string, depends_on_task_id: string) {
  return { task_id, depends_on_task_id }
}

describe('buildAdjacency', () => {
  it('initialises all taskIds as keys', () => {
    const adj = buildAdjacency(['A', 'B'], [])
    expect(adj.has('A')).toBe(true)
    expect(adj.has('B')).toBe(true)
  })

  it('adds blocker → dependent edge', () => {
    const adj = buildAdjacency(['A', 'B'], [dep('B', 'A')])
    expect(adj.get('A')).toContain('B')
    expect(adj.get('B')?.size).toBe(0)
  })
})

describe('topoSort — acyclic', () => {
  it('empty graph returns empty array', () => {
    expect(topoSort(new Map())).toEqual([])
  })

  it('single node with no deps', () => {
    const adj = buildAdjacency(['A'], [])
    const result = topoSort(adj)
    expect(result).toEqual(['A'])
  })

  it('linear chain: A → B → C', () => {
    const adj = buildAdjacency(['A', 'B', 'C'], [dep('B', 'A'), dep('C', 'B')])
    const result = topoSort(adj) as string[]
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'))
    expect(result.indexOf('B')).toBeLessThan(result.indexOf('C'))
    expect(result).toHaveLength(3)
  })

  it('diamond: A → B, A → C, B → D, C → D', () => {
    const adj = buildAdjacency(['A', 'B', 'C', 'D'], [
      dep('B', 'A'), dep('C', 'A'), dep('D', 'B'), dep('D', 'C'),
    ])
    const result = topoSort(adj) as string[]
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'))
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('C'))
    expect(result.indexOf('B')).toBeLessThan(result.indexOf('D'))
    expect(result.indexOf('C')).toBeLessThan(result.indexOf('D'))
    expect(result).toHaveLength(4)
  })

  it('disconnected components: A → B and C → D', () => {
    const adj = buildAdjacency(['A', 'B', 'C', 'D'], [dep('B', 'A'), dep('D', 'C')])
    const result = topoSort(adj) as string[]
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'))
    expect(result.indexOf('C')).toBeLessThan(result.indexOf('D'))
    expect(result).toHaveLength(4)
  })

  it('standalone nodes included alongside nodes with deps', () => {
    const adj = buildAdjacency(['A', 'B', 'X'], [dep('B', 'A')])
    const result = topoSort(adj) as string[]
    expect(result).toContain('X')
    expect(result).toHaveLength(3)
  })
})

describe('topoSort — cycles', () => {
  it('single cycle: A → B → C → A', () => {
    const adj = buildAdjacency(['A', 'B', 'C'], [dep('B', 'A'), dep('C', 'B'), dep('A', 'C')])
    const result = topoSort(adj)
    expect(Array.isArray(result)).toBe(false)
    const { cycles } = result as { cycles: string[][] }
    expect(cycles).toHaveLength(1)
    expect(cycles[0]).toContain('A')
    expect(cycles[0]).toContain('B')
    expect(cycles[0]).toContain('C')
  })

  it('multiple independent cycles: A ↔ B and C ↔ D', () => {
    const adj = buildAdjacency(['A', 'B', 'C', 'D'], [
      dep('B', 'A'), dep('A', 'B'),
      dep('D', 'C'), dep('C', 'D'),
    ])
    const result = topoSort(adj)
    expect(Array.isArray(result)).toBe(false)
    const { cycles } = result as { cycles: string[][] }
    expect(cycles).toHaveLength(2)
    const allNodes = cycles.flat()
    expect(allNodes).toContain('A')
    expect(allNodes).toContain('B')
    expect(allNodes).toContain('C')
    expect(allNodes).toContain('D')
  })

  it('cycle among some nodes, others processed normally', () => {
    // X → A → B → A (X is a root; A and B form a cycle)
    const adj = buildAdjacency(['X', 'A', 'B'], [dep('A', 'X'), dep('B', 'A'), dep('A', 'B')])
    const result = topoSort(adj)
    expect(Array.isArray(result)).toBe(false)
    const { cycles } = result as { cycles: string[][] }
    expect(cycles).toHaveLength(1)
    expect(cycles[0]).toContain('A')
    expect(cycles[0]).toContain('B')
    expect(cycles[0]).not.toContain('X')
  })
})
