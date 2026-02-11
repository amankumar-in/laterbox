import React, { useMemo } from 'react'
import { Canvas, Path, Skia } from '@shopify/react-native-skia'
import type { BoardConnection, BoardItem } from '../../types'

interface ConnectionsLayerProps {
  connections: BoardConnection[]
  items: BoardItem[]
  width: number
  height: number
  translateX: number
  translateY: number
  scale: number
  selectedConnectionIds: Set<string>
  localOverrides?: Map<string, { x: number; y: number; width: number; height: number }>
}

function getEdgeMidpoint(
  item: BoardItem,
  side: string,
  translateX: number,
  translateY: number,
  scale: number,
  override?: { x: number; y: number; width: number; height: number } | null
): { x: number; y: number } {
  const ix = override ? override.x : item.x
  const iy = override ? override.y : item.y
  const iw = override ? override.width : item.width
  const ih = override ? override.height : item.height
  const x = ix * scale + translateX
  const y = iy * scale + translateY
  const w = iw * scale
  const h = ih * scale

  switch (side) {
    case 'top': return { x: x + w / 2, y }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left': return { x, y: y + h / 2 }
    case 'right': return { x: x + w, y: y + h / 2 }
    default: return { x: x + w / 2, y: y + h / 2 }
  }
}

function makeArrowhead(tipX: number, tipY: number, angle: number, size: number): any {
  const arrowPath = Skia.Path.Make()
  arrowPath.moveTo(tipX, tipY)
  arrowPath.lineTo(
    tipX - size * Math.cos(angle - Math.PI / 6),
    tipY - size * Math.sin(angle - Math.PI / 6)
  )
  arrowPath.moveTo(tipX, tipY)
  arrowPath.lineTo(
    tipX - size * Math.cos(angle + Math.PI / 6),
    tipY - size * Math.sin(angle + Math.PI / 6)
  )
  return arrowPath
}

export function ConnectionsLayer({
  connections,
  items,
  width,
  height,
  translateX,
  translateY,
  scale,
  selectedConnectionIds,
  localOverrides,
}: ConnectionsLayerProps) {
  const itemMap = useMemo(() => {
    const map = new Map<string, BoardItem>()
    items.forEach((item) => map.set(item.id, item))
    return map
  }, [items])

  const connectionPaths = useMemo(() => {
    return connections.map((conn) => {
      const fromItem = itemMap.get(conn.fromItemId)
      const toItem = itemMap.get(conn.toItemId)
      if (!fromItem || !toItem) return null

      const fromOv = localOverrides?.get(fromItem.id) ?? null
      const toOv = localOverrides?.get(toItem.id) ?? null

      const from = getEdgeMidpoint(fromItem, conn.fromSide, translateX, translateY, scale, fromOv)
      const to = getEdgeMidpoint(toItem, conn.toSide, translateX, translateY, scale, toOv)

      const isSelected = selectedConnectionIds.has(conn.id)

      const dx = to.x - from.x
      const dy = to.y - from.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const path = Skia.Path.Make()
      path.moveTo(from.x, from.y)

      if (dist < 30 * scale) {
        path.lineTo(to.x, to.y)
      } else {
        const midX = (from.x + to.x) / 2
        const midY = (from.y + to.y) / 2
        const perpX = -(to.y - from.y) / dist * 30 * scale
        const perpY = (to.x - from.x) / dist * 30 * scale

        const needsCurve = conn.fromSide === conn.toSide
        if (needsCurve) {
          path.quadTo(midX + perpX, midY + perpY, to.x, to.y)
        } else {
          path.lineTo(to.x, to.y)
        }
      }

      const arrowSize = 10 * scale
      const angleToEnd = Math.atan2(to.y - from.y, to.x - from.x)
      const angleToStart = angleToEnd + Math.PI // reverse direction

      // Build arrow paths based on arrowStart/arrowEnd
      const arrowPaths: any[] = []
      if (conn.arrowEnd) {
        arrowPaths.push(makeArrowhead(to.x, to.y, angleToEnd, arrowSize))
      }
      if (conn.arrowStart) {
        arrowPaths.push(makeArrowhead(from.x, from.y, angleToStart, arrowSize))
      }

      return { conn, path, arrowPaths, isSelected }
    }).filter(Boolean) as { conn: BoardConnection; path: any; arrowPaths: any[]; isSelected: boolean }[]
  }, [connections, itemMap, translateX, translateY, scale, selectedConnectionIds, localOverrides])

  return (
    <Canvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
      }}
    >
      {/* Selection outline — rendered behind the actual line */}
      {connectionPaths.map(({ conn, path, arrowPaths, isSelected }) =>
        isSelected ? (
          <React.Fragment key={`sel-${conn.id}`}>
            <Path
              path={path}
              color="#3b82f6"
              style="stroke"
              strokeWidth={(conn.strokeWidth + 6) * scale}
              strokeCap="round"
            />
            {arrowPaths.map((ap, i) => (
              <Path
                key={`sel-arrow-${conn.id}-${i}`}
                path={ap}
                color="#3b82f6"
                style="stroke"
                strokeWidth={(conn.strokeWidth + 6) * scale}
                strokeCap="round"
              />
            ))}
          </React.Fragment>
        ) : null
      )}
      {/* Actual lines on top — always use real color */}
      {connectionPaths.map(({ conn, path, isSelected }) => (
        <Path
          key={conn.id}
          path={path}
          color={conn.color}
          style="stroke"
          strokeWidth={conn.strokeWidth * scale}
          strokeCap="round"
        />
      ))}
      {connectionPaths.map(({ conn, arrowPaths }) =>
        arrowPaths.map((ap, i) => (
          <Path
            key={`arrow-${conn.id}-${i}`}
            path={ap}
            color={conn.color}
            style="stroke"
            strokeWidth={conn.strokeWidth * scale}
            strokeCap="round"
          />
        ))
      )}
    </Canvas>
  )
}
