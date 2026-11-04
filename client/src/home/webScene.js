import { buildWebLines, nodePositions } from './webGeometry.js'

const LINE_VERTEX = `
attribute vec3 position;
attribute float reveal;
attribute float strength;
uniform mat4 view;
uniform float time;
uniform float drawn;
uniform vec2 pointer;
varying float alpha;
void main() {
  float radius = length(position.xy);
  vec3 moved = position;
  moved.z += sin(radius * 7.0 - time * 0.9) * 0.018;
  float near = smoothstep(0.55, 0.0, distance(position.xy, pointer));
  moved.z += near * 0.09 * sin(time * 2.2 + radius * 12.0);
  gl_Position = view * vec4(moved, 1.0);
  alpha = strength * smoothstep(reveal - 0.1, reveal + 0.1, drawn) * (0.35 + 0.65 * smoothstep(1.9, 0.1, radius));
}`

const LINE_FRAGMENT = `
precision mediump float;
varying float alpha;
void main() { gl_FragColor = vec4(1.0, 0.216, 0.216, alpha * 0.95); }`

const NODE_VERTEX = `
attribute vec3 position;
attribute vec3 color;
attribute float size;
uniform mat4 view;
uniform float pixelRatio;
varying vec3 tint;
void main() {
  gl_Position = view * vec4(position, 1.0);
  gl_PointSize = size * pixelRatio * (3.0 / gl_Position.w);
  tint = color;
}`

const NODE_FRAGMENT = `
precision mediump float;
varying vec3 tint;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float core = smoothstep(0.34, 0.24, d);
  float glow = pow(max(0.0, 1.0 - d), 2.0);
  gl_FragColor = vec4(tint, core + glow);
}`

const STATE_LOOK = {
  hidden: { color: [1, 1, 1], size: 0 },
  neutral: { color: [0.96, 0.96, 0.97], size: 15 },
  caught: { color: [0.3, 0.64, 1], size: 13 },
  missed: { color: [1, 0.69, 0], size: 40 },
  error: { color: [0.6, 0.6, 0.64], size: 12 },
  faded: { color: [0.45, 0.45, 0.5], size: 7 },
}

const EASE_PER_FRAME = 0.09
const MAX_PIXEL_RATIO = 2

function compile(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram()
  for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
  return program
}

function viewMatrix(aspect, tilt, spin, distance) {
  const f = 1 / Math.tan(0.45)
  const [ct, st, cs, ss] = [Math.cos(tilt), Math.sin(tilt), Math.cos(spin), Math.sin(spin)]
  const near = 0.1
  const far = 20
  const depth = (far + near) / (near - far)
  const shift = (2 * far * near) / (near - far)
  const fx = f / aspect
  const z = (x, y, w) => [x, y, w]
  const rows = [z(cs, -ss, 0), z(ct * ss, ct * cs, -st), z(st * ss, st * cs, ct)]
  return new Float32Array([
    fx * rows[0][0], f * rows[1][0], depth * rows[2][0], -rows[2][0],
    fx * rows[0][1], f * rows[1][1], depth * rows[2][1], -rows[2][1],
    fx * rows[0][2], f * rows[1][2], depth * rows[2][2], -rows[2][2],
    0, 0, depth * -distance + shift, distance,
  ])
}

function bindAttribute(gl, program, name, size, stride, offset) {
  const location = gl.getAttribLocation(program, name)
  gl.enableVertexAttribArray(location)
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset)
}

export function createWebScene(canvas, nodeCount) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: false })
  if (!gl) return null

  const linesProgram = compile(gl, LINE_VERTEX, LINE_FRAGMENT)
  const nodesProgram = compile(gl, NODE_VERTEX, NODE_FRAGMENT)
  const lines = buildWebLines()
  const lineBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, lines, gl.STATIC_DRAW)
  const nodeBuffer = gl.createBuffer()
  const positions = nodePositions(nodeCount)
  const current = positions.map(() => ({ color: [1, 1, 1], size: 0 }))
  const nodeData = new Float32Array(nodeCount * 7)

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
  gl.clearColor(0.043, 0.043, 0.051, 1)

  function resize() {
    const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO)
    canvas.width = canvas.clientWidth * ratio
    canvas.height = canvas.clientHeight * ratio
    gl.viewport(0, 0, canvas.width, canvas.height)
    return ratio
  }

  function easeNodes(states, ease) {
    current.forEach((node, index) => {
      const look = STATE_LOOK[states[index]]
      node.size += (look.size - node.size) * ease
      node.color = node.color.map((channel, c) => channel + (look.color[c] - channel) * ease)
      nodeData.set([...positions[index], ...node.color, node.size], index * 7)
    })
  }

  function drawLines(view, { time, drawn, pointer }) {
    gl.useProgram(linesProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
    bindAttribute(gl, linesProgram, 'position', 3, 20, 0)
    bindAttribute(gl, linesProgram, 'reveal', 1, 20, 12)
    bindAttribute(gl, linesProgram, 'strength', 1, 20, 16)
    gl.uniformMatrix4fv(gl.getUniformLocation(linesProgram, 'view'), false, view)
    gl.uniform1f(gl.getUniformLocation(linesProgram, 'time'), time)
    gl.uniform1f(gl.getUniformLocation(linesProgram, 'drawn'), drawn)
    gl.uniform2f(gl.getUniformLocation(linesProgram, 'pointer'), pointer[0], pointer[1])
    gl.drawArrays(gl.LINES, 0, lines.length / 5)
  }

  function drawNodes(view, ratio) {
    if (nodeCount === 0) return
    gl.useProgram(nodesProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, nodeData, gl.DYNAMIC_DRAW)
    bindAttribute(gl, nodesProgram, 'position', 3, 28, 0)
    bindAttribute(gl, nodesProgram, 'color', 3, 28, 12)
    bindAttribute(gl, nodesProgram, 'size', 1, 28, 24)
    gl.uniformMatrix4fv(gl.getUniformLocation(nodesProgram, 'view'), false, view)
    gl.uniform1f(gl.getUniformLocation(nodesProgram, 'pixelRatio'), ratio)
    gl.drawArrays(gl.POINTS, 0, nodeCount)
  }

  return function render({ time, drawn, tilt, spin, distance, states, pointer, settle }) {
    const ratio = resize()
    easeNodes(states, settle ? 1 : EASE_PER_FRAME)
    gl.clear(gl.COLOR_BUFFER_BIT)
    const view = viewMatrix(canvas.width / canvas.height, tilt, spin, distance)
    drawLines(view, { time, drawn, pointer })
    drawNodes(view, ratio)
  }
}
