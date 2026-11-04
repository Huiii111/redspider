const SPOKES = 14
const RINGS = 12
const SEGMENTS_PER_THREAD = 8
const SAG = 0.07
const LAYERS = [
  { depth: 0, scale: 1, strength: 1 },
  { depth: -0.45, scale: 1.35, strength: 0.35 },
  { depth: -0.95, scale: 1.8, strength: 0.14 },
]
const NODE_SPOKE_STEP = 5
const FIRST_NODE_RING = 3
const NODE_RING_COUNT = 9

const ringRadius = (ring) => 0.12 + (ring / RINGS) * 0.98
const spokeAngle = (spoke) => (spoke / SPOKES) * Math.PI * 2 + Math.sin(spoke * 2.4) * 0.05

function threadPoint(ring, spoke, along) {
  const start = spokeAngle(spoke)
  const next = spoke + 1 === SPOKES ? spokeAngle(0) + Math.PI * 2 : spokeAngle(spoke + 1)
  const angle = start + (next - start) * along
  const radius = ringRadius(ring) * (1 - SAG * Math.sin(Math.PI * along))
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

function addLine(lines, [ax, ay], [bx, by], layer, reveal) {
  const z = layer.depth
  const s = layer.scale
  lines.push(ax * s, ay * s, z, reveal, layer.strength, bx * s, by * s, z, reveal, layer.strength)
}

function addSpokes(lines, layer) {
  for (let spoke = 0; spoke < SPOKES; spoke += 1) {
    const angle = spokeAngle(spoke)
    const rim = ringRadius(RINGS) * 1.5
    const point = (radius) => [Math.cos(angle) * radius, Math.sin(angle) * radius]
    for (let piece = 0; piece < RINGS; piece += 1) {
      const inner = (piece / RINGS) * rim
      const outer = ((piece + 1) / RINGS) * rim
      addLine(lines, point(inner), point(outer), layer, piece / RINGS)
    }
  }
}

function addRings(lines, layer) {
  for (let ring = 1; ring <= RINGS; ring += 1) {
    for (let spoke = 0; spoke < SPOKES; spoke += 1) {
      for (let piece = 0; piece < SEGMENTS_PER_THREAD; piece += 1) {
        const from = threadPoint(ring, spoke, piece / SEGMENTS_PER_THREAD)
        const to = threadPoint(ring, spoke, (piece + 1) / SEGMENTS_PER_THREAD)
        addLine(lines, from, to, layer, ring / RINGS)
      }
    }
  }
}

export function buildWebLines() {
  const lines = []
  LAYERS.forEach((layer) => {
    addSpokes(lines, layer)
    addRings(lines, layer)
  })
  return new Float32Array(lines)
}

export function nodePositions(count) {
  return Array.from({ length: count }, (_, index) => {
    const spoke = (index * NODE_SPOKE_STEP) % SPOKES
    const ring = FIRST_NODE_RING + (index % NODE_RING_COUNT)
    const angle = spokeAngle(spoke)
    return [Math.cos(angle) * ringRadius(ring), Math.sin(angle) * ringRadius(ring), 0]
  })
}
