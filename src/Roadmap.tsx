import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Download, Upload, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
type TaskStatus = 'Backlog' | 'Em progresso' | 'Analisa' | 'Concluído' | 'Bloqueado'
type BacklogStatus = 'Backlog' | 'Em progresso' | 'Analisa' | 'Concluído' | 'Bloqueado'
type Priority = 'Alta' | 'Média' | 'Baixa'

interface Task {
  id: string
  name: string
  responsavel: string
  estimativa: number
  status: TaskStatus
  observacoes: string
}

interface Backlog {
  id: string
  name: string
  analise: string
  prioridade: Priority
  status: BacklogStatus
  dependenciaExterna: boolean
  tasks: Task[]
  expanded: boolean
}

// ─── Constants ────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Backlog':       { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  'Em progresso':  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Analisa':       { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'Concluído':     { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  'Bloqueado':     { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Alta':  { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  'Média': { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  'Baixa': { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
}

const TASK_STATUSES: TaskStatus[]    = ['Backlog', 'Em progresso', 'Analisa', 'Concluído', 'Bloqueado']
const BACKLOG_STATUSES: BacklogStatus[] = ['Backlog', 'Em progresso', 'Analisa', 'Concluído', 'Bloqueado']
const PRIORITIES: Priority[]         = ['Alta', 'Média', 'Baixa']

const STORAGE_KEY = 'fastcomm-roadmap-v1'
const uid = () => Math.random().toString(36).slice(2, 9)

// ─── Persistence ──────────────────────────────────────────────
function loadData(): Backlog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ─── Editable text cell ───────────────────────────────────────
function Editable({
  value,
  onChange,
  placeholder = '—',
  bold = false,
  color,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  bold?: boolean
  color?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = () => { onChange(draft); setEditing(false) }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        style={{
          border: '1.5px solid #85B7EB', borderRadius: 4, padding: '2px 6px',
          fontSize: 'inherit', fontWeight: bold ? 700 : 400,
          color: color || 'inherit', background: 'white', outline: 'none',
          width: '100%', boxSizing: 'border-box',
        }}
        placeholder={placeholder}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      title="Clique para editar"
      style={{
        cursor: 'text', display: 'block',
        fontWeight: bold ? 700 : 400,
        color: value ? (color || 'inherit') : '#CBD5E1',
        fontStyle: value ? 'normal' : 'italic',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}
    >
      {value || placeholder}
    </span>
  )
}

// ─── Status/Priority dropdown badge ───────────────────────────
function Badge({
  value,
  onChange,
  options,
  colors,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  colors: Record<string, { bg: string; text: string; border: string }>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const c = colors[value] ?? { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: c.bg, color: c.text, border: `1px solid ${c.border}`,
          borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {value} <ChevronDown size={10} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
          background: 'white', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 148, overflow: 'hidden',
        }}>
          {options.map(opt => {
            const oc = colors[opt] ?? { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' }
            const active = opt === value
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 14px', fontSize: 12, fontWeight: 600,
                  color: oc.text, background: active ? oc.bg : 'white', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = oc.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = active ? oc.bg : 'white')}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Roadmap Component ───────────────────────────────────
export default function Roadmap() {
  const [backlogs, setBacklogs] = useState<Backlog[]>(loadData)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(backlogs))
  }, [backlogs])

  const mut = (fn: (prev: Backlog[]) => Backlog[]) => setBacklogs(fn)

  // ── Stats
  const totalBacklogs = backlogs.length
  const totalTasks    = backlogs.reduce((s, b) => s + b.tasks.length, 0)
  const totalDays     = backlogs.reduce((s, b) => s + b.tasks.reduce((ts, t) => ts + (t.estimativa || 0), 0), 0)
  const bloqueados    = backlogs.reduce((s, b) => s + b.tasks.filter(t => t.status === 'Bloqueado').length, 0)

  // ── Backlog ops
  const addBacklog = () => mut(prev => [...prev, {
    id: uid(), name: 'Novo backlog', analise: '', prioridade: 'Média',
    status: 'Backlog', dependenciaExterna: false, tasks: [], expanded: true,
  }])

  const removeBacklog = (id: string) => mut(prev => prev.filter(b => b.id !== id))

  const patchBacklog = (id: string, patch: Partial<Backlog>) =>
    mut(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))

  const toggleExpanded = (id: string) =>
    mut(prev => prev.map(b => b.id === id ? { ...b, expanded: !b.expanded } : b))

  // ── Task ops
  const addTask = (backlogId: string) =>
    mut(prev => prev.map(b => b.id === backlogId ? {
      ...b,
      tasks: [...b.tasks, { id: uid(), name: 'Nova task', responsavel: '', estimativa: 1, status: 'Backlog', observacoes: '' }],
    } : b))

  const removeTask = (backlogId: string, taskId: string) =>
    mut(prev => prev.map(b => b.id === backlogId
      ? { ...b, tasks: b.tasks.filter(t => t.id !== taskId) }
      : b))

  const patchTask = (backlogId: string, taskId: string, patch: Partial<Task>) =>
    mut(prev => prev.map(b => b.id === backlogId
      ? { ...b, tasks: b.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) }
      : b))

  // ── Export / Import
  const exportData = () => {
    const blob = new Blob([JSON.stringify(backlogs, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'roadmap-fastcomm.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const importData = () => {
    const input   = document.createElement('input')
    input.type    = 'file'
    input.accept  = '.json'
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          if (Array.isArray(data)) mut(() => data)
        } catch { alert('Arquivo inválido.') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const reset = () => {
    if (confirm('Resetar todos os dados? Esta ação não pode ser desfeita.')) mut(() => [])
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ background: '#0E1E3A', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: '#85B7EB', textTransform: 'uppercase', marginBottom: 5 }}>
              PRODUTO
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: -0.5, lineHeight: 1.1 }}>
              RoadMap Fastcomm
            </h1>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
              Cada backlog agrupa suas tasks e estimativas. Clique para expandir.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Backlogs', value: totalBacklogs, color: '#85B7EB' },
              { label: 'Tasks',    value: totalTasks,    color: '#1D9E75' },
              { label: 'Total (d)', value: totalDays,   color: '#EF9F27' },
              { label: 'Bloqueado', value: bloqueados,  color: '#D85A30' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.07)', border: `1px solid ${s.color}50`,
                borderRadius: 8, padding: '8px 18px', textAlign: 'center', minWidth: 76,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: s.color, textTransform: 'uppercase', marginBottom: 2 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div style={{
        background: 'white', padding: '10px 32px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <button onClick={addBacklog} style={{
          background: '#0E1E3A', color: 'white', border: 'none', borderRadius: 7,
          padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1A2B4A')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0E1E3A')}
        >
          <Plus size={14} /> Novo backlog
        </button>

        {[{ label: 'Exportar', icon: <Download size={13} />, fn: exportData },
          { label: 'Importar', icon: <Upload size={13} />, fn: importData }].map(btn => (
          <button key={btn.label} onClick={btn.fn} style={{
            background: 'white', color: '#374151', border: '1px solid #D1D5DB',
            borderRadius: 7, padding: '8px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={e => (e.currentTarget.style.background = 'white')}
          >
            {btn.icon} {btn.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button onClick={reset} style={{
          background: 'none', color: '#9CA3AF', border: 'none', borderRadius: 7,
          padding: '8px 12px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
        >
          <RotateCcw size={12} /> Resetar
        </button>
      </div>

      {/* ── Backlogs ───────────────────────────────────────── */}
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1280, margin: '0 auto' }}>

        {backlogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Nenhum backlog ainda</div>
            <div style={{ fontSize: 13 }}>Clique em "Novo backlog" para começar</div>
          </div>
        )}

        {backlogs.map(backlog => {
          const backlogDays = backlog.tasks.reduce((s, t) => s + (t.estimativa || 0), 0)
          const done        = backlog.tasks.filter(t => t.status === 'Concluído').length
          const progress    = backlog.tasks.length === 0 ? 0 : Math.round(done / backlog.tasks.length * 100)

          return (
            <div key={backlog.id} style={{
              background: 'white', borderRadius: 10,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 4px rgba(14,30,58,0.06)',
              overflow: 'hidden',
            }}>

              {/* Backlog header row */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleExpanded(backlog.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', flexShrink: 0, padding: 2, display: 'flex' }}
                  >
                    {backlog.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  {/* Name */}
                  <div style={{ flex: '2 1 180px', minWidth: 140 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3 }}>BACKLOG</div>
                    <div style={{ fontSize: 15 }}>
                      <Editable
                        value={backlog.name}
                        onChange={v => patchBacklog(backlog.id, { name: v })}
                        placeholder="Nome do backlog"
                        bold
                        color="#0E1E3A"
                      />
                    </div>
                  </div>

                  {/* Análise */}
                  <div style={{ flex: '2 1 150px', minWidth: 120 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3 }}>ANÁLISE</div>
                    <div style={{ fontSize: 13 }}>
                      <Editable
                        value={backlog.analise}
                        onChange={v => patchBacklog(backlog.id, { analise: v })}
                        placeholder="—"
                      />
                    </div>
                  </div>

                  {/* Priority */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3 }}>PRIORIDADE</div>
                    <Badge
                      value={backlog.prioridade}
                      onChange={v => patchBacklog(backlog.id, { prioridade: v as Priority })}
                      options={PRIORITIES}
                      colors={PRIORITY_COLORS}
                    />
                  </div>

                  {/* Status */}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 3 }}>STATUS</div>
                    <Badge
                      value={backlog.status}
                      onChange={v => patchBacklog(backlog.id, { status: v as BacklogStatus })}
                      options={BACKLOG_STATUSES}
                      colors={STATUS_COLORS}
                    />
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeBacklog(backlog.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, flexShrink: 0, display: 'flex' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Meta row: progress + dependency */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingLeft: 34, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>
                    {backlog.tasks.length} {backlog.tasks.length === 1 ? 'task' : 'tasks'} · Total: {backlogDays}d · Progresso: {progress}%
                  </span>
                  <div style={{ flex: 1, minWidth: 80, maxWidth: 180, height: 4, background: '#F3F4F6', borderRadius: 2 }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#1D9E75', borderRadius: 2, transition: 'width 0.35s' }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={backlog.dependenciaExterna}
                      onChange={e => patchBacklog(backlog.id, { dependenciaExterna: e.target.checked })}
                      style={{ accentColor: '#85B7EB', width: 13, height: 13 }}
                    />
                    Dependência externa
                  </label>
                </div>
              </div>

              {/* Tasks table */}
              {backlog.expanded && (
                <div style={{ borderTop: '1px solid #F3F4F6' }}>
                  {backlog.tasks.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                          {['#', 'TASK', 'RESPONSÁVEL', 'ESTIMATIVA (D)', 'STATUS', 'OBSERVAÇÕES', ''].map((h, i) => (
                            <th key={i} style={{
                              padding: '8px 12px', textAlign: 'left' as const, fontSize: 9,
                              fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF',
                              textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const,
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {backlog.tasks.map((task, idx) => (
                          <tr
                            key={task.id}
                            style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF', width: 32 }}>{idx + 1}</td>

                            <td style={{ padding: '10px 12px', fontSize: 13, minWidth: 160 }}>
                              <Editable
                                value={task.name}
                                onChange={v => patchTask(backlog.id, task.id, { name: v })}
                                placeholder="Nome da task"
                                bold
                                color="#85B7EB"
                              />
                            </td>

                            <td style={{ padding: '10px 12px', fontSize: 13, minWidth: 110 }}>
                              <Editable
                                value={task.responsavel}
                                onChange={v => patchTask(backlog.id, task.id, { responsavel: v })}
                                placeholder="—"
                              />
                            </td>

                            <td style={{ padding: '10px 12px', width: 120 }}>
                              <input
                                type="number"
                                value={task.estimativa}
                                min={0}
                                step={0.5}
                                onChange={e => patchTask(backlog.id, task.id, { estimativa: Number(e.target.value) })}
                                style={{
                                  width: 64, padding: '4px 8px', border: '1px solid #E5E7EB',
                                  borderRadius: 5, fontSize: 13, textAlign: 'center' as const,
                                  outline: 'none', fontFamily: 'inherit', color: '#374151',
                                }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#85B7EB')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                              />
                            </td>

                            <td style={{ padding: '10px 12px', width: 150 }}>
                              <Badge
                                value={task.status}
                                onChange={v => patchTask(backlog.id, task.id, { status: v as TaskStatus })}
                                options={TASK_STATUSES}
                                colors={STATUS_COLORS}
                              />
                            </td>

                            <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', minWidth: 140 }}>
                              <Editable
                                value={task.observacoes}
                                onChange={v => patchTask(backlog.id, task.id, { observacoes: v })}
                                placeholder="—"
                              />
                            </td>

                            <td style={{ padding: '10px 12px', width: 36 }}>
                              <button
                                onClick={() => removeTask(backlog.id, task.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 2, display: 'flex' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Total row */}
                  {backlog.tasks.length > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
                      padding: '9px 60px 9px 12px',
                      background: '#F9FAFB', borderTop: '1px solid #F3F4F6',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#6B7280', textTransform: 'uppercase' }}>
                        Total do backlog
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0E1E3A', minWidth: 40, textAlign: 'center' }}>
                        {backlogDays}d
                      </span>
                    </div>
                  )}

                  {/* Add task */}
                  <div style={{ padding: '10px 20px', borderTop: backlog.tasks.length > 0 ? '1px solid #F3F4F6' : 'none' }}>
                    <button
                      onClick={() => addTask(backlog.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, color: '#6B7280',
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#0E1E3A')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
                    >
                      <Plus size={14} /> Adicionar task
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
          Alterações salvas automaticamente neste navegador · Use Exportar para compartilhar
        </p>
      </div>
    </div>
  )
}
