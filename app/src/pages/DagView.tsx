import { useMemo, useRef, useLayoutEffect, useState, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import dagre from '@dagrejs/dagre'
import { buildAdjacency, topoSort, type RawDep } from '../lib/dagResolver'
import type { Task } from '../services/tasksService'
import './DagView.css'

const NODE_W = 200
const NODE_H = 56
const COMP_GAP = 32
const ARROW_ID = 'dag-arrowhead'
const ARROW_CYCLE_ID = 'dag-arrowhead-cycle'

const STATUS_LABELS: Record<string, string> = {
  ideation:    'Ideation',
  planned:     'Planned',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  done:        'Done',
}

interface Props {
  tasks: Task[]
  rawDeps: RawDep[]
  onSelectTask: (task: Task) => void
}

function findConnectedComponents(nodeIds: string[], adj: Map<string, Set<string>>): string[][] {
  const undirected = new Map<string, Set<string>>()
  for (const id of nodeIds) undirected.set(id, new Set())
  for (const [from, tos] of adj) {
    if (!undirected.has(from)) continue
    for (const to of tos) {
      if (!undirected.has(to)) continue
      undirected.get(from)!.add(to)
      undirected.get(to)!.add(from)
    }
  }
  const visited = new Set<string>()
  const components: string[][] = []
  for (const start of nodeIds) {
    if (visited.has(start)) continue
    const component: string[] = []
    const queue = [start]
    visited.add(start)
    while (queue.length > 0) {
      const node = queue.shift()!
      component.push(node)
      for (const neighbor of undirected.get(node) ?? []) {
        if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor) }
      }
    }
    components.push(component)
  }
  return components
}

function layoutComponent(nodeIds: string[], adj: Map<string, Set<string>>) {
  const nodeSet = new Set(nodeIds)
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', ranksep: 48, nodesep: 24, marginx: 20, marginy: 20 })
  g.setDefaultEdgeLabel(() => ({}))
  for (const id of nodeIds) g.setNode(id, { width: NODE_W, height: NODE_H })
  for (const [from, tos] of adj) {
    if (!nodeSet.has(from)) continue
    for (const to of tos) {
      if (!nodeSet.has(to)) continue
      g.setEdge(from, to)
    }
  }
  dagre.layout(g)
  return g
}

function edgePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  const p0 = pts[0]
  const pN = pts[pts.length - 1]
  if (pts.length === 2) return `M ${p0.x} ${p0.y} L ${pN.x} ${pN.y}`
  const mid = pts.slice(1, -1)
  if (mid.length === 1) return `M ${p0.x} ${p0.y} Q ${mid[0].x} ${mid[0].y} ${pN.x} ${pN.y}`
  return `M ${p0.x} ${p0.y} C ${mid[0].x} ${mid[0].y} ${mid[mid.length - 1].x} ${mid[mid.length - 1].y} ${pN.x} ${pN.y}`
}

export function DagView({ tasks, rawDeps, onSelectTask }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const transformRef  = useRef<ReactZoomPanPinchRef | null>(null)
  const lastTapRef    = useRef(0)
  const [fitScale, setFitScale] = useState<number | null>(null)

  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks])

  const { graphs, standaloneCount, cycleNodeIds } = useMemo(() => {
    const depTaskIds = new Set<string>()
    for (const { task_id, depends_on_task_id } of rawDeps) {
      depTaskIds.add(task_id)
      depTaskIds.add(depends_on_task_id)
    }
    const connectedIds = tasks.map(t => t.id).filter(id => depTaskIds.has(id))
    const standaloneCount = tasks.length - connectedIds.length

    if (connectedIds.length === 0) return { graphs: [], standaloneCount, cycleNodeIds: new Set<string>() }

    const adj = buildAdjacency(connectedIds, rawDeps)
    const sorted = topoSort(adj)
    const cycleNodeIds = Array.isArray(sorted)
      ? new Set<string>()
      : new Set<string>(sorted.cycles.flat())

    const graphs = findConnectedComponents(connectedIds, adj).map(ids => layoutComponent(ids, adj))
    return { graphs, standaloneCount, cycleNodeIds }
  }, [tasks, rawDeps])

  const maxGraphWidth = useMemo(
    () => Math.max(...graphs.map(g => g.graph().width ?? 0), 1),
    [graphs]
  )

  useLayoutEffect(() => {
    if (!containerRef.current || graphs.length === 0) return
    const containerWidth = containerRef.current.offsetWidth
    const scale = Math.min(1, containerWidth / maxGraphWidth)
    setFitScale(scale > 0 ? scale : 1)
  }, [maxGraphWidth, graphs.length])

  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300 && transformRef.current) {
      transformRef.current.centerView(fitScale ?? 1, 200)
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }, [fitScale])

  if (graphs.length === 0) {
    return (
      <div className="dag-view">
        <p className="board-message dag-placeholder">No dependencies yet</p>
        {standaloneCount > 0 && (
          <p className="dag-standalone-count">{standaloneCount} task{standaloneCount === 1 ? '' : 's'} have no dependencies</p>
        )}
      </div>
    )
  }

  return (
    <div className="dag-view" ref={containerRef}>
      {cycleNodeIds.size > 0 && (
        <p className="dag-cycle-warning">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {' '}Circular dependency detected
        </p>
      )}

      <svg width="0" height="0" aria-hidden="true" className="dag-defs">
        <defs>
          <marker id={ARROW_ID} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" className="dag-arrowhead" />
          </marker>
          <marker id={ARROW_CYCLE_ID} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" className="dag-arrowhead dag-arrowhead--cycle" />
          </marker>
        </defs>
      </svg>

      <div className="dag-zoom-container" onClick={handleDoubleTap}>
        {fitScale !== null && (
          <TransformWrapper
            key={fitScale}
            initialScale={fitScale}
            minScale={fitScale}
            maxScale={3}
            centerOnInit
            doubleClick={{ disabled: true }}
            panning={{ excluded: ['button'] }}
            onInit={(ref) => { transformRef.current = ref }}
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
            >
              <div className="dag-graphs-stack">
                {graphs.map((g, idx) => {
                  const { width = 0, height = 0 } = g.graph()
                  return (
                    <svg
                      key={idx}
                      className="dag-graph"
                      width={width}
                      height={height}
                      viewBox={`0 0 ${width} ${height}`}
                      style={idx < graphs.length - 1 ? { marginBottom: COMP_GAP } : undefined}
                    >
                      {g.edges().map(e => {
                        const isCycleEdge = cycleNodeIds.has(e.v) && cycleNodeIds.has(e.w)
                        return (
                          <path
                            key={`${e.v}→${e.w}`}
                            d={edgePath(g.edge(e).points ?? [])}
                            className={`dag-edge${isCycleEdge ? ' dag-edge--cycle' : ''}`}
                            markerEnd={`url(#${isCycleEdge ? ARROW_CYCLE_ID : ARROW_ID})`}
                          />
                        )
                      })}
                      {g.nodes().map(id => {
                        const { x, y } = g.node(id)
                        const task = taskMap.get(id)
                        if (!task) return null
                        return (
                          <foreignObject key={id} x={x - NODE_W / 2} y={y - NODE_H / 2} width={NODE_W} height={NODE_H}>
                            <button
                              className={`dag-node${cycleNodeIds.has(id) ? ' dag-node--cycle' : ''}`}
                              onClick={() => onSelectTask(task)}
                            >
                              <span className="dag-node-title">{task.title}</span>
                              <span className="dag-node-status">{STATUS_LABELS[task.status] ?? task.status}</span>
                            </button>
                          </foreignObject>
                        )
                      })}
                    </svg>
                  )
                })}
              </div>
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>

      {standaloneCount > 0 && (
        <p className="dag-standalone-count">
          {standaloneCount} task{standaloneCount === 1 ? '' : 's'} have no dependencies
        </p>
      )}
    </div>
  )
}
