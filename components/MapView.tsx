'use client'

import { motion } from 'framer-motion'

interface TagLocation {
  id: string
  x: number
  y: number
  name?: string
}

interface PathSegment {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

interface MapViewProps {
  className?: string
}

const TAGS: TagLocation[] = [
  { id: '1', x: 20, y: 30, name: 'Oak Trail Start' },
  { id: '2', x: 45, y: 20, name: 'Hilltop' },
  { id: '3', x: 70, y: 40, name: 'River Crossing' },
  { id: '4', x: 30, y: 60, name: 'Pine Grove' },
  { id: '5', x: 80, y: 70, name: 'Meadow Loop' },
]

const PATHS: PathSegment[] = [
  { id: 'p1', x1: 20, y1: 30, x2: 45, y2: 20 },
  { id: 'p2', x1: 45, y1: 20, x2: 70, y2: 40 },
  { id: 'p3', x1: 20, y1: 30, x2: 30, y2: 60 },
  { id: 'p4', x1: 70, y1: 40, x2: 80, y2: 70 },
  { id: 'p5', x1: 30, y1: 60, x2: 80, y2: 70 },
]

export function MapView({ className = '' }: MapViewProps) {
  return (
    <motion.div
      className={`map-view ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      data-testid="map-view"
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" className="text-gray-600">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Faded paths from other users */}
      <svg className="absolute inset-0 w-full h-full">
        {PATHS.map((path, i) => (
          <motion.line
            key={path.id}
            x1={`${path.x1}%`}
            y1={`${path.y1}%`}
            x2={`${path.x2}%`}
            y2={`${path.y2}%`}
            stroke="#4b5563"
            strokeWidth="2"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}
      </svg>

      {/* Tag locations */}
      {TAGS.map((tag, i) => (
        <motion.div
          key={tag.id}
          className="map-tag"
          style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.5 + i * 0.1 }}
          title={tag.name}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-runtag-green"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        </motion.div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-runtag-gray">
        <div className="w-3 h-3 rounded-full bg-runtag-green" />
        <span>Active tags</span>
      </div>
    </motion.div>
  )
}
