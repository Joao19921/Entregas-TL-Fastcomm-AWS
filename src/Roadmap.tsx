import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Download, Upload, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'

type Status   = 'Backlog' | 'Em progresso' | 'Analisa' | 'Concluído' | 'Bloqueado'
type Priority = 'Alta' | 'Média' | 'Baixa'

interface Task {
  id: string
  name: string
  owner: string
  days: number
  status: Status
  notes: string
}

interface BacklogItem {
  id: string
  name: string
  scope: string
  priority: Priority
  status: Status
  externalDep: boolean
  expanded: boolean
  tasks: Task[]
}

const STATUS: Record<Status, { bg: string; text: string; border: string }> = {
  'Backlog':      { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
  'Em progresso': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Analisa':      { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  'Concluído':    { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
  'Bloqueado':    { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
}

const PRIORITY: Record<Priority, { bg: string; text: string; border: string }> = {
  'Alta':  { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  'Média': { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  'Baixa': { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
}

const STATUSES: Status[]    = ['Backlog', 'Em progresso', 'Analisa', 'Concluído', 'Bloqueado']
const PRIORITIES: Priority[] = ['Alta', 'Média', 'Baixa']
const KEY = 'rm_fastcomm_v2'

const uid      = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const persist  = (d: BacklogItem[]) => localStorage.setItem(KEY, JSON.stringify(d))
const hydrate  = (): BacklogItem[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] } }

function InlineEdit({ value, onChange, placeholder = '—' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [on, setOn] = useState(false)
  const [v, setV]   = useState(value)
  const ok = () => { onChange(v.trim()); setOn(false) }
  if (on) return (
    <input autoFocus value={v} placeholder={placeholder}
      onChange={e => setV(e.target.value)}
      onBlur={ok}
      onKeyDown={e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') { setV(value); setOn(false) } }}
      style={{ border: '1.5px solid #85B7EB', borderRadius: 4, padding: '2px 7px', fontSize: 'inherit', fontFamily: 'inherit', width: '100%', outline: 'none', boxSizing: 'border-box' as const, background: '#fff' }}
    />
  )
  return (
    <span onClick={() => { setV(value); setOn(true) }} title="Clique para editar"
      style={{ cursor: 'text', display: 'block', color: value ? 'inherit' : '#CBD5E1', fontStyle: value ? 'normal' : 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {value || placeholder}
    </span>
  )
}

function DropBadge<T extends string>({ value, options, colors, onChange }: { value: T; options: T[]; colors: Record<string, { bg: string; text: string; border: string }>; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const c   = colors[value] ?? STATUS['Backlog']
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
        {value} <ChevronDown size={10} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.13)', minWidth: 150, overflow: 'hidden' }}>
          {options.map(opt => {
            const oc = colors[opt] ?? STATUS['Backlog']
            const sel = opt === value
            return (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, fontWeight: 600, color: oc.text, background: sel ? oc.bg : '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = oc.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = sel ? oc.bg : '#fff')}>
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Roadmap() {
  const [items, setItems] = useState<BacklogItem[]>(hydrate)
  useEffect(() => persist(items), [items])

  const set = (fn: (p: BacklogItem[]) => BacklogItem[]) => setItems(fn)

  const addBacklog = () => set(p => [...p, { id: uid(), name: 'Novo backlog', scope: '', priority: 'Média', status: 'Backlog', externalDep: false, expanded: true, tasks: [] }])
  const delBacklog = (id: string) => set(p => p.filter(b => b.id !== id))
  const patchB     = (id: string, patch: Partial<BacklogItem>) => set(p => p.map(b => b.id === id ? { ...b, ...patch } : b))
  const addTask    = (bid: string) => set(p => p.map(b => b.id !== bid ? b : { ...b, tasks: [...b.tasks, { id: uid(), name: 'Nova task', owner: '', days: 1, status: 'Backlog', notes: '' }] }))
  const delTask    = (bid: string, tid: string) => set(p => p.map(b => b.id !== bid ? b : { ...b, tasks: b.tasks.filter(t => t.id !== tid) }))
  const patchT     = (bid: string, tid: string, patch: Partial<Task>) => set(p => p.map(b => b.id !== bid ? b : { ...b, tasks: b.tasks.map(t => t.id === tid ? { ...t, ...patch } : t) }))

  const totalBacklogs = items.length
  const totalTasks    = items.reduce((s, b) => s + b.tasks.length, 0)
  const totalDays     = items.reduce((s, b) => s + b.tasks.reduce((ts, t) => ts + (t.days || 0), 0), 0)
  const blocked       = items.reduce((s, b) => s + b.tasks.filter(t => t.status === 'Bloqueado').length, 0)

  const exportJSON = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }))
    a.download = 'roadmap-fastcomm.json'; a.click()
  }
  const importJSON = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'
    inp.onchange = e => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { try { set(() => JSON.parse(ev.target!.result as string)) } catch { alert('Arquivo inválido') } }; r.readAsText(f) }
    inp.click()
  }
  const reset = () => { if (confirm('Apagar todos os dados?')) set(() => []) }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#0E1E3A', padding: '22px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: '#85B7EB', textTransform: 'uppercase' }}>PRODUTO</p>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>RoadMap Fastcomm — Segundo Semestre</h1>
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Clique em um backlog para ver e gerenciar suas tasks.</p>
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
        <button type="button" onClick={addBacklog} style={{ background: '#0E1E3A', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <Plus size={14} /> Novo backlog
        </button>
        {[{ label: 'Exportar', icon: <Download size={13} />, fn: exportJSON }, { label: 'Importar', icon: <Upload size={13} />, fn: importJSON }].map(btn => (
          <button key={btn.label} type="button" onClick={btn.fn} style={{ background: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 7, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            {btn.icon} {btn.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={reset} style={{ background: 'none', color: '#9CA3AF', border: 'none', borderRadius: 7, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
          <RotateCcw size={12} /> Resetar
        </button>
      </div>

      {/* List */}
      <main style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
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

          return (
            <div key={b.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(14,30,58,0.06)' }}>

              {/* Backlog header */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => patchB(b.id, { expanded: !b.expanded })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 2, display: 'flex', flexShrink: 0 }}>
                    {b.expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  <div style={{ flex: '2 1 170px', minWidth: 130 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Backlog</p>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0E1E3A' }}>
                      <InlineEdit value={b.name} onChange={v => patchB(b.id, { name: v })} placeholder="Nome do backlog" />
                    </div>
                  </div>

                  <div style={{ flex: '2 1 140px', minWidth: 110 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Análise / Escopo</p>
                    <div style={{ fontSize: 13, color: '#374151' }}>
                      <InlineEdit value={b.scope} onChange={v => patchB(b.id, { scope: v })} placeholder="—" />
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Prioridade</p>
                    <DropBadge value={b.priority} options={PRIORITIES} colors={PRIORITY} onChange={v => patchB(b.id, { priority: v })} />
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#9CA3AF', textTransform: 'uppercase' }}>Status</p>
                    <DropBadge value={b.status} options={STATUSES} colors={STATUS} onChange={v => patchB(b.id, { status: v })} />
                  </div>

                  <button type="button" onClick={() => delBacklog(b.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, display: 'flex', flexShrink: 0, marginLeft: 'auto' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}>
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingLeft: 34, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>
                    {b.tasks.length} {b.tasks.length === 1 ? 'task' : 'tasks'} · {bDays}d · {progress}% concluído
                  </span>
                  <div style={{ flex: 1, minWidth: 80, maxWidth: 200, height: 4, background: '#F3F4F6', borderRadius: 99 }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#1D9E75', borderRadius: 99, transition: 'width .3s' }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280', cursor: 'pointer', userSelect: 'none' as const }}>
                    <input type="checkbox" checked={b.externalDep} onChange={e => patchB(b.id, { externalDep: e.target.checked })}
                      style={{ accentColor: '#85B7EB', width: 13, height: 13 }} />
                    Dependência externa
                  </label>
                </div>
              </div>

              {/* Tasks */}
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
                                  onBlur={e =>  (e.currentTarget.style.borderColor = '#E5E7EB')} />
                              </td>
                              <td style={{ padding: '10px 12px', width: 155 }}>
                                <DropBadge value={t.status} options={STATUSES} colors={STATUS} onChange={v => patchT(b.id, t.id, { status: v })} />
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

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', margin: '8px 0 0' }}>
          Salvo automaticamente no navegador · Exportar para compartilhar
        </p>
      </main>
    </div>
  )
}
