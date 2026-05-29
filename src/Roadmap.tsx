import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, Download, Upload, ChevronDown, ChevronRight, ChevronLeft, Loader2, LayoutList, BarChart2, LogOut, ShieldCheck, Eye } from 'lucide-react'
import { supabase } from './lib/supabase'
import logo from './assets/logo-fastcomm.png'
import { useAuth } from './auth/AuthContext'

// ─── Types ────────────────────────────────────────────────────
type Status   = 'Backlog' | 'Em progresso' | 'Analisa' | 'Concluído' | 'Bloqueado'
type Priority = 'Alta' | 'Média' | 'Baixa'
type ViewMode = 'list' | 'timeline'

interface Task {
  id: string; backlog_id: string; name: string; owner: string
  days: number; status: Status; notes: string; position: number
}

interface BacklogItem {
  id: string; name: string; scope: string; priority: Priority; status: Status
  external_dep: boolean; dep_notes: string; expanded: boolean; position: number
  start_date: string; tasks: Task[]
}

// ─── Colors ───────────────────────────────────────────────────
const STATUS_C: Record<string, { bg: string; text: string; border: string }> = {
  'Backlog':      { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
  'Em progresso': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Analisa':      { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'Concluído':    { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
  'Bloqueado':    { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
}
const PRIORITY_C: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  'Alta':  { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', bar: '#D85A30' },
  'Média': { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', bar: '#EF9F27' },
  'Baixa': { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', bar: '#1D9E75' },
}
const STATUS_BAR: Record<string, string> = {
  'Backlog': '#85B7EB', 'Em progresso': '#378ADD', 'Analisa': '#EF9F27',
  'Concluído': '#1D9E75', 'Bloqueado': '#D85A30',
}

const STATUSES: Status[]     = ['Backlog', 'Em progresso', 'Analisa', 'Concluído', 'Bloqueado']
const PRIORITIES: Priority[] = ['Alta', 'Média', 'Baixa']
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

// ─── Date helpers ─────────────────────────────────────────────
function addWorkDays(date: Date, days: number): Date {
  const d = new Date(date)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) added++
  }
  return d
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDate(s: string): string {
  if (!s) return '—'
  const [y, m, d] = s.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

// ─── InlineEdit com debounce — salva 800ms após parar de digitar ──────────────
function InlineEdit({ value, onChange, placeholder = '—', readonly = false }: { value: string; onChange: (v: string) => void; placeholder?: string; readonly?: boolean }) {
  const [on, setOn]   = useState(false)
  const [v, setV]     = useState(value)
  const timer         = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { if (!on) setV(value) }, [value, on])

  const flush = (val: string) => {
    if (timer.current) clearTimeout(timer.current)
    onChange(val.trim())
  }

  const handleChange = (newVal: string) => {
    setV(newVal)
    // Debounce: salva 800ms após parar de digitar
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(newVal.trim()), 800)
  }

  const ok = () => { flush(v); setOn(false) }

  if (readonly) return (
    <span style={{ display: 'block', color: value ? 'inherit' : '#CBD5E1', fontStyle: value ? 'normal' : 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value || placeholder}
    </span>
  )
  if (on) return (
    <input autoFocus value={v} placeholder={placeholder}
      onChange={e => handleChange(e.target.value)}
      onBlur={ok}
      onKeyDown={e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') { if (timer.current) clearTimeout(timer.current); setOn(false) } }}
      style={{ border: '1.5px solid #85B7EB', borderRadius: 4, padding: '2px 7px', fontSize: 'inherit', fontFamily: 'inherit', width: '100%', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' }} />
  )
  return (
    <span onClick={() => { setV(value); setOn(true) }} title="Clique para editar"
      style={{ cursor: 'text', display: 'block', color: value ? 'inherit' : '#CBD5E1', fontStyle: value ? 'normal' : 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value || placeholder}
    </span>
  )
}

// ─── DepNotesField — textarea com debounce 800ms ──────────────
function DepNotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  const timer             = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLocal(value) }, [value])

  const handle = (v: string) => {
    setLocal(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), 800)
  }

  return (
    <textarea
      value={local}
      onChange={e => handle(e.target.value)}
      onBlur={() => { if (timer.current) clearTimeout(timer.current); onChange(local) }}
      placeholder="Descreva a dependência externa, responsável, prazo ou impacto..."
      rows={2}
      style={{
        width: '100%', boxSizing: 'border-box' as const,
        border: '1px solid #FDE68A', borderRadius: 6, padding: '7px 10px',
        fontSize: 12, fontFamily: 'inherit', color: '#374151',
        background: '#fff', outline: 'none', resize: 'vertical' as const,
        lineHeight: 1.5,
      }}
      onFocus={e => (e.currentTarget.style.borderColor = '#EF9F27')}
    />
  )
}

// ─── DropBadge (portal — sem clip de overflow) ────────────────
function DropBadge<T extends string>({ value, options, colors, onChange, readonly = false }: { value: T; options: T[]; colors: Record<string, { bg: string; text: string; border: string }>; onChange: (v: T) => void; readonly?: boolean }) {
  const [open, setOpen]   = useState(false)
  const [pos, setPos]     = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const c = colors[value] ?? STATUS_C['Backlog']

  const openMenu = () => {
    if (readonly) return
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      const t = e.target as Node
      if (!btnRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <>
      <button ref={btnRef} type="button" onClick={openMenu}
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
        {value} <ChevronDown size={10} />
      </button>

      {open && createPortal(
        <div style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 160, overflow: 'hidden' }}>
          {options.map(opt => {
            const oc = colors[opt] ?? STATUS_C['Backlog']; const sel = opt === value
            return (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: 12, fontWeight: 600, color: oc.text, background: sel ? oc.bg : '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = oc.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = sel ? oc.bg : '#fff')}>
                {opt}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Timeline View ────────────────────────────────────────────
const DAY_LABELS  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const isWeekend   = (d: Date) => d.getDay() === 0 || d.getDay() === 6
const LABEL_W     = 180
const ROW_H       = 46
const WINDOW_DAYS = 21   // 3 weeks

function getMondayOf(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  r.setHours(0, 0, 0, 0)
  return r
}

function TimelineView({ items }: { items: BacklogItem[] }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // Window navigation state — starts from Monday of current week
  const [windowStart, setWindowStart] = useState<Date>(() => getMondayOf(today))

  const shiftWindow = (weeks: number) => {
    setWindowStart(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + weeks * 7)
      return d
    })
  }

  const jumpToToday = () => setWindowStart(getMondayOf(today))

  const enriched = items
    .filter(b => b.start_date)
    .map(b => {
      const totalHours = b.tasks.reduce((s, t) => s + (t.days || 0), 0)
      const workDays   = Math.max(Math.ceil(totalHours / 8), 1)
      const start      = parseDate(b.start_date)
      const end        = addWorkDays(start, workDays)
      return { ...b, start, end, totalHours, workDays }
    })

  if (enriched.length === 0 && items.filter(b => b.start_date).length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
      <BarChart2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#374151' }}>Nenhum backlog com data definida</p>
      <p style={{ margin: 0, fontSize: 13 }}>Defina a data de início na view de lista</p>
    </div>
  )

  // Fixed 3-week window from windowStart
  const start0  = new Date(windowStart)
  const end0    = new Date(windowStart); end0.setDate(end0.getDate() + WINDOW_DAYS - 1)

  const days: Date[] = []
  const d = new Date(start0)
  while (d <= end0) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }

  // clamp a date to the visible window, returns pixel offset
  // Posição como % da janela (0–100)
  const dayPct = (dt: Date) => {
    const diff = (dt.getTime() - start0.getTime()) / 86400000
    return Math.max(0, Math.min(WINDOW_DAYS, diff)) / WINDOW_DAYS * 100
  }
  const inWindow = (b: { start: Date; end: Date }) => b.end > start0 && b.start <= end0

  // Week groups (3 groups of 7)
  type WG = { label: string; isMonthStart: boolean }
  const weekGroups: WG[] = []
  for (let wi = 0; wi < WINDOW_DAYS; wi += 7) {
    const monday = days[wi]
    weekGroups.push({
      label: `${String(monday.getDate()).padStart(2,'0')}/${String(monday.getMonth()+1).padStart(2,'0')}`,
      isMonthStart: monday.getDate() <= 7,
    })
  }

  const groups = (['Alta', 'Média', 'Baixa'] as Priority[]).map(priority => ({
    priority,
    items: enriched.filter(b => b.priority === priority),
  })).filter(g => g.items.length > 0)

  const windowLabel = `${String(start0.getDate()).padStart(2,'0')}/${String(start0.getMonth()+1).padStart(2,'0')}/${start0.getFullYear()} — ${String(end0.getDate()).padStart(2,'0')}/${String(end0.getMonth()+1).padStart(2,'0')}/${end0.getFullYear()}`
  const isTodayVisible = today >= start0 && today <= end0

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(14,30,58,0.06)' }}>

      {/* Navigation bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
        <button type="button" onClick={() => shiftWindow(-3)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
          <ChevronLeft size={15} /> Anterior
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{windowLabel}</span>
          {!isTodayVisible && (
            <button type="button" onClick={jumpToToday}
              style={{ background: '#0E1E3A', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Hoje
            </button>
          )}
        </div>
        <button type="button" onClick={() => shiftWindow(3)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
          Próximo <ChevronRight size={15} />
        </button>
      </div>

      {/* Grid — 100% largura, sem scroll horizontal */}
      <div style={{ width: '100%' }}>

          {/* Row 1 — Week groups */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, borderRight: '2px solid #E5E7EB' }} />
            <div style={{ flex: 1, display: 'flex' }}>
              {weekGroups.map((wg, i) => (
                <div key={i} style={{
                  flex: 1, textAlign: 'center',
                  padding: '6px 0', fontSize: 11, fontWeight: wg.isMonthStart ? 800 : 600,
                  color: wg.isMonthStart ? '#0E1E3A' : '#6B7280',
                  borderLeft: `${wg.isMonthStart ? 2 : 1}px solid ${wg.isMonthStart ? '#B0B8C8' : '#E5E7EB'}`,
                  boxSizing: 'border-box' as const,
                }}>
                  {wg.label}
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 — Day labels */}
          <div style={{ display: 'flex', borderBottom: '2px solid #D1D5DB', background: '#F9FAFB' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, padding: '6px 16px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase', borderRight: '2px solid #E5E7EB', display: 'flex', alignItems: 'center' }}>
              Backlog
            </div>
            <div style={{ flex: 1, display: 'flex' }}>
              {days.map((day, i) => {
                const weekend = isWeekend(day)
                const isToday = day.getTime() === today.getTime()
                return (
                  <div key={i} style={{
                    flex: 1, textAlign: 'center', padding: '4px 0',
                    fontSize: 9, fontWeight: isToday ? 800 : 500,
                    color: isToday ? '#D85A30' : weekend ? '#9CA3AF' : '#374151',
                    background: weekend ? '#F3F4F6' : isToday ? '#FEF2F2' : 'transparent',
                    borderLeft: day.getDay() === 1 ? '1px solid #D1D5DB' : '1px solid #F3F4F6',
                    boxSizing: 'border-box' as const, minWidth: 0,
                  }}>
                    <div>{DAY_LABELS[day.getDay()]}</div>
                    <div style={{ fontSize: 8, color: isToday ? '#D85A30' : weekend ? '#CBD5E1' : '#6B7280' }}>
                      {day.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Swimlanes */}
          {groups.map(group => {
            const pc = PRIORITY_C[group.priority]
            return (
              <div key={group.priority}>
                {/* Priority header */}
                <div style={{ display: 'flex', background: `${pc.bar}10`, borderTop: '1px solid #F3F4F6', borderBottom: `1px solid ${pc.bar}25` }}>
                  <div style={{ width: LABEL_W, flexShrink: 0, padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 6, borderRight: '2px solid #E5E7EB' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: pc.bar, display: 'inline-block' }} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: pc.bar, textTransform: 'uppercase' }}>{group.priority}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex' }}>
                    {days.map((day, i) => (
                      <div key={i} style={{ flex: 1, background: isWeekend(day) ? 'rgba(0,0,0,0.03)' : 'transparent', borderLeft: day.getDay() === 1 ? '1px solid #E5E7EB' : 'none', minWidth: 0 }} />
                    ))}
                  </div>
                </div>

                {/* Backlog rows */}
                {group.items.filter(inWindow).map((b, rowIdx) => {
                  const leftPct  = dayPct(b.start)
                  const rightPct = dayPct(b.end)
                  const widthPct = Math.max(rightPct - leftPct, 100 / WINDOW_DAYS)
                  const barColor = STATUS_BAR[b.status] ?? '#85B7EB'
                  const totalH   = b.tasks.reduce((s, t) => s + (t.days || 0), 0)
                  const doneH    = b.tasks.filter(t => t.status === 'Concluído').reduce((s, t) => s + (t.days || 0), 0)
                  const prog     = totalH > 0 ? Math.round(doneH / totalH * 100) : 0
                  const label    = `${b.name} (${b.totalHours}h)`

                  return (
                    <div key={b.id} style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', background: rowIdx % 2 === 0 ? '#fff' : '#FCFCFC', minHeight: ROW_H }}>

                      {/* Label — nome completo com quebra de linha */}
                      <div style={{ width: LABEL_W, flexShrink: 0, padding: '6px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '2px solid #E5E7EB', gap: 2 }}>
                        <span
                          title={label}
                          style={{ fontSize: 11, fontWeight: 700, color: '#0E1E3A', wordBreak: 'break-word', lineHeight: 1.3 }}
                        >
                          {b.name}
                        </span>
                        <span style={{ fontSize: 9, color: '#EF9F27', fontWeight: 700 }}>
                          {b.totalHours}h
                        </span>
                        <span style={{ fontSize: 9, color: '#9CA3AF' }}>
                          {formatDate(b.start_date)}
                        </span>
                      </div>

                      {/* Bar area — 100% largura, posições em % */}
                      <div style={{ flex: 1, position: 'relative', minHeight: ROW_H, minWidth: 0 }}>
                        {/* Day columns */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                          {days.map((day, i) => (
                            <div key={i} style={{
                              flex: 1, minWidth: 0,
                              background: isWeekend(day) ? '#F3F4F6' : day.getTime() === today.getTime() ? '#FEF9F9' : 'transparent',
                              borderLeft: day.getDay() === 1 ? '1px solid #E5E7EB' : '1px solid #F9FAFB',
                              boxSizing: 'border-box' as const,
                            }} />
                          ))}
                        </div>

                        {/* Today line */}
                        {isTodayVisible && (
                          <div style={{
                            position: 'absolute', left: `${dayPct(today) + (100 / WINDOW_DAYS / 2)}%`,
                            top: 0, bottom: 0, width: 2,
                            background: '#D85A30', opacity: 0.8, zIndex: 2,
                          }} />
                        )}

                        {/* Gantt bar */}
                        <div style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: '50%', transform: 'translateY(-50%)',
                          minHeight: 34, borderRadius: 5,
                          background: barColor, opacity: b.status === 'Bloqueado' ? 0.5 : 1,
                          display: 'flex', flexDirection: 'column', justifyContent: 'center',
                          overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', zIndex: 3,
                          padding: '4px 8px',
                        }}>
                          <div style={{ position: 'absolute', inset: 0, width: `${prog}%`, background: 'rgba(255,255,255,0.22)', borderRadius: '5px 0 0 5px' }} />
                          <span style={{ position: 'relative', fontSize: 10, fontWeight: 700, color: '#fff', wordBreak: 'break-word', lineHeight: 1.3, zIndex: 1 }}>
                            {b.name}
                          </span>
                          <span style={{ position: 'relative', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.85)', zIndex: 1, marginTop: 2 }}>
                            {b.totalHours}h{prog > 0 ? ` · ${prog}%` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Footer legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px', borderTop: '1px solid #F3F4F6', background: '#F9FAFB', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
              <div style={{ width: 14, height: 14, background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 2 }} /> Fim de semana
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280' }}>
              <div style={{ width: 2, height: 14, background: '#D85A30', borderRadius: 1 }} /> Hoje
            </span>
            {Object.entries(STATUS_BAR).map(([s, color]) => (
              <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
                <span style={{ width: 11, height: 11, borderRadius: 2, background: color, display: 'inline-block' }} /> {s}
              </span>
            ))}
          </div>
        </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function Roadmap() {
  const { user, isMaster, logout, audit } = useAuth()
  const [items, setItems]     = useState<BacklogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]       = useState(false)
  const [savedId, setSavedId]     = useState<string | null>(null) // ID do backlog recém-salvo
  const [view, setView]       = useState<ViewMode>('list')

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false) // desiste após 8s
    }, 8000)

    async function load() {
      try {
        setLoading(true)
        const [{ data: blData, error: blErr }, { data: tkData, error: tkErr }] = await Promise.all([
          supabase.from('backlogs').select('*').order('position'),
          supabase.from('tasks').select('*').order('position'),
        ])
        if (cancelled) return
        if (blErr || tkErr) { console.error('Load error', blErr ?? tkErr); setLoading(false); return }
        const backlogs = (blData ?? []) as Omit<BacklogItem, 'tasks'>[]
        const tasks    = (tkData ?? []) as Task[]
        setItems(backlogs.map(b => ({ ...b, tasks: tasks.filter(t => t.backlog_id === b.id) })))
      } catch (e) {
        console.error('Load failed', e)
      } finally {
        clearTimeout(timeout)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [])

  const totalBacklogs = items.length
  const totalTasks    = items.reduce((s, b) => s + b.tasks.length, 0)
  const totalDays     = items.reduce((s, b) => s + b.tasks.reduce((ts, t) => ts + (t.days || 0), 0), 0)
  const totalHours    = totalDays
  const blocked       = items.reduce((s, b) => s + b.tasks.filter(t => t.status === 'Bloqueado').length, 0)

  // Salva explicitamente backlog + todas as tasks no Supabase
  const saveBacklog = async (bid: string) => {
    if (!isMaster) return
    const b = items.find(x => x.id === bid)
    if (!b) return
    setSaving(true)
    await Promise.all([
      supabase.from('backlogs').upsert({
        id: b.id, name: b.name, scope: b.scope, priority: b.priority,
        status: b.status, external_dep: b.external_dep, dep_notes: b.dep_notes,
        expanded: b.expanded, position: b.position, start_date: b.start_date,
      }),
      ...b.tasks.map(t => supabase.from('tasks').upsert({
        id: t.id, backlog_id: t.backlog_id, name: t.name, owner: t.owner,
        days: t.days, status: t.status, notes: t.notes, position: t.position,
      })),
    ])
    await audit('SAVE', 'backlogs', bid, { name: b.name, tasks: b.tasks.length })
    setSaving(false)
    setSavedId(bid)
    setTimeout(() => setSavedId(null), 2500)
  }

  const addBacklog = async () => {
    if (!isMaster) return
    const today = toISO(new Date())
    const nb: BacklogItem = { id: uid(), name: 'Novo backlog', scope: '', priority: 'Média', status: 'Backlog', external_dep: false, dep_notes: '', expanded: true, position: items.length, start_date: today, tasks: [] }
    setItems(p => [...p, nb])
    await supabase.from('backlogs').insert({ id: nb.id, name: nb.name, scope: nb.scope, priority: nb.priority, status: nb.status, external_dep: nb.external_dep, dep_notes: nb.dep_notes, expanded: nb.expanded, position: nb.position, start_date: nb.start_date })
    await audit('INSERT', 'backlogs', nb.id, { name: nb.name })
  }

  const delBacklog = async (id: string) => {
    if (!isMaster) return
    const b = items.find(x => x.id === id)
    setItems(p => p.filter(b => b.id !== id))
    await supabase.from('backlogs').delete().eq('id', id)
    await audit('DELETE', 'backlogs', id, { name: b?.name })
  }

  const patchB = async (id: string, patch: Partial<BacklogItem>) => {
    if (!isMaster) return
    // Salva o estado anterior para rollback em caso de erro
    const prev = items.find(b => b.id === id)
    setItems(p => p.map(b => b.id === id ? { ...b, ...patch } : b))
    setSaving(true)
    const { error } = await supabase.from('backlogs').update(patch).eq('id', id)
    if (error) {
      // Rollback visual se Supabase falhou
      if (prev) setItems(p => p.map(b => b.id === id ? prev : b))
      console.error('[patchB] Erro ao salvar backlog:', error.message)
      alert(`Erro ao salvar: ${error.message}\nVerifique sua conexão ou faça login novamente.`)
    } else {
      await audit('UPDATE', 'backlogs', id, patch)
    }
    setSaving(false)
  }

  const addTask = async (bid: string) => {
    if (!isMaster) return
    const nt: Task = { id: uid(), backlog_id: bid, name: 'Nova task', owner: '', days: 1, status: 'Backlog', notes: '', position: items.find(b => b.id === bid)?.tasks.length ?? 0 }
    setItems(p => p.map(b => b.id !== bid ? b : { ...b, tasks: [...b.tasks, nt] }))
    await supabase.from('tasks').insert(nt)
    await audit('INSERT', 'tasks', nt.id, { name: nt.name, backlog_id: bid })
  }

  const delTask = async (bid: string, tid: string) => {
    if (!isMaster) return
    const t = items.find(b => b.id === bid)?.tasks.find(t => t.id === tid)
    setItems(p => p.map(b => b.id !== bid ? b : { ...b, tasks: b.tasks.filter(t => t.id !== tid) }))
    await supabase.from('tasks').delete().eq('id', tid)
    await audit('DELETE', 'tasks', tid, { name: t?.name })
  }

  const patchT = async (bid: string, tid: string, patch: Partial<Task>) => {
    if (!isMaster) return
    const prevTask = items.find(b => b.id === bid)?.tasks.find(t => t.id === tid)
    setItems(p => p.map(b => b.id !== bid ? b : { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, ...patch } : t) }))
    setSaving(true)
    const { error } = await supabase.from('tasks').update(patch).eq('id', tid)
    if (error) {
      // Rollback visual
      if (prevTask) setItems(p => p.map(b => b.id !== bid ? b : { ...b, tasks: b.tasks.map(t => t.id === tid ? prevTask : t) }))
      console.error('[patchT] Erro ao salvar task:', error.message)
      alert(`Erro ao salvar: ${error.message}\nVerifique sua conexão ou faça login novamente.`)
    } else {
      await audit('UPDATE', 'tasks', tid, patch)
    }
    setSaving(false)
  }

  const exportJSON = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }))
    a.download = 'roadmap-fastcomm.json'; a.click()
  }

  const importJSON = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'
    inp.onchange = async e => {
      const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return
      const r = new FileReader()
      r.onload = async ev => {
        try {
          const data: BacklogItem[] = JSON.parse(ev.target!.result as string)
          for (const b of data) {
            await supabase.from('backlogs').upsert({ id: b.id, name: b.name, scope: b.scope, priority: b.priority, status: b.status, external_dep: b.external_dep, expanded: b.expanded, position: b.position, start_date: b.start_date })
            for (const t of b.tasks) await supabase.from('tasks').upsert(t)
          }
          setItems(data)
        } catch { alert('Arquivo inválido') }
      }
      r.readAsText(f)
    }
    inp.click()
  }

  return (
    <div className="rm-root" style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <header className="rm-header" style={{ background: '#0E1E3A', padding: '22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <img src={logo} alt="Fastcomm" style={{ height: 36, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: '#85B7EB', textTransform: 'uppercase' }}>PRODUTO</p>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>RoadMap — Segundo Semestre</h1>
              <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving
                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                  : 'Alterações salvas automaticamente'}
              </p>
            </div>
          </div>

          {/* User info + logout — só aparece quando logado */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                background: isMaster ? 'rgba(55,138,221,0.2)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${isMaster ? '#378ADD' : 'rgba(255,255,255,0.15)'}`,
                borderRadius: 20, fontSize: 11, fontWeight: 700,
                color: isMaster ? '#85B7EB' : 'rgba(255,255,255,0.5)',
              }}>
                {isMaster ? <ShieldCheck size={12} /> : <Eye size={12} />}
                {isMaster ? 'Master' : 'Viewer'}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <button type="button" onClick={logout} title="Sair"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(216,90,48,0.2)'; e.currentTarget.style.color = '#EF9F27' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
                <LogOut size={12} /> Sair
              </button>
            </div>
          )}
          <div className="rm-counters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Backlogs',  val: totalBacklogs, color: '#85B7EB' },
              { label: 'Tasks',     val: totalTasks,    color: '#1D9E75' },
              { label: 'Total (h)', val: totalHours,    color: '#EF9F27' },
              { label: 'Bloqueado', val: blocked,       color: '#D85A30' },
            ].map(s => (
              <div key={s.label} className="rm-counter" style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${s.color}44`, borderRadius: 8, padding: '8px 18px', textAlign: 'center', minWidth: 76 }}>
                <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: s.color, textTransform: 'uppercase' }}>{s.label}</p>
                <p className="val" style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="rm-toolbar" style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {isMaster && (
          <button type="button" onClick={addBacklog} disabled={loading}
            style={{ background: '#0E1E3A', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
            <Plus size={14} /> Novo backlog
          </button>
        )}
        <button type="button" onClick={exportJSON}
          style={{ background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 7, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <Download size={13} /> Exportar
        </button>
        {isMaster && (
          <button type="button" onClick={importJSON}
            style={{ background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 7, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            <Upload size={13} /> Importar
          </button>
        )}
        {!isMaster && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9CA3AF', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 10px' }}>
            <Eye size={11} /> Modo leitura — sem permissão para editar
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 7, padding: 3, gap: 2 }}>
          {([['list', <LayoutList size={14} />, 'Lista'], ['timeline', <BarChart2 size={14} />, 'Timeline']] as const).map(([v, icon, label]) => (
            <button key={v} type="button" onClick={() => setView(v as ViewMode)}
              style={{
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? '#0E1E3A' : '#6B7280',
                border: 'none', borderRadius: 5, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s',
              }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="rm-main" style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Carregando dados...</p>
          </div>
        )}

        {/* Timeline view */}
        {!loading && view === 'timeline' && <TimelineView items={items} />}

        {/* List view */}
        {!loading && view === 'list' && (
          <>
            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#374151' }}>Nenhum backlog ainda</p>
                <p style={{ margin: 0, fontSize: 13 }}>Clique em "Novo backlog" para começar</p>
              </div>
            )}

            {items.map(b => {
              const bHours   = b.tasks.reduce((s, t) => s + (t.days || 0), 0)
              const bDays    = Math.ceil(bHours / 8) || 0
              const doneH    = b.tasks.filter(t => t.status === 'Concluído').reduce((s, t) => s + (t.days || 0), 0)
              const progress = bHours > 0 ? Math.round(doneH / bHours * 100) : 0
              const endDate  = b.start_date && bDays > 0 ? toISO(addWorkDays(parseDate(b.start_date), bDays)) : null

              return (
                <div key={b.id} style={{
                  background: b.external_dep ? '#FFFBEB' : '#fff',
                  borderRadius: 10,
                  border: b.external_dep ? '1.5px solid #FDE68A' : '1px solid #E5E7EB',
                  boxShadow: b.external_dep ? '0 1px 6px rgba(239,159,39,0.15)' : '0 1px 3px rgba(14,30,58,0.06)',
                  transition: 'border-color 0.2s, background 0.2s',
                }}>

                  {/* Backlog header */}
                  <div style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => patchB(b.id, { expanded: !b.expanded })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 2, display: 'flex', flexShrink: 0 }}>
                        {b.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <div style={{ flex: '2 1 160px', minWidth: 120 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Backlog</p>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0E1E3A' }}>
                          <InlineEdit value={b.name} onChange={v => patchB(b.id, { name: v })} placeholder="Nome do backlog" readonly={!isMaster} />
                        </div>
                      </div>

                      <div style={{ flex: '2 1 130px', minWidth: 100 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Análise / Escopo</p>
                        <div style={{ fontSize: 13, color: '#374151' }}>
                          <InlineEdit value={b.scope} onChange={v => patchB(b.id, { scope: v })} placeholder="—" readonly={!isMaster} />
                        </div>
                      </div>

                      {/* Date range */}
                      <div style={{ flexShrink: 0 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Início</p>
                        <input type="date" value={b.start_date || ''} disabled={!isMaster}
                          onChange={e => isMaster && patchB(b.id, { start_date: e.target.value })}
                          style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', color: '#374151', outline: 'none', cursor: isMaster ? 'pointer' : 'default', background: isMaster ? '#fff' : '#F9FAFB' }}
                          onFocus={e => { if (isMaster) e.currentTarget.style.borderColor = '#85B7EB' }}
                          onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
                      </div>

                      {endDate && (
                        <div style={{ flexShrink: 0 }}>
                          <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Entrega estimada</p>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#1D9E75', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 6, padding: '4px 10px' }}>
                            📅 {formatDate(endDate)}
                          </span>
                        </div>
                      )}

                      <div style={{ flexShrink: 0 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Prioridade</p>
                        <DropBadge value={b.priority} options={PRIORITIES} colors={PRIORITY_C} onChange={v => isMaster && patchB(b.id, { priority: v })} readonly={!isMaster} />
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Status</p>
                        <DropBadge value={b.status} options={STATUSES} colors={STATUS_C} onChange={v => isMaster && patchB(b.id, { status: v })} readonly={!isMaster} />
                      </div>

                      {isMaster && (
                        <button type="button" onClick={() => delBacklog(b.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, display: 'flex', flexShrink: 0, marginLeft: 'auto' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingLeft: 34, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>
                        {b.tasks.length} {b.tasks.length === 1 ? 'task' : 'tasks'} · {bHours}h · {progress}% concluído
                      </span>
                      <div style={{ flex: 1, minWidth: 80, maxWidth: 200, height: 4, background: '#F3F4F6', borderRadius: 99 }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#1D9E75', borderRadius: 99, transition: 'width .3s' }} />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: b.external_dep ? '#92400E' : '#6B7280', cursor: isMaster ? 'pointer' : 'default', userSelect: 'none' as const, fontWeight: b.external_dep ? 700 : 400 }}>
                        <input type="checkbox" checked={b.external_dep} disabled={!isMaster}
                          onChange={e => isMaster && patchB(b.id, { external_dep: e.target.checked })}
                          style={{ accentColor: '#EF9F27', width: 13, height: 13 }} />
                        ⚠️ Dependência externa
                      </label>
                    </div>

                    {/* Dependency notes — shown when external_dep is checked */}
                    {b.external_dep && (
                      <div style={{ margin: '8px 34px 4px', padding: '10px 14px', background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 8 }}>
                        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: '#92400E', textTransform: 'uppercase' as const }}>
                          Observação sobre a dependência
                        </p>
                        {isMaster ? (
                          <DepNotesField
                            value={b.dep_notes}
                            onChange={v => patchB(b.id, { dep_notes: v })}
                          />
                        ) : (
                          <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                            {b.dep_notes || <em style={{ color: '#9CA3AF' }}>Sem observação registrada.</em>}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {b.expanded && (
                    <div style={{ borderTop: '1px solid #F3F4F6' }}>
                      {b.tasks.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                            <thead>
                              <tr style={{ background: '#F9FAFB' }}>
                                {['#', 'Task', 'Responsável', 'Horas', 'Status', 'Observações', ''].map((h, i) => (
                                  <th key={i} style={{ padding: '8px 12px', textAlign: 'left' as const, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const, borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {b.tasks.map((t, idx) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #F9FAFB' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF', width: 32 }}>{idx + 1}</td>
                                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#85B7EB', minWidth: 150 }}>
                                    <InlineEdit value={t.name} onChange={v => patchT(b.id, t.id, { name: v })} placeholder="Nome da task" readonly={!isMaster} />
                                  </td>
                                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#374151', minWidth: 110 }}>
                                    <InlineEdit value={t.owner} onChange={v => patchT(b.id, t.id, { owner: v })} placeholder="—" readonly={!isMaster} />
                                  </td>
                                  <td style={{ padding: '10px 12px', width: 90 }}>
                                    <input type="number" min={0} step={0.5} value={t.days}
                                      disabled={!isMaster}
                                      onChange={e => isMaster && patchT(b.id, t.id, { days: Math.max(0, Number(e.target.value)) })}
                                      style={{ width: 60, padding: '4px 6px', border: '1px solid #E5E7EB', borderRadius: 5, fontSize: 13, textAlign: 'center' as const, outline: 'none', fontFamily: 'inherit', color: '#374151', background: isMaster ? '#fff' : '#F9FAFB', cursor: isMaster ? 'text' : 'default' }}
                                      onFocus={e => { if (isMaster) e.currentTarget.style.borderColor = '#85B7EB' }}
                                      onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
                                  </td>
                                  <td style={{ padding: '10px 12px', width: 155 }}>
                                    <DropBadge value={t.status} options={STATUSES} colors={STATUS_C} onChange={v => isMaster && patchT(b.id, t.id, { status: v })} readonly={!isMaster} />
                                  </td>
                                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', minWidth: 140 }}>
                                    <InlineEdit value={t.notes} onChange={v => patchT(b.id, t.id, { notes: v })} placeholder="—" readonly={!isMaster} />
                                  </td>
                                  <td style={{ padding: '10px 12px', width: 36 }}>
                                    {isMaster && (
                                      <button type="button" onClick={() => delTask(b.id, t.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2, display: 'flex' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}>
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '9px 52px 9px 12px', background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#6B7280', textTransform: 'uppercase' }}>Total do backlog</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0E1E3A', minWidth: 48, textAlign: 'right' as const }}>{bHours}h</span>
                          </div>
                        </div>
                      )}
                      <div style={{ padding: '10px 20px', borderTop: b.tasks.length > 0 ? '1px solid #F3F4F6' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        {isMaster && (
                          <button type="button" onClick={() => addTask(b.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontFamily: 'inherit' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#0E1E3A')}
                            onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
                            <Plus size={14} /> Adicionar task
                          </button>
                        )}

                        {isMaster && (
                          <button
                            type="button"
                            onClick={() => saveBacklog(b.id)}
                            disabled={saving}
                            style={{
                              background: savedId === b.id ? '#1D9E75' : '#0E1E3A',
                              color: '#fff', border: 'none', borderRadius: 7,
                              padding: '6px 16px', fontSize: 12, fontWeight: 700,
                              cursor: saving ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                              fontFamily: 'inherit', transition: 'background 0.3s',
                              opacity: saving ? 0.7 : 1,
                            }}
                          >
                            {savedId === b.id ? '✓ Salvo!' : saving ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : '💾 Salvar'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .rm-header { padding: 14px 16px !important; }
          .rm-header h1 { font-size: 18px !important; }
          .rm-header img { height: 28px !important; }
          .rm-counters { gap: 6px !important; }
          .rm-counter { min-width: 58px !important; padding: 6px 10px !important; }
          .rm-counter .val { font-size: 16px !important; }
          .rm-toolbar { padding: 8px 12px !important; flex-wrap: wrap; gap: 6px !important; }
          .rm-main { padding: 12px 12px !important; }
          .rm-backlog-header { flex-wrap: wrap; gap: 8px !important; }
        }

        /* ── 4K (≥2560px) ── */
        @media (min-width: 2560px) {
          .rm-root { font-size: 18px; }
          .rm-header h1 { font-size: 34px !important; }
          .rm-header img { height: 52px !important; }
          .rm-counter .val { font-size: 30px !important; }
          .rm-main { max-width: 2400px !important; }
          .rm-toolbar { padding: 14px 48px !important; }
        }

        /* ── 8K (≥7680px) ── */
        @media (min-width: 7680px) {
          .rm-root { font-size: 28px; }
          .rm-header { padding: 40px 80px !important; }
          .rm-header h1 { font-size: 52px !important; }
          .rm-header img { height: 80px !important; }
          .rm-counter .val { font-size: 48px !important; }
          .rm-main { max-width: 6000px !important; }
        }

        /* Timeline horizontal scroll on all screens */
        .rm-timeline-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
    </div>
  )
}
