import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, Download, Upload, ChevronDown, ChevronRight, Loader2, LayoutList, BarChart2 } from 'lucide-react'
import { supabase } from './lib/supabase'

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
  external_dep: boolean; expanded: boolean; position: number
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

// ─── InlineEdit ───────────────────────────────────────────────
function InlineEdit({ value, onChange, placeholder = '—' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [on, setOn] = useState(false)
  const [v, setV]   = useState(value)
  useEffect(() => { if (!on) setV(value) }, [value, on])
  const ok = () => { onChange(v.trim()); setOn(false) }
  if (on) return (
    <input autoFocus value={v} placeholder={placeholder}
      onChange={e => setV(e.target.value)} onBlur={ok}
      onKeyDown={e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') setOn(false) }}
      style={{ border: '1.5px solid #85B7EB', borderRadius: 4, padding: '2px 7px', fontSize: 'inherit', fontFamily: 'inherit', width: '100%', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' }} />
  )
  return (
    <span onClick={() => { setV(value); setOn(true) }} title="Clique para editar"
      style={{ cursor: 'text', display: 'block', color: value ? 'inherit' : '#CBD5E1', fontStyle: value ? 'normal' : 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value || placeholder}
    </span>
  )
}

// ─── DropBadge (portal — sem clip de overflow) ────────────────
function DropBadge<T extends string>({ value, options, colors, onChange }: { value: T; options: T[]; colors: Record<string, { bg: string; text: string; border: string }>; onChange: (v: T) => void }) {
  const [open, setOpen]   = useState(false)
  const [pos, setPos]     = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const c = colors[value] ?? STATUS_C['Backlog']

  const openMenu = () => {
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
function TimelineView({ items }: { items: BacklogItem[] }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // Compute start/end for each backlog
  const enriched = items
    .filter(b => b.start_date)
    .map(b => {
      const totalDays = b.tasks.reduce((s, t) => s + (t.days || 0), 0)
      const start     = parseDate(b.start_date)
      const end       = totalDays > 0 ? addWorkDays(start, totalDays) : new Date(start.getTime() + 86400000)
      return { ...b, start, end, totalDays }
    })

  if (enriched.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
      <BarChart2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#374151' }}>Nenhum backlog com data definida</p>
      <p style={{ margin: 0, fontSize: 13 }}>Defina a data de início de cada backlog na view de lista</p>
    </div>
  )

  // Time range
  const minDate = new Date(Math.min(...enriched.map(b => b.start.getTime())))
  const maxDate = new Date(Math.max(...enriched.map(b => b.end.getTime())))
  minDate.setDate(minDate.getDate() - 3)
  maxDate.setDate(maxDate.getDate() + 7)

  // Generate week headers
  const weeks: { label: string; date: Date }[] = []
  const cur = new Date(minDate)
  cur.setDate(cur.getDate() - cur.getDay() + 1) // monday
  while (cur <= maxDate) {
    weeks.push({
      label: `${String(cur.getDate()).padStart(2,'0')}/${String(cur.getMonth()+1).padStart(2,'0')}`,
      date: new Date(cur),
    })
    cur.setDate(cur.getDate() + 7)
  }

  const totalMs   = maxDate.getTime() - minDate.getTime()
  const pct       = (d: Date) => Math.max(0, Math.min(100, (d.getTime() - minDate.getTime()) / totalMs * 100))
  const todayPct  = pct(today)
  const showToday = todayPct >= 0 && todayPct <= 100

  // Group by priority
  const groups = (['Alta', 'Média', 'Baixa'] as Priority[]).map(priority => ({
    priority,
    items: enriched.filter(b => b.priority === priority),
  })).filter(g => g.items.length > 0)

  const ROW_H   = 44
  const LABEL_W = 180

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(14,30,58,0.06)' }}>

      {/* Timeline grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: LABEL_W + weeks.length * 80 }}>

          {/* Week header */}
          <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, padding: '10px 16px', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase', borderRight: '1px solid #E5E7EB' }}>
              Backlog
            </div>
            <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
              {weeks.map((w, i) => (
                <div key={i} style={{ flex: 1, padding: '10px 6px', fontSize: 10, fontWeight: 600, color: '#6B7280', textAlign: 'center', borderRight: '1px solid #F3F4F6' }}>
                  {w.label}
                </div>
              ))}
            </div>
          </div>

          {/* Swimlanes by priority */}
          {groups.map(group => {
            const pc = PRIORITY_C[group.priority]
            return (
              <div key={group.priority}>
                {/* Priority label */}
                <div style={{ display: 'flex', background: `${pc.bar}12`, borderBottom: `1px solid ${pc.bar}30`, borderTop: '1px solid #F3F4F6' }}>
                  <div style={{ width: LABEL_W, flexShrink: 0, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6, borderRight: '1px solid #E5E7EB' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: pc.bar, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: pc.bar, textTransform: 'uppercase' }}>{group.priority}</span>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    {showToday && (
                      <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 1, background: '#D85A30', opacity: 0.4, zIndex: 1 }} />
                    )}
                  </div>
                </div>

                {/* Backlog rows */}
                {group.items.map((b, rowIdx) => {
                  const left  = pct(b.start)
                  const right = pct(b.end)
                  const width = Math.max(right - left, 1.5)
                  const barColor = STATUS_BAR[b.status] ?? '#85B7EB'
                  const done = b.tasks.filter(t => t.status === 'Concluído').length
                  const prog = b.tasks.length ? Math.round(done / b.tasks.length * 100) : 0

                  return (
                    <div key={b.id} style={{ display: 'flex', borderBottom: '1px solid #F9FAFB', background: rowIdx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      {/* Label */}
                      <div style={{ width: LABEL_W, flexShrink: 0, padding: '0 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: ROW_H, borderRight: '1px solid #E5E7EB', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0E1E3A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                        <span style={{ fontSize: 10, color: '#6B7280' }}>{b.totalDays}d · {formatDate(b.start_date)}</span>
                      </div>

                      {/* Bar area */}
                      <div style={{ flex: 1, position: 'relative', height: ROW_H }}>
                        {/* Week grid lines */}
                        {weeks.map((_, i) => (
                          <div key={i} style={{ position: 'absolute', left: `${i / weeks.length * 100}%`, top: 0, bottom: 0, width: 1, background: '#F3F4F6' }} />
                        ))}

                        {/* Today line */}
                        {showToday && (
                          <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 2, background: '#D85A30', zIndex: 2, opacity: 0.7 }} />
                        )}

                        {/* Gantt bar */}
                        <div style={{
                          position: 'absolute', left: `${left}%`, width: `${width}%`,
                          top: '50%', transform: 'translateY(-50%)',
                          height: 26, borderRadius: 5,
                          background: barColor, opacity: b.status === 'Bloqueado' ? 0.5 : 1,
                          display: 'flex', alignItems: 'center', overflow: 'hidden',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          zIndex: 3,
                        }}>
                          {/* Progress fill */}
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog}%`, background: 'rgba(255,255,255,0.25)', borderRadius: '5px 0 0 5px' }} />
                          <span style={{ position: 'relative', padding: '0 8px', fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 1 }}>
                            {b.name} {prog > 0 ? `· ${prog}%` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Today legend */}
          {showToday && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB' }}>
              <div style={{ width: 16, height: 2, background: '#D85A30', borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: '#6B7280' }}>Hoje — {formatDate(toISO(today))}</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ padding: '12px 20px', borderTop: '2px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 }}>Status:</span>
        {Object.entries(STATUS_BAR).map(([s, color]) => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} /> {s}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>
          A largura da barra representa a duração estimada · A cor representa o status atual
        </span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function Roadmap() {
  const [items, setItems]     = useState<BacklogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [view, setView]       = useState<ViewMode>('list')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: blData }, { data: tkData }] = await Promise.all([
        supabase.from('backlogs').select('*').order('position'),
        supabase.from('tasks').select('*').order('position'),
      ])
      const backlogs = (blData ?? []) as Omit<BacklogItem, 'tasks'>[]
      const tasks    = (tkData ?? []) as Task[]
      setItems(backlogs.map(b => ({ ...b, tasks: tasks.filter(t => t.backlog_id === b.id) })))
      setLoading(false)
    }
    load()
  }, [])

  const totalBacklogs = items.length
  const totalTasks    = items.reduce((s, b) => s + b.tasks.length, 0)
  const totalDays     = items.reduce((s, b) => s + b.tasks.reduce((ts, t) => ts + (t.days || 0), 0), 0)
  const blocked       = items.reduce((s, b) => s + b.tasks.filter(t => t.status === 'Bloqueado').length, 0)

  const addBacklog = async () => {
    const today = toISO(new Date())
    const nb: BacklogItem = { id: uid(), name: 'Novo backlog', scope: '', priority: 'Média', status: 'Backlog', external_dep: false, expanded: true, position: items.length, start_date: today, tasks: [] }
    setItems(p => [...p, nb])
    await supabase.from('backlogs').insert({ id: nb.id, name: nb.name, scope: nb.scope, priority: nb.priority, status: nb.status, external_dep: nb.external_dep, expanded: nb.expanded, position: nb.position, start_date: nb.start_date })
  }

  const delBacklog = async (id: string) => {
    setItems(p => p.filter(b => b.id !== id))
    await supabase.from('backlogs').delete().eq('id', id)
  }

  const patchB = async (id: string, patch: Partial<BacklogItem>) => {
    setItems(p => p.map(b => b.id === id ? { ...b, ...patch } : b))
    setSaving(true)
    await supabase.from('backlogs').update(patch).eq('id', id)
    setSaving(false)
  }

  const addTask = async (bid: string) => {
    const nt: Task = { id: uid(), backlog_id: bid, name: 'Nova task', owner: '', days: 1, status: 'Backlog', notes: '', position: items.find(b => b.id === bid)?.tasks.length ?? 0 }
    setItems(p => p.map(b => b.id !== bid ? b : { ...b, tasks: [...b.tasks, nt] }))
    await supabase.from('tasks').insert(nt)
  }

  const delTask = async (bid: string, tid: string) => {
    setItems(p => p.map(b => b.id !== bid ? b : { ...b, tasks: b.tasks.filter(t => t.id !== tid) }))
    await supabase.from('tasks').delete().eq('id', tid)
  }

  const patchT = async (bid: string, tid: string, patch: Partial<Task>) => {
    setItems(p => p.map(b => b.id !== bid ? b : { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, ...patch } : t) }))
    setSaving(true)
    await supabase.from('tasks').update(patch).eq('id', tid)
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
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#0E1E3A', padding: '22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: '#85B7EB', textTransform: 'uppercase' }}>PRODUTO</p>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>RoadMap Fastcomm — Segundo Semestre</h1>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving
                ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                : 'Dados salvos em nuvem · Supabase'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Backlogs',  val: totalBacklogs, color: '#85B7EB' },
              { label: 'Tasks',     val: totalTasks,    color: '#1D9E75' },
              { label: 'Total (d)', val: totalDays,     color: '#EF9F27' },
              { label: 'Bloqueado', val: blocked,       color: '#D85A30' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${s.color}44`, borderRadius: 8, padding: '8px 18px', textAlign: 'center', minWidth: 76 }}>
                <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: s.color, textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '10px 32px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={addBacklog} disabled={loading}
          style={{ background: '#0E1E3A', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
          <Plus size={14} /> Novo backlog
        </button>
        {[
          { label: 'Exportar', icon: <Download size={13} />, fn: exportJSON },
          { label: 'Importar', icon: <Upload size={13} />,   fn: importJSON },
        ].map(btn => (
          <button key={btn.label} type="button" onClick={btn.fn}
            style={{ background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 7, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            {btn.icon} {btn.label}
          </button>
        ))}

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
      <main style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

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
              const bDays    = b.tasks.reduce((s, t) => s + (t.days || 0), 0)
              const done     = b.tasks.filter(t => t.status === 'Concluído').length
              const progress = b.tasks.length ? Math.round(done / b.tasks.length * 100) : 0
              const endDate  = b.start_date && bDays > 0 ? toISO(addWorkDays(parseDate(b.start_date), bDays)) : null

              return (
                <div key={b.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(14,30,58,0.06)' }}>

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
                          <InlineEdit value={b.name} onChange={v => patchB(b.id, { name: v })} placeholder="Nome do backlog" />
                        </div>
                      </div>

                      <div style={{ flex: '2 1 130px', minWidth: 100 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Análise / Escopo</p>
                        <div style={{ fontSize: 13, color: '#374151' }}>
                          <InlineEdit value={b.scope} onChange={v => patchB(b.id, { scope: v })} placeholder="—" />
                        </div>
                      </div>

                      {/* Date range */}
                      <div style={{ flexShrink: 0 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Início</p>
                        <input type="date" value={b.start_date || ''} onChange={e => patchB(b.id, { start_date: e.target.value })}
                          style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', color: '#374151', outline: 'none', cursor: 'pointer' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#85B7EB')}
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
                        <DropBadge value={b.priority} options={PRIORITIES} colors={PRIORITY_C} onChange={v => patchB(b.id, { priority: v })} />
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Status</p>
                        <DropBadge value={b.status} options={STATUSES} colors={STATUS_C} onChange={v => patchB(b.id, { status: v })} />
                      </div>

                      <button type="button" onClick={() => delBacklog(b.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, display: 'flex', flexShrink: 0, marginLeft: 'auto' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}>
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingLeft: 34, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>
                        {b.tasks.length} {b.tasks.length === 1 ? 'task' : 'tasks'} · {bDays}d · {progress}% concluído
                      </span>
                      <div style={{ flex: 1, minWidth: 80, maxWidth: 200, height: 4, background: '#F3F4F6', borderRadius: 99 }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#1D9E75', borderRadius: 99, transition: 'width .3s' }} />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280', cursor: 'pointer', userSelect: 'none' as const }}>
                        <input type="checkbox" checked={b.external_dep} onChange={e => patchB(b.id, { external_dep: e.target.checked })}
                          style={{ accentColor: '#85B7EB', width: 13, height: 13 }} />
                        Dependência externa
                      </label>
                    </div>
                  </div>

                  {b.expanded && (
                    <div style={{ borderTop: '1px solid #F3F4F6' }}>
                      {b.tasks.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                            <thead>
                              <tr style={{ background: '#F9FAFB' }}>
                                {['#', 'Task', 'Responsável', 'Dias', 'Status', 'Observações', ''].map((h, i) => (
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
                                    <InlineEdit value={t.name} onChange={v => patchT(b.id, t.id, { name: v })} placeholder="Nome da task" />
                                  </td>
                                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#374151', minWidth: 110 }}>
                                    <InlineEdit value={t.owner} onChange={v => patchT(b.id, t.id, { owner: v })} placeholder="—" />
                                  </td>
                                  <td style={{ padding: '10px 12px', width: 90 }}>
                                    <input type="number" min={0} step={0.5} value={t.days}
                                      onChange={e => patchT(b.id, t.id, { days: Math.max(0, Number(e.target.value)) })}
                                      style={{ width: 60, padding: '4px 6px', border: '1px solid #E5E7EB', borderRadius: 5, fontSize: 13, textAlign: 'center' as const, outline: 'none', fontFamily: 'inherit', color: '#374151' }}
                                      onFocus={e => (e.currentTarget.style.borderColor = '#85B7EB')}
                                      onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')} />
                                  </td>
                                  <td style={{ padding: '10px 12px', width: 155 }}>
                                    <DropBadge value={t.status} options={STATUSES} colors={STATUS_C} onChange={v => patchT(b.id, t.id, { status: v })} />
                                  </td>
                                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', minWidth: 140 }}>
                                    <InlineEdit value={t.notes} onChange={v => patchT(b.id, t.id, { notes: v })} placeholder="—" />
                                  </td>
                                  <td style={{ padding: '10px 12px', width: 36 }}>
                                    <button type="button" onClick={() => delTask(b.id, t.id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2, display: 'flex' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                      onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}>
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '9px 52px 9px 12px', background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#6B7280', textTransform: 'uppercase' }}>Total do backlog</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0E1E3A', minWidth: 48, textAlign: 'right' as const }}>{bDays}d</span>
                          </div>
                        </div>
                      )}
                      <div style={{ padding: '10px 20px', borderTop: b.tasks.length > 0 ? '1px solid #F3F4F6' : 'none' }}>
                        <button type="button" onClick={() => addTask(b.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontFamily: 'inherit' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#0E1E3A')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
                          <Plus size={14} /> Adicionar task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
