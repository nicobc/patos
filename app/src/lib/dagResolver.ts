export type RawDep = { task_id: string; depends_on_task_id: string }

export function buildAdjacency(taskIds: string[], rawDeps: RawDep[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()
  for (const id of taskIds) adj.set(id, new Set())
  for (const { task_id, depends_on_task_id } of rawDeps) {
    if (!adj.has(depends_on_task_id)) adj.set(depends_on_task_id, new Set())
    adj.get(depends_on_task_id)!.add(task_id)
  }
  return adj
}

export function topoSort(adj: Map<string, Set<string>>): string[] | { cycles: string[][] } {
  const inDegree = new Map<string, number>()
  for (const id of adj.keys()) inDegree.set(id, 0)
  for (const neighbors of adj.values()) {
    for (const n of neighbors) inDegree.set(n, (inDegree.get(n) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  const result: string[] = []
  while (queue.length > 0) {
    const node = queue.shift()!
    result.push(node)
    for (const neighbor of adj.get(node) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, deg)
      if (deg === 0) queue.push(neighbor)
    }
  }

  if (result.length === adj.size) return result

  const processed = new Set(result)
  const cycles: string[][] = []
  const visited = new Set<string>()

  for (const start of adj.keys()) {
    if (processed.has(start) || visited.has(start)) continue
    const cycle = findCycle(start, adj, processed)
    if (cycle) {
      for (const id of cycle) visited.add(id)
      cycles.push(cycle)
    }
  }

  return { cycles }
}

function findCycle(start: string, adj: Map<string, Set<string>>, processed: Set<string>): string[] | null {
  const path: string[] = []
  const onPath = new Set<string>()

  function dfs(node: string): string[] | null {
    if (onPath.has(node)) return path.slice(path.indexOf(node))
    if (processed.has(node)) return null
    path.push(node)
    onPath.add(node)
    for (const neighbor of adj.get(node) ?? []) {
      const found = dfs(neighbor)
      if (found) return found
    }
    path.pop()
    onPath.delete(node)
    return null
  }

  return dfs(start)
}
