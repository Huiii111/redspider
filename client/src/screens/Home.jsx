import { useEffect, useMemo, useRef } from 'react'
import { ApiError, getBenchmark, NO_RUN } from '../api.js'
import { buildStory, nodeStates, stepIndexAt, stepOpacity } from '../home/story.js'
import { createWebScene } from '../home/webScene.js'
import { useRequest } from '../lib/useRequest.js'

const SCROLL_SCREENS_PER_STEP = 1.15

async function loadResultsIfAny() {
  try {
    return await getBenchmark()
  } catch (error) {
    if (error instanceof ApiError && error.code === NO_RUN) return null
    throw error
  }
}

function cameraAt(progress) {
  return {
    tilt: 0.62 - Math.min(progress * 1.4, 0.52),
    spin: progress * 1.1,
    distance: 2.9 - Math.sin(progress * Math.PI) * 0.7,
    drawn: Math.min(1.15, 0.72 + progress * 4),
  }
}

function usePointerOnWeb() {
  const pointer = useRef([9, 9])
  useEffect(() => {
    const onMove = (event) => {
      pointer.current = [(event.clientX / window.innerWidth - 0.5) * 2.4, (0.5 - event.clientY / window.innerHeight) * 2.4]
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return pointer
}

function useScrollStory({ storyRef, canvasRef, stepRefs, steps, faults }) {
  const pointer = usePointerOnWeb()

  useEffect(() => {
    const render = createWebScene(canvasRef.current, faults.length)
    const stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const states = steps.map((step) => nodeStates(faults, step.scene))
    let frame

    const draw = (now) => {
      const story = storyRef.current
      const travel = story.offsetHeight - window.innerHeight
      const progress = Math.min(1, Math.max(0, -story.getBoundingClientRect().top / travel))
      stepRefs.current.forEach((element, index) => {
        const opacity = stepOpacity(progress, index, steps.length)
        element.style.opacity = opacity
        element.style.visibility = opacity === 0 ? 'hidden' : 'visible'
        element.style.transform = stillMotion ? 'none' : `translateY(${(1 - opacity) * 28}px) scale(${0.985 + opacity * 0.015})`
      })
      if (render) {
        render({
          ...cameraAt(progress),
          time: stillMotion ? 0 : now / 1000,
          states: states[stepIndexAt(progress, steps.length)],
          pointer: pointer.current,
          settle: stillMotion,
        })
      }
      if (!stillMotion) frame = requestAnimationFrame(draw)
    }

    const drawOnce = () => draw(0)
    if (stillMotion) {
      drawOnce()
      window.addEventListener('scroll', drawOnce, { passive: true })
      window.addEventListener('resize', drawOnce)
    } else {
      frame = requestAnimationFrame(draw)
    }
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', drawOnce)
      window.removeEventListener('resize', drawOnce)
    }
  }, [canvasRef, faults, pointer, stepRefs, steps, storyRef])
}

function StoryStep({ step, elementRef }) {
  return (
    <section ref={elementRef} className={`story-step story-${step.kind}`}>
      {step.kicker && <p className="story-kicker">{step.kicker}</p>}
      <h1>{step.big}</h1>
      {step.line && <p className="story-line">{step.line}</p>}
      {step.kind === 'title' && <p className="story-cue" aria-hidden="true">Scroll</p>}
      {step.kind === 'finish' && (
        <div className="story-actions">
          <a className="button" href="#/">See every result</a>
          <a className="story-link" href="#/try">Try the scanners yourself</a>
        </div>
      )}
    </section>
  )
}

function Story({ benchmark }) {
  const steps = useMemo(() => buildStory(benchmark), [benchmark])
  const faults = useMemo(() => (benchmark ? benchmark.faults : []), [benchmark])
  const storyRef = useRef(null)
  const canvasRef = useRef(null)
  const stepRefs = useRef([])
  useScrollStory({ storyRef, canvasRef, stepRefs, steps, faults })

  return (
    <div ref={storyRef} className="story" style={{ height: `${steps.length * SCROLL_SCREENS_PER_STEP * 100}vh` }}>
      <div className="story-stage">
        <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />
        {steps.map((step, index) => (
          <StoryStep
            key={step.id}
            step={step}
            elementRef={(element) => {
              stepRefs.current[index] = element
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function Home() {
  const result = useRequest(loadResultsIfAny)
  if (result.status === 'loading') return <div className="story-loading" />
  return <Story key={result.status} benchmark={result.status === 'ready' ? result.data : null} />
}
