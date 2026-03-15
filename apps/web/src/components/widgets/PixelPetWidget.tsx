import { useEffect, useRef } from 'react'

const spriteSets: Record<string, [number, number][]> = {
  idle:         [[-3, -3]],
  alert:        [[-7, -3]],
  scratchSelf:  [[-5, 0], [-6, 0], [-7, 0]],
  tired:        [[-3, -2]],
  sleeping:     [[-2, 0], [-2, -1]],
  N:            [[-1, -2], [-1, -3]],
  NE:           [[0,  -2], [0,  -3]],
  E:            [[-3,  0], [-3, -1]],
  SE:           [[-5, -1], [-5, -2]],
  S:            [[-6, -3], [-7, -2]],
  SW:           [[-5, -3], [-6, -1]],
  W:            [[-4, -2], [-4, -3]],
  NW:           [[-1,  0], [-1, -1]],
}

const SPEED = 10
const FRAME_MS = 100

export function PixelPetWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const nekoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const nekoEl = nekoRef.current
    if (!container || !nekoEl) return

    const c: HTMLDivElement = container
    const el: HTMLDivElement = nekoEl

    const pos = { x: c.offsetWidth / 2, y: c.offsetHeight / 2 }
    const target = { x: pos.x, y: pos.y }

    let frameCount = 0
    let idleTime = 0
    let idleAnim: string | null = null
    let idleAnimFrame = 0
    let lastTimestamp: number | null = null
    let rafId: number

    function setSprite(name: string, frame: number) {
      const set = spriteSets[name]
      const [col, row] = set[frame % set.length]
      el.style.backgroundPosition = `${col * 64}px ${row * 64}px`
    }

    function randomTarget() {
      const w = c.offsetWidth
      const h = c.offsetHeight
      target.x = 32 + Math.random() * Math.max(1, w - 64)
      target.y = 32 + Math.random() * Math.max(1, h - 64)
    }

    function resetIdleAnim() {
      idleAnim = null
      idleAnimFrame = 0
    }

    function idle() {
      idleTime += 1

      if (idleTime > 10 && Math.floor(Math.random() * 200) === 0 && idleAnim === null) {
        const opts = ['sleeping', 'scratchSelf']
        idleAnim = opts[Math.floor(Math.random() * opts.length)]
      }

      switch (idleAnim) {
        case 'sleeping':
          if (idleAnimFrame < 8) {
            setSprite('tired', 0)
          } else {
            setSprite('sleeping', Math.floor(idleAnimFrame / 4))
            if (idleAnimFrame > 192) resetIdleAnim()
          }
          idleAnimFrame += 1
          break
        case 'scratchSelf':
          setSprite('scratchSelf', idleAnimFrame)
          if (idleAnimFrame > 9) resetIdleAnim()
          idleAnimFrame += 1
          break
        default:
          setSprite('idle', 0)
          if (idleTime > 60) {
            randomTarget()
            idleTime = 0
          }
      }
    }

    function frame() {
      frameCount += 1
      const diffX = pos.x - target.x
      const diffY = pos.y - target.y
      const distance = Math.sqrt(diffX ** 2 + diffY ** 2)

      if (distance < SPEED || distance < 16) {
        idle()
        return
      }

      idleAnim = null
      idleAnimFrame = 0

      if (idleTime > 1) {
        setSprite('alert', 0)
        idleTime = Math.min(idleTime, 7)
        idleTime -= 1
        return
      }

      let dir = ''
      if (diffY / distance > 0.5) dir = 'N'
      if (diffY / distance < -0.5) dir += 'S'
      if (diffX / distance > 0.5) dir += 'W'
      if (diffX / distance < -0.5) dir += 'E'
      setSprite(dir || 'idle', frameCount)

      pos.x -= (diffX / distance) * SPEED
      pos.y -= (diffY / distance) * SPEED

      const w = c.offsetWidth
      const h = c.offsetHeight
      pos.x = Math.min(Math.max(32, pos.x), w - 32)
      pos.y = Math.min(Math.max(32, pos.y), h - 32)

      el.style.left = `${pos.x - 32}px`
      el.style.top = `${pos.y - 32}px`
    }

    el.style.left = `${pos.x - 32}px`
    el.style.top = `${pos.y - 32}px`
    setSprite('idle', 0)
    randomTarget()

    function onRaf(timestamp: number) {
      if (!el.isConnected) return
      if (!lastTimestamp) lastTimestamp = timestamp
      if (timestamp - lastTimestamp > FRAME_MS) {
        lastTimestamp = timestamp
        frame()
      }
      rafId = requestAnimationFrame(onRaf)
    }

    rafId = requestAnimationFrame(onRaf)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-hidden rounded-2xl border"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
    >
      <div
        ref={nekoRef}
        aria-hidden
        style={{
          position: 'absolute',
          width: 64,
          height: 64,
          backgroundImage: "url('/neko.gif')",
          backgroundSize: '512px 256px',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}
