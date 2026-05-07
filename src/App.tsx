import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, Minimize2, Grid, ChevronLeft, ChevronRight } from 'lucide-react'
import { slides } from './slides'

const SLIDE_W = 1330
const SLIDE_H = 750

function ScaledSlide({ Slide }: { Slide: () => JSX.Element }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = outerRef.current
    if (!el) return
    const measure = () => setScale(el.offsetWidth / SLIDE_W)
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={outerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {scale !== null && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SLIDE_W,
          height: SLIDE_H,
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
        }}>
          <Slide />
        </div>
      )}
    </div>
  )
}

type Mode = 'scroll' | 'present'

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? '-60%' : '60%',
    opacity: 0,
  }),
}

export default function App() {
  const [mode, setMode] = useState<Mode>('scroll')
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [showOverview, setShowOverview] = useState(false)
  const total = slides.length

  const go = useCallback(
    (delta: number) => {
      setDirection(delta)
      setCurrent(c => Math.max(0, Math.min(total - 1, c + delta)))
    },
    [total]
  )

  const jumpTo = useCallback(
    (i: number) => {
      setDirection(i > current ? 1 : -1)
      setCurrent(i)
    },
    [current]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        setMode(m => (m === 'present' ? 'scroll' : 'present'))
        return
      }
      if (mode !== 'present') return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        go(-1)
      } else if (e.key === 'Escape') {
        if (showOverview) setShowOverview(false)
        else setMode('scroll')
      } else if (e.key === 'g' || e.key === 'G') {
        setShowOverview(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, go, showOverview])

  if (mode === 'present') {
    const CurrentSlide = slides[current].component
    return (
      <div className="fixed inset-0 bg-[#141418] flex flex-col select-none">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-white/5 shrink-0">
          <span className="text-white/50 text-xs font-medium truncate max-w-xs">
            {slides[current].title}
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowOverview(o => !o)}
              className="text-white/40 hover:text-white/80 transition-colors"
              title="Visão geral (G)"
            >
              <Grid size={15} />
            </button>
            <span className="text-white/30 text-xs tabular-nums">
              {current + 1} / {total}
            </span>
            <button
              onClick={() => setMode('scroll')}
              className="text-white/40 hover:text-white/80 transition-colors"
              title="Sair da apresentação (Esc)"
            >
              <Minimize2 size={15} />
            </button>
          </div>
        </div>

        {/* Slide area */}
        <div className="flex-1 flex items-center justify-center overflow-hidden px-14 py-3">
          <div
            className="w-full relative"
            style={{ maxHeight: 'calc(100vh - 100px)', aspectRatio: '1330/750' }}
          >
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.9 }}
                className="absolute inset-0 rounded-lg overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.6)]"
              >
                <ScaledSlide Slide={CurrentSlide} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-center gap-2 py-3 shrink-0">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              className={`rounded-full transition-all duration-200 ${
                i === current
                  ? 'w-5 h-[6px] bg-[#85B7EB]'
                  : 'w-[6px] h-[6px] bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Arrow buttons */}
        <button
          onClick={() => go(-1)}
          disabled={current === 0}
          className="fixed left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white disabled:opacity-0 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => go(1)}
          disabled={current === total - 1}
          className="fixed right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white disabled:opacity-0 transition-all"
        >
          <ChevronRight size={20} />
        </button>

        {/* Keyboard hints */}
        <div className="fixed bottom-2 right-4 text-white/20 text-[10px] hidden md:flex gap-3">
          <span>← → navegar</span>
          <span>G visão geral</span>
          <span>Esc sair</span>
        </div>

        {/* Overview grid */}
        <AnimatePresence>
          {showOverview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/92 z-50 overflow-y-auto p-8"
              onClick={() => setShowOverview(false)}
            >
              <p className="text-white/40 text-xs text-center mb-6 font-medium tracking-widest uppercase">
                Visão geral · clique para navegar
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
                {slides.map((s, i) => {
                  const S = s.component
                  return (
                    <button
                      key={i}
                      onClick={e => {
                        e.stopPropagation()
                        jumpTo(i)
                        setShowOverview(false)
                      }}
                      className={`relative overflow-hidden rounded-md border-2 transition-all hover:scale-[1.02] ${
                        i === current
                          ? 'border-[#85B7EB] shadow-[0_0_16px_rgba(133,183,235,0.3)]'
                          : 'border-transparent hover:border-white/20'
                      }`}
                      style={{ aspectRatio: '1330/750' }}
                    >
                      {/* Miniature slide — scaled via ScaledSlide */}
                      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                        <ScaledSlide Slide={S} />
                      </div>
                      <div className="absolute bottom-1 left-1.5 text-white text-[9px] bg-black/60 px-1.5 py-0.5 rounded font-mono">
                        {i + 1}
                      </div>
                      {i === current && (
                        <div className="absolute inset-0 ring-2 ring-[#85B7EB] ring-inset rounded-md" />
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Scroll mode ──
  return (
    <div className="min-h-screen bg-[#2A2A2E]">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 py-2.5 bg-[#141418]/80 backdrop-blur-md border-b border-white/5">
        <span className="text-white/70 text-sm font-semibold tracking-tight">FastComm 2.0</span>
        <button
          onClick={() => setMode('present')}
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white/90 transition-colors group"
        >
          <Maximize2 size={13} />
          <span>Apresentar</span>
          <kbd className="hidden md:inline text-[10px] border border-white/20 px-1.5 py-0.5 rounded font-mono text-white/30 group-hover:border-white/40 transition-colors">
            P
          </kbd>
        </button>
      </div>

      {/* Slides column */}
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        {slides.map(({ component: Slide, title }, i) => (
          <motion.div
            key={i}
            className="w-full overflow-hidden rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.45)] cursor-pointer hover:shadow-[0_16px_48px_rgba(0,0,0,0.55)] transition-shadow duration-300"
            style={{ maxWidth: 1330, aspectRatio: '1330/750' }}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => {
              jumpTo(i)
              setMode('present')
            }}
            title={`Slide ${i + 1}: ${title} — clique para apresentar`}
          >
            <ScaledSlide Slide={Slide} />
          </motion.div>
        ))}
      </div>

      <div className="text-center text-white/25 text-xs pb-10 space-y-1">
        <p>
          Pressione{' '}
          <kbd className="border border-white/20 px-1.5 py-0.5 rounded font-mono text-white/35">P</kbd>{' '}
          para apresentar · clique em qualquer slide para iniciar a partir dele
        </p>
      </div>
    </div>
  )
}
