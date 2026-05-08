import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'

// ─── Brand tokens ────────────────────────────────────────────
const C = {
  navy: '#0E1E3A',
  navySoft: '#1A2B4A',
  ice: '#E8EEF7',
  iceSoft: '#F8F9FB',
  sky: '#85B7EB',
  skyLight: '#B5D4F4',
  teal: '#1D9E75',
  amber: '#EF9F27',
  coral: '#D85A30',
  coralSoft: '#FEF1ED',
  text: '#1F2328',
  textMuted: '#5F5E5A',
  textTertiary: '#888780',
  white: '#FFFFFF',
}

// ─── Shared helpers ───────────────────────────────────────────

function Fade({
  children,
  delay = 0,
  y = 14,
  style,
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      style={style}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

function AnimNum({
  value,
  suffix = '',
}: {
  value: number
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!inView) return
    const dur = 1100
    let start: number
    const frame = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      setDisplay(Math.round((1 - (1 - p) ** 3) * value))
      if (p < 1) requestAnimationFrame(frame)
    }
    const id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [inView, value])
  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

function AnimBar({
  label,
  value,
  delay = 0,
}: {
  label: string
  value: number
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 45px',
        alignItems: 'center',
        gap: 14,
        fontSize: 13,
      }}
    >
      <div style={{ color: C.text, textAlign: 'right' }}>{label}</div>
      <div
        style={{
          background: C.ice,
          borderRadius: 4,
          height: 22,
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{ background: C.sky, height: '100%' }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : { width: 0 }}
          transition={{
            duration: 1.2,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
      <div style={{ fontWeight: 600, color: C.navy }}>{value}</div>
    </div>
  )
}

function SN({ n, dark = false }: { n: number; dark?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 16,
        fontSize: 10,
        color: dark ? C.ice : C.textTertiary,
        background: dark ? 'rgba(255,255,255,0.08)' : C.ice,
        padding: '3px 8px',
        borderRadius: 10,
        zIndex: 5,
      }}
    >
      {n} / 13
    </div>
  )
}

function SF({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 56,
        fontSize: 11,
        color: dark ? C.sky : C.textMuted,
      }}
    >
      {text}
    </div>
  )
}

const body: React.CSSProperties = {
  padding: '48px 56px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}

// ─── SLIDE 01: Cover ─────────────────────────────────────────
function Slide01() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.navy,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}
    >
      <SN n={1} dark />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 14,
          height: '100%',
          background: C.sky,
        }}
      />
      <div style={{ ...body, justifyContent: 'center' }}>
        <Fade>
          <div
            style={{
              color: C.sky,
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 6,
              marginBottom: 18,
            }}
          >
            FASTCOMM
          </div>
        </Fade>
        <Fade delay={0.1}>
          <h1
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: C.white,
              margin: '0 0 18px',
              letterSpacing: -1,
              lineHeight: 1.05,
            }}
          >
            FastComm 1.6
          </h1>
        </Fade>
        <Fade delay={0.2}>
          <p style={{ color: C.ice, fontSize: 28, margin: 0 }}>
            Diagnóstico técnico e direção de produto
          </p>
        </Fade>
        <Fade delay={0.3}>
          <div
            style={{
              width: 60,
              height: 4,
              background: C.sky,
              margin: '24px 0 16px',
            }}
          />
        </Fade>
        <Fade delay={0.4}>
          <p style={{ color: C.sky, fontStyle: 'italic', fontSize: 17, margin: 0 }}>
            Apresentação executiva · Product Owner
          </p>
        </Fade>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 56,
          color: C.ice,
          fontSize: 12,
        }}
      >
        Confidencial · CTC Tech
      </div>
    </div>
  )
}

// ─── SLIDE 02: Executive Summary ──────────────────────────────
function Slide02() {
  const stats = [
    { pct: 100, lbl: 'Repositórios', sub: '6/6 concluído' },
    { pct: 100, lbl: 'Segurança', sub: '7/7 concluído' },
    { pct: 100, lbl: 'Performance', sub: '6/6 concluído' },
    { pct: 100, lbl: 'Arquitetura', sub: '6/6 concluído' },
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={2} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Sumário executivo
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            Onde estamos no diagnóstico do produto e o que falta decidir
          </p>
        </Fade>

        <Fade
          delay={0.15}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginTop: 20,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                background: C.ice,
                borderRadius: 8,
                padding: '16px 18px',
                borderLeft: `4px solid ${C.teal}`,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: C.navy,
                  lineHeight: 1,
                }}
              >
                <AnimNum value={s.pct} suffix="%" />
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  marginTop: 8,
                }}
              >
                {s.lbl}
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </Fade>

        <Fade delay={0.25}>
          <div
            style={{ height: 1, background: C.ice, margin: '24px 0 18px' }}
          />
        </Fade>
        <Fade delay={0.3}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: C.navy,
              margin: '0 0 14px',
            }}
          >
            As frentes em andamento agora são de produto
          </h2>
        </Fade>
        <Fade
          delay={0.35}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.ice}`,
              borderRadius: 8,
              borderLeft: `4px solid ${C.amber}`,
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>
                Mapeamento de Features
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.amber }}>
                60%
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: C.textMuted,
                margin: '8px 0 0',
                lineHeight: 1.5,
              }}
            >
              3 de 5 itens. Em andamento: telemetria de uso real e levantamento
              de features desejadas.
            </p>
          </div>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.ice}`,
              borderRadius: 8,
              borderLeft: `4px solid ${C.coral}`,
              padding: '16px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>
                Planejamento - evolução do produto
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.coral }}>
                40%
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                color: C.textMuted,
                margin: '8px 0 0',
                lineHeight: 1.5,
              }}
            >
              2 de 5 itens. Em andamento: priorização das melhorias e definição
              da arquitetura alvo.
            </p>
          </div>
        </Fade>
      </div>
      <SF text="FastComm 1.6 · Diagnóstico" />
    </div>
  )
}

// ─── SLIDE 03: Workstream Status ──────────────────────────────
function Slide03() {
  const bars = [
    { label: 'Repositórios', value: 100 },
    { label: 'Segurança', value: 100 },
    { label: 'Performance', value: 100 },
    { label: 'Arquitetura', value: 100 },
    { label: 'Mapeamento de Features', value: 60 },
    { label: 'Planejamento - evolução do produto', value: 40 },
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={3} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Status por workstream
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            Conclusão dos itens em cada frente do diagnóstico
          </p>
        </Fade>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: 16,
            marginTop: 22,
            flex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              justifyContent: 'center',
              padding: '16px 0',
            }}
          >
            {bars.map((b, i) => (
              <AnimBar
                key={b.label}
                label={b.label}
                value={b.value}
                delay={0.1 + i * 0.08}
              />
            ))}
          </div>
          <Fade delay={0.2}>
            <aside
              style={{
                background: C.navy,
                borderRadius: 8,
                padding: '22px 24px',
                color: C.white,
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.sky,
                  fontWeight: 700,
                  letterSpacing: 3,
                  marginBottom: 14,
                }}
              >
                LEITURA
              </div>
              <h3
                style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}
              >
                4 frentes técnicas fechadas em 100%
              </h3>
              <p
                style={{
                  margin: '0 0 18px',
                  fontSize: 12,
                  color: C.ice,
                  lineHeight: 1.55,
                }}
              >
                Análise estática automatizada (Claude Code) já entregou tudo o
                que dependia de ler código.
              </p>
              <hr
                style={{
                  border: 0,
                  borderTop: `1px solid ${C.sky}`,
                  width: 32,
                  margin: '0 0 16px',
                }}
              />
              <h3
                style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}
              >
                2 frentes em andamento
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: C.ice,
                  lineHeight: 1.55,
                }}
              >
                Telemetria, entrevistas com clientes, priorização e desenho da
                arquitetura alvo.
              </p>
            </aside>
          </Fade>
        </div>
      </div>
      <SF text="FastComm 1.6 · Diagnóstico" />
    </div>
  )
}

// ─── SLIDE 04: Technical Diagnosis ───────────────────────────
function Slide04() {
  const cols = [
    {
      title: 'Repositórios',
      meta: '6/6 · 100%',
      items: [
        'Inventário Git completo',
        'Dependências entre repos mapeadas',
        'Responsabilidades documentadas',
        'Branch strategy avaliada',
        'READMEs revisados',
        'Repos obsoletos identificados',
      ],
    },
    {
      title: 'Segurança',
      meta: '7/7 · 100%',
      items: [
        'Scan de CVEs em dependências',
        'Busca de secrets hardcoded',
        'Revisão de auth e authz',
        'Validação de inputs',
        'Análise de SQL injection',
        'Relatório de vulnerabilidades',
      ],
    },
    {
      title: 'Performance',
      meta: '6/6 · 100%',
      items: [
        'Queries N+1 identificadas',
        'Análise de memory leaks',
        'Tamanho de bundles avaliado',
        'Oportunidades de cache',
        'Operações bloqueantes',
        'Relatório de performance',
      ],
    },
    {
      title: 'Arquitetura',
      meta: '6/6 · 100%',
      items: [
        'Acoplamento entre módulos',
        'Verificação de SOLID',
        'Code smells',
        'Duplicação de código',
        'Cobertura de testes',
        'Dead code',
      ],
    },
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={4} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Diagnóstico técnico
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            O que cada workstream entregou
          </p>
        </Fade>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginTop: 22,
            flex: 1,
          }}
        >
          {cols.map((col, i) => (
            <Fade key={col.title} delay={0.1 + i * 0.07}>
              <div
                style={{
                  background: C.ice,
                  borderRadius: 8,
                  borderTop: `4px solid ${C.teal}`,
                  padding: '18px 20px',
                  height: '100%',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 4px',
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.navy,
                  }}
                >
                  {col.title}
                </h4>
                <div
                  style={{
                    fontSize: 11,
                    color: C.teal,
                    fontWeight: 700,
                    letterSpacing: 1,
                    marginBottom: 16,
                  }}
                >
                  {col.meta}
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    color: C.text,
                  }}
                >
                  {col.items.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Fade>
          ))}
        </div>
      </div>
      <SF text="FastComm 1.6 · Diagnóstico" />
    </div>
  )
}

// ─── SLIDE 05: Active Fronts ──────────────────────────────────
function Slide05() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={5} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Frentes em andamento
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            O que está rodando e o próximo passo de cada uma
          </p>
        </Fade>

        {[
          {
            title: 'Mapeamento de Features',
            pct: '60% · 3 de 5',
            color: C.amber,
            lines: [
              {
                label: 'Concluído:',
                text: 'lista de features existentes (2/2) e features não utilizadas.',
                type: 'normal',
              },
              {
                label: 'Em andamento:',
                text: 'levantamento de features desejadas — depende de pesquisa de mercado, conversa com comercial e benchmark com concorrentes (Mirth, Rhapsody, InterSystems).',
                type: 'next',
              },
              {
                label: 'Próximo passo:',
                text: 'Claude Code não infere uso real lendo código — habilitar telemetria (eventos de produto) e/ou agendar entrevistas com clientes e CS.',
                type: 'note',
              },
            ],
          },
          {
            title: 'Planejamento - evolução do produto',
            pct: '40% · 2 de 5',
            color: C.coral,
            lines: [
              {
                label: 'Concluído:',
                text: 'consolidação inicial e levantamento de melhorias técnicas.',
                type: 'normal',
              },
              {
                label: 'Em andamento:',
                text: 'priorização das melhorias e definição da arquitetura alvo 1.6 (centralização de front, plataforma de IA, ajuda contextual).',
                type: 'next',
              },
              {
                label: 'Próximo passo:',
                text: 'síntese e decisão — consolidar tudo o que veio dos diagnósticos em uma direção única e fechar o roadmap.',
                type: 'note',
              },
            ],
          },
        ].map((card, i) => (
          <Fade key={card.title} delay={0.15 + i * 0.1}>
            <div
              style={{
                background: C.white,
                border: `1px solid ${C.ice}`,
                borderRadius: 8,
                borderLeft: `6px solid ${card.color}`,
                padding: '20px 24px',
                marginTop: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 14,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 19,
                    color: C.navy,
                    fontWeight: 700,
                  }}
                >
                  {card.title}
                </h3>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: card.color,
                  }}
                >
                  {card.pct}
                </div>
              </div>
              {card.lines.map(line => (
                <p
                  key={line.label}
                  style={{
                    fontSize: line.type === 'note' ? 12 : 13.5,
                    color:
                      line.type === 'note' ? C.textMuted : C.text,
                    margin: '6px 0',
                    lineHeight: 1.55,
                    fontStyle: line.type === 'note' ? 'italic' : 'normal',
                  }}
                >
                  <strong
                    style={{
                      color:
                        line.type === 'next'
                          ? C.coral
                          : line.type === 'note'
                          ? C.text
                          : C.navy,
                    }}
                  >
                    {line.label}
                  </strong>{' '}
                  {line.text}
                </p>
              ))}
            </div>
          </Fade>
        ))}
      </div>
      <SF text="FastComm 1.6 · Diagnóstico" />
    </div>
  )
}

// ─── SLIDE 06: Proposed Direction ────────────────────────────
function Slide06() {
  const pillars = [
    {
      num: '01',
      title: 'Front centralizado',
      sub: 'Unificação de Engine + Fastcomm',
      items: [
        'Um único shell em app.fastcomm.com.br',
        'De 14 itens em 2 apps para 8 itens em 1 app',
        'Remover: Visualizador Clínico, Barramento, Marketplace, Meus produtos',
        'Mover Relatórios para Grafana embarcado',
      ],
    },
    {
      num: '02',
      title: 'Ajuda contextual com IA',
      sub: 'Documentação substituída por chatbot',
      items: [
        'Conteúdo descritivo curto como entrada',
        'Botão "Continua com dúvida?" abre o chatbot',
        'RAG sobre o manual com fonte sempre citada',
        'Ciente da tela e dos artefatos do usuário',
      ],
    },
    {
      num: '03',
      title: 'Insights operacionais',
      sub: 'Análise + LLM como narrador',
      items: [
        'Top 5 pipelines por execução e por erro',
        'Detecção estatística de anomalia',
        'LLM apenas traduz o achado em texto',
        'Sem alucinação — número entra pronto',
      ],
    },
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={6} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Direção proposta para a 1.6
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            Três pilares para destravar o planejamento
          </p>
        </Fade>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginTop: 22,
            flex: 1,
          }}
        >
          {pillars.map((p, i) => (
            <Fade key={p.num} delay={0.1 + i * 0.1}>
              <div
                style={{
                  background: C.ice,
                  borderRadius: 8,
                  padding: '24px 26px',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 700,
                    color: C.sky,
                    lineHeight: 1,
                    marginBottom: 14,
                  }}
                >
                  {p.num}
                </div>
                <h4
                  style={{
                    margin: '0 0 4px',
                    fontSize: 19,
                    fontWeight: 700,
                    color: C.navy,
                  }}
                >
                  {p.title}
                </h4>
                <div
                  style={{
                    fontSize: 12.5,
                    color: C.textMuted,
                    fontStyle: 'italic',
                    marginBottom: 16,
                  }}
                >
                  {p.sub}
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    color: C.text,
                  }}
                >
                  {p.items.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </Fade>
          ))}
        </div>
      </div>
      <SF text="FastComm 1.6 · Direção" />
    </div>
  )
}

// ─── SLIDE 07: AI Architecture ────────────────────────────────
function Slide07() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={7} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Arquitetura de IA — visão executiva
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            Como Chatbot e Insights se conectam ao LLM sem acoplar o produto
          </p>
        </Fade>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginTop: 22,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 40,
          }}
        >
          <Fade
            delay={0.1}
            style={{
              display: 'flex',
              gap: 14,
              width: '100%',
              maxWidth: 1100,
            }}
          >
            {[
              {
                title: 'Chatbot da Ajuda',
                desc: 'Acionado pelo botão do artigo de ajuda',
              },
              {
                title: 'Insight do Dashboard',
                desc: 'Renderizado ao carregar a tela',
              },
            ].map(box => (
              <div
                key={box.title}
                style={{
                  flex: 1,
                  background: C.ice,
                  borderRadius: 8,
                  borderLeft: `4px solid ${C.sky}`,
                  padding: '14px 18px',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 6px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: C.navy,
                  }}
                >
                  {box.title}
                </h4>
                <p
                  style={{ margin: 0, fontSize: 12.5, color: C.textMuted }}
                >
                  {box.desc}
                </p>
              </div>
            ))}
          </Fade>

          <Fade delay={0.2}>
            <div
              style={{
                textAlign: 'center',
                color: C.textMuted,
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ↓
            </div>
          </Fade>

          <Fade
            delay={0.3}
            style={{ width: '100%', maxWidth: 1100 }}
          >
            <div
              style={{
                background: C.navySoft,
                color: C.white,
                borderRadius: 8,
                borderLeft: `4px solid ${C.sky}`,
                padding: '14px 18px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 6px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.white,
                }}
              >
                LLM Gateway interno
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: C.ice }}>
                PII redaction · audit trail · cache · rate limit por tenant ·
                troca de provider sem mexer no produto
              </p>
            </div>
          </Fade>

          <Fade delay={0.35}>
            <div
              style={{
                textAlign: 'center',
                color: C.textMuted,
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ↓
            </div>
          </Fade>

          <Fade
            delay={0.4}
            style={{ width: '100%', maxWidth: 1100 }}
          >
            <div
              style={{
                background: C.ice,
                borderRadius: 8,
                borderLeft: `4px solid ${C.coral}`,
                padding: '14px 18px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 6px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.navy,
                }}
              >
                Anthropic API · Claude Sonnet (recomendado)
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted }}>
                Zero Data Retention contratual · LGPD-friendly · tool use
                estável · contexto de 200k tokens
              </p>
            </div>
          </Fade>

          <Fade delay={0.45}>
            <p
              style={{
                marginTop: 18,
                fontSize: 12,
                color: C.textMuted,
                fontStyle: 'italic',
                textAlign: 'center',
                maxWidth: 1000,
              }}
            >
              Claude Code é a ferramenta de desenvolvimento que o time usa hoje
              — em produção, o produto consome a API da Anthropic através do
              Gateway interno.
            </p>
          </Fade>
        </div>
      </div>
      <SF text="FastComm 1.6 · Direção" />
    </div>
  )
}

// ─── SLIDE 08: Target Architecture 1.6 ───────────────────────
function Slide09() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={8} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Arquitetura alvo 1.6
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            Evolução incremental sobre o núcleo existente — sem reescrever
            o que já funciona
          </p>
        </Fade>

        <div
          style={{
            marginTop: 18,
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* AI layer */}
          <Fade delay={0.1}>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.coral,
                  letterSpacing: 3,
                  marginBottom: 6,
                }}
              >
                CAMADA NOVA — IA
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1.4fr 1.8fr 1fr 1fr',
                  gap: 10,
                }}
              >
                {[
                  { title: 'Chatbot da Ajuda', sub: 'Botão no artigo' },
                  { title: 'Insight do Dashboard', sub: 'Renderiza ao carregar' },
                  { title: 'LLM Gateway', sub: 'PII redaction · audit · cache' },
                  { title: 'Vector Store', sub: 'Manual indexado' },
                  { title: 'Anthropic API', sub: 'Claude Sonnet' },
                ].map(box => (
                  <div
                    key={box.title}
                    style={{
                      background: C.white,
                      border: `2px solid ${C.coral}`,
                      borderRadius: 6,
                      padding: '10px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.navy,
                      }}
                    >
                      {box.title}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>
                      {box.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Fade>

          {/* Banner */}
          <Fade delay={0.2}>
            <div
              style={{
                background: C.coralSoft,
                borderRadius: 6,
                padding: '8px 14px',
                fontSize: 12,
                color: '#8C3A1F',
                fontStyle: 'italic',
              }}
            >
              <strong style={{ color: C.coral }}>
                Leitura de dados pelo Gateway:
              </strong>{' '}
              Chatbot consulta Postgres (mapeamentos do usuário) · Insight
              consulta ClickHouse (top pipelines, erros) · Tudo via tool use
              auditado.
            </div>
          </Fade>

          {/* Core nucleus SVG */}
          <Fade delay={0.25} style={{ flex: 1 }}>
            <div
              style={{
                background: C.iceSoft,
                borderRadius: 8,
                padding: '14px 16px',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.textMuted,
                  letterSpacing: 3,
                  marginBottom: 10,
                }}
              >
                NÚCLEO PÓS-1.5 · retrocompatível
              </div>
              <svg
                viewBox="0 0 1180 240"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                style={{ width: '100%', height: 'auto' }}
              >
                <defs>
                  <marker id="ah9" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#5F5E5A" />
                  </marker>
                </defs>
                <line x1={130} y1={121} x2={168} y2={121} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={300} y1={32} x2={343} y2={32} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={300} y1={92} x2={343} y2={92} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={300} y1={152} x2={343} y2={152} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={300} y1={210} x2={343} y2={210} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={495} y1={152} x2={538} y2={152} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={495} y1={32} x2={728} y2={32} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={495} y1={92} x2={728} y2={92} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={680} y1={152} x2={728} y2={152} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={495} y1={210} x2={728} y2={152} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <line x1={820} y1={174} x2={820} y2={190} stroke="#5F5E5A" strokeWidth={1.5} markerEnd="url(#ah9)" />
                <a href="https://www.figma.com/board/jkv0uugzmm6MinWcnE80wb/IA-Fastcomm-New-Front?node-id=0-1&t=HsQwJzQn8i26vVjb-1" target="_blank" rel="noopener noreferrer">
                  <rect x={10} y={95} width={120} height={52} rx={5} fill="white" stroke="#E85A2C" strokeWidth={2} />
                  <text x={70} y={118} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">New Front</text>
                  <text x={70} y={136} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={10} fill="#E85A2C" fontWeight={600}>Figma ↗</text>
                </a>
                <rect x={170} y={10} width={130} height={220} rx={5} fill="white" stroke="#1A2B4A" strokeWidth={1.5} />
                <text x={235} y={38} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">API Gateway</text>
                <text x={235} y={55} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={10} fill="#5F5E5A">NGINX</text>
                <text x={235} y={88} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={9} fill="#1F2328">Controle de acesso</text>
                <text x={235} y={103} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={9} fill="#1F2328">Controle de comportamento</text>
                <rect x={345} y={10} width={150} height={44} rx={5} fill="white" stroke="#85B7EB" strokeWidth={2} />
                <text x={420} y={38} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">Core</text>
                <rect x={345} y={70} width={150} height={44} rx={5} fill="white" stroke="#85B7EB" strokeWidth={2} />
                <text x={420} y={98} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">Engine</text>
                <rect x={345} y={130} width={150} height={44} rx={5} fill="white" stroke="#85B7EB" strokeWidth={2} />
                <text x={420} y={158} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">Orquestrador</text>
                <rect x={345} y={190} width={150} height={40} rx={5} fill="white" stroke="#85B7EB" strokeWidth={2} />
                <text x={420} y={215} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">Log</text>
                <rect x={540} y={130} width={140} height={44} rx={5} fill="white" stroke="#85B7EB" strokeWidth={2} />
                <text x={610} y={158} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">Executor</text>
                <rect x={730} y={10} width={180} height={104} rx={5} fill="white" stroke="#1A2B4A" strokeWidth={1.5} />
                <text x={820} y={46} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">Postgres</text>
                <text x={820} y={64} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={10} fill="#5F5E5A">schemas engine · core</text>
                <rect x={730} y={130} width={180} height={44} rx={5} fill="white" stroke="#1A2B4A" strokeWidth={1.5} />
                <text x={820} y={158} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">ClickHouse</text>
                <rect x={730} y={190} width={180} height={40} rx={5} fill="white" stroke="#1A2B4A" strokeWidth={1.5} />
                <text x={820} y={215} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={12} fontWeight={700} fill="#0E1E3A">Grafana</text>
              </svg>
            </div>
          </Fade>
        </div>
        <Fade delay={0.35}>
          <div
            style={{
              marginTop: 8,
              border: `1.5px solid ${C.coral}`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {/* New Front — description + Figma link */}
            <div
              style={{
                background: 'linear-gradient(135deg, #F4F6FB 0%, #FFF3EF 100%)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.coral }}>
                  New Front ·{' '}
                </span>
                <span style={{ fontSize: 11, color: C.navy, lineHeight: 1.6 }}>
                  Não nasceu <em>depois</em> da nova arquitetura — nasceu{' '}
                  <em>junto</em>. Projetado para um back-end com banco único e
                  zero fragmentação de contexto, cada cliente tombado do legado
                  não apenas migra: ele confirma em tempo real que a direção
                  está certa. Ainda não é a versão final — mas é, sem dúvida, a
                  melhor versão que o FastComm já teve.
                </span>
              </div>
              <a
                href="https://www.figma.com/board/jkv0uugzmm6MinWcnE80wb/IA-Fastcomm-New-Front?node-id=0-1&t=HsQwJzQn8i26vVjb-1"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  background: C.coral,
                  color: 'white',
                  borderRadius: 6,
                  padding: '8px 14px',
                  textDecoration: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                <span>Design</span>
                <span style={{ fontSize: 15 }}>↗</span>
              </a>
            </div>
            {/* Security emphasis section */}
            <div
              style={{
                background: C.navy,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="white" strokeWidth="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#93C5FD',
                      letterSpacing: 0.3,
                    }}
                  >
                    Segurança da Informação · Autenticação e Controle de Acesso
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#92400E',
                      background: '#FEF3C7',
                      border: '1px solid #F59E0B',
                      borderRadius: 4,
                      padding: '2px 7px',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    EM ANÁLISE
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.6,
                  }}
                >
                  A arquitetura do New Front trata autenticação como{' '}
                  <strong style={{ color: 'white' }}>primeiro cidadão</strong> —
                  não como afterthought. Em análise:{' '}
                  <strong style={{ color: 'white' }}>
                    MFA nativo do Cognito
                  </strong>{' '}
                  com dois fatores de verificação integrados à plataforma,
                  rastreabilidade completa de acessos e controle granular de
                  permissões. Zero dependência de solução externa — segurança
                  construída dentro da arquitetura.
                </span>
              </div>
            </div>
          </div>
        </Fade>
      </div>
      <SF text="FastComm 1.6 · Arquitetura" />
    </div>
  )
}

// ─── SLIDE 10: Implementation Strategy ───────────────────────
function Slide10() {
  const principles = [
    {
      title: 'Strangler fig',
      text: 'Migra fluxo a fluxo, não cliente inteiro. Reverte um fluxo, não a migração toda.',
      color: C.sky,
    },
    {
      title: 'Shadow mode primeiro',
      text: 'Mesmo input rodando em paralelo na 1.5 e na 1.6. Compara saída antes do cutover.',
      color: C.teal,
    },
    {
      title: 'Valor a cada entrega',
      text: 'Cliente vê benefício a cada fluxo migrado. Migração vira sequência de wins.',
      color: C.amber,
    },
  ]
  const steps = [
    'Consolida Postgres em ambiente novo (vazio)',
    'Sobe ambiente multi-tenant em paralelo ao 1.5',
    'Migra primeiro fluxo do Cassems pra 1.6',
    'Shadow mode — compara saídas em paralelo',
    'Cutover do fluxo 1 e estabiliza',
    'Repete para os próximos fluxos',
    'Cassems 100% na 1.6 — desliga 1.5',
    'Onboarding do cliente 2 no ambiente maduro',
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={9} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Estratégia de implementação
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            Piloto Cassems como Design Partner — migração fluxo a fluxo, risco
            distribuído no tempo
          </p>
        </Fade>

        <Fade
          delay={0.1}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            marginTop: 18,
          }}
        >
          {principles.map(p => (
            <div
              key={p.title}
              style={{
                background: C.ice,
                borderRadius: 8,
                borderLeft: `4px solid ${p.color}`,
                padding: '14px 18px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 6px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: C.navy,
                }}
              >
                {p.title}
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: C.text,
                  lineHeight: 1.5,
                }}
              >
                {p.text}
              </p>
            </div>
          ))}
        </Fade>

        <Fade delay={0.2}>
          <h3
            style={{
              margin: '22px 0 0',
              fontSize: 17,
              fontWeight: 700,
              color: C.navy,
            }}
          >
            Sequência de implementação
          </h3>
        </Fade>

        <Fade delay={0.25}>
          <div
            style={{
              marginTop: 16,
              position: 'relative',
              paddingTop: 18,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 30,
                left: '4%',
                right: '4%',
                height: 2,
                background: C.ice,
              }}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 6,
                position: 'relative',
              }}
            >
              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{ textAlign: 'center', padding: '0 4px' }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: C.sky,
                      color: C.white,
                      fontWeight: 700,
                      fontSize: 13,
                      margin: '0 auto 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: C.text,
                      lineHeight: 1.4,
                    }}
                  >
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Fade>

        <Fade delay={0.3}>
          <div
            style={{
              background: C.navy,
              color: C.ice,
              borderRadius: 6,
              padding: '14px 18px',
              marginTop: 22,
              fontSize: 12.5,
              lineHeight: 1.6,
            }}
          >
            <span
              style={{
                color: C.sky,
                fontWeight: 700,
                letterSpacing: 2,
                fontSize: 10,
                display: 'block',
                marginBottom: 6,
              }}
            >
              CRITÉRIOS PARA O PRIMEIRO FLUXO
            </span>
            <strong style={{ color: C.white }}>Volume médio</strong> (estressa
            sem causar estrago) ·{' '}
            <strong style={{ color: C.white }}>Bem instrumentado</strong>{' '}
            (comparação antes/depois objetiva) ·{' '}
            <strong style={{ color: C.white }}>Não-crítico clinicamente</strong>{' '}
            (retaguarda, não atendimento) ·{' '}
            <strong style={{ color: C.white }}>Reversível em minutos</strong>{' '}
            (feature flag, não cirurgia)
          </div>
        </Fade>
      </div>
      <SF text="FastComm 1.6 · Implementação" />
    </div>
  )
}

// ─── SLIDE 11: Architecture Decisions ────────────────────────
function DecCard({
  title,
  sub,
  gains,
  risks,
  mits,
}: {
  title: string
  sub: string
  gains: string[]
  risks: string[]
  mits: string[]
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.ice}`,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: C.navy,
          color: C.white,
          padding: '16px 22px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12.5,
            color: C.sky,
            fontStyle: 'italic',
          }}
        >
          {sub}
        </p>
      </div>
      <div style={{ padding: '14px 22px 18px', fontSize: 12.5 }}>
        {(
          [
            { label: 'GANHOS', items: gains, color: C.teal },
            { label: 'RISCOS', items: risks, color: C.coral },
            { label: 'MITIGAÇÕES', items: mits, color: C.navy },
          ] as const
        ).map(block => (
          <div key={block.label} style={{ marginTop: 10 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                margin: '0 0 6px',
                paddingLeft: 8,
                borderLeft: `3px solid ${block.color}`,
                color: block.color,
              }}
            >
              {block.label}
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 22,
                fontSize: 12,
                lineHeight: 1.55,
                color: C.text,
              }}
            >
              {block.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function Slide11() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={10} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Decisões de arquitetura
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            Postgres consolidado e multi-tenancy — trade-offs explícitos
          </p>
        </Fade>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginTop: 18,
            flex: 1,
          }}
        >
          <Fade delay={0.1}>
            <DecCard
              title="Postgres consolidado"
              sub="3 instâncias → 1 instância, 3 schemas"
              gains={[
                'Custo de infra cai (1 HA, 1 backup, 1 tuning)',
                'Operação simplifica (um ponto de monitorar)',
                'Backup atômico dos serviços',
                'Joins cross-schema viáveis em casos pontuais',
              ]}
              risks={[
                'Blast radius maior — instância caída derruba 3 serviços',
                'Resource contention entre serviços',
                'Tentação de acoplar serviços por preguiça',
              ]}
              mits={[
                'Role Postgres por serviço, GRANT só no próprio schema',
                'pgBouncer com pools separados por usuário',
                'HA séria (read replica + failover automático)',
                'Plano de "explosão" — voltar a separar pronto desde dia 1',
              ]}
            />
          </Fade>
          <Fade delay={0.15}>
            <DecCard
              title="Multi-tenancy"
              sub="Database por tenant — modelo A"
              gains={[
                'Isolamento físico — argumento comercial e LGPD',
                'Bug de aplicação não vaza dados entre clientes',
                'DPA por cliente fica simples de defender',
                'Postgres aguenta centenas de databases sem dor',
              ]}
              risks={[
                'Onboarding manual escalaria mal',
                'Migrations precisam rodar em N databases',
                'Roteamento de conexão por tenant é nova camada',
              ]}
              mits={[
                'Onboarding automatizado desde o primeiro cliente',
                'Orquestrador de migrations multi-database',
                'Middleware de roteamento com fallback claro',
                'ClickHouse e Vector Store seguem compartilhados',
              ]}
            />
          </Fade>
        </div>
      </div>
      <SF text="FastComm 1.6 · Arquitetura" />
    </div>
  )
}

// ─── SLIDE 12: Roadmap ────────────────────────────────────────
function Slide12() {
  const phases = [
    {
      title: 'LLM Gateway',
      prazo: '2 semanas',
      desc: 'Base de governança. Sem isso, tudo acopla.',
      color: C.sky,
      n: 1,
    },
    {
      title: 'Insight do Dashboard',
      prazo: '2 semanas',
      desc: 'Escopo menor, valor visível, valida a base.',
      color: C.teal,
      n: 2,
    },
    {
      title: 'Front centralizado',
      prazo: '4 semanas',
      desc: 'Refatoração de navegação e tela de Ajuda.',
      color: C.amber,
      n: 3,
    },
    {
      title: 'RAG da Ajuda',
      prazo: '3-4 semanas',
      desc: 'Vetorização do manual e chatbot contextual.',
      color: C.coral,
      n: 4,
    },
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.white,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={11} />
      <div style={body}>
        <Fade>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 700,
              color: C.navy,
              letterSpacing: -0.5,
            }}
          >
            Roadmap de implementação
          </h1>
        </Fade>
        <Fade delay={0.05}>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: C.textMuted }}>
            Sequência sugerida — entrega de valor crescente
          </p>
        </Fade>

        <Fade
          delay={0.1}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginTop: 22,
            position: 'relative',
          }}
        >
          {phases.map(p => (
            <div
              key={p.title}
              style={{
                background: C.white,
                border: `1px solid ${C.ice}`,
                borderRadius: 8,
                padding: '16px 18px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 4px',
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.navy,
                }}
              >
                {p.title}
              </h4>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: p.color,
                }}
              >
                {p.prazo}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: C.textMuted,
                  lineHeight: 1.5,
                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </Fade>

        {/* Timeline markers */}
        <Fade
          delay={0.2}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            alignItems: 'center',
            marginTop: 14,
          }}
        >
          {phases.map(p => (
            <div key={p.n} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: p.color,
                  color: C.white,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {p.n}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.textMuted,
                  marginTop: 6,
                }}
              >
                Mês {p.n}
              </div>
            </div>
          ))}
        </Fade>

        <Fade delay={0.3}>
          <div
            style={{
              background: C.navy,
              color: C.ice,
              borderRadius: 6,
              padding: '16px 22px',
              marginTop: 26,
              fontSize: 12.5,
              lineHeight: 1.6,
            }}
          >
            <span
              style={{
                display: 'block',
                color: C.sky,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              OBSERVAÇÃO
            </span>
            As fases 1 e 2 podem rodar em paralelo às frentes de produto que
            ainda estão em andamento (Mapeamento de Features e Planejamento
            1.6). O bloqueio dessas frentes não impede o início do trabalho
            técnico de plataforma de IA.
          </div>
        </Fade>
      </div>
      <SF text="FastComm 1.6 · Direção" />
    </div>
  )
}

// ─── SLIDE 13: Required Decisions ────────────────────────────
function Slide13() {
  const decisions = [
    {
      n: '01',
      t: 'Aprovar ferramenta de telemetria',
      d: 'PostHog, Mixpanel ou similar — para destravar features não usadas e priorização baseada em dado real.',
    },
    {
      n: '02',
      t: 'Confirmar o provider de LLM',
      d: 'Anthropic é a recomendação técnica. Decisão depende do jurídico (LGPD) e do que já está contratado.',
    },
    {
      n: '03',
      t: 'Aprovar a remoção de módulos',
      d: 'Visualizador Clínico, Barramento, Marketplace e Meus produtos saem do core. Validar com comercial e CS antes.',
    },
    {
      n: '04',
      t: 'Definir os 5 clientes do Design Partner Program',
      d: 'Co-criação das features avançadas de FHIR, RAG e insight — alinha o produto com uso real.',
    },
  ]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.navy,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={12} dark />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 14,
          height: '100%',
          background: C.sky,
        }}
      />
      <div style={body}>
        <Fade>
          <div
            style={{
              color: C.sky,
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 6,
            }}
          >
            DECISÕES NECESSÁRIAS
          </div>
        </Fade>
        <Fade delay={0.1}>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: C.white,
              margin: '8px 0 0',
              letterSpacing: -0.5,
              lineHeight: 1.1,
            }}
          >
            O que destrava o planejamento
          </h1>
        </Fade>

        <div style={{ marginTop: 36 }}>
          {decisions.map((d, i) => (
            <Fade key={d.n} delay={0.15 + i * 0.08}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1fr',
                  gap: 8,
                  alignItems: 'start',
                  marginBottom: 22,
                }}
              >
                <div
                  style={{
                    color: C.sky,
                    fontSize: 32,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {d.n}
                </div>
                <div>
                  <p
                    style={{
                      color: C.white,
                      fontSize: 17,
                      fontWeight: 700,
                      margin: '0 0 4px',
                    }}
                  >
                    {d.t}
                  </p>
                  <p
                    style={{
                      color: C.ice,
                      fontSize: 12.5,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {d.d}
                  </p>
                </div>
              </div>
            </Fade>
          ))}
        </div>
      </div>
      <SF text="FastComm 1.6 · Decisões" dark />
    </div>
  )
}

// ─── SLIDE 14: Closing ────────────────────────────────────────
function Slide14() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: C.navy,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SN n={13} dark />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 14,
          height: '100%',
          background: C.sky,
        }}
      />
      <div style={body}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Fade>
            <h1
              style={{
                color: C.white,
                fontSize: 88,
                fontWeight: 700,
                margin: 0,
                letterSpacing: -2,
              }}
            >
              Obrigado
            </h1>
          </Fade>
          <Fade delay={0.1}>
            <div
              style={{
                width: 60,
                height: 4,
                background: C.sky,
                margin: '28px 0 22px',
              }}
            />
          </Fade>
          <Fade delay={0.2}>
            <p style={{ color: C.ice, fontSize: 18, margin: '0 0 6px' }}>
              Diagnóstico técnico fechado. Direção desenhada. Decisões
              pendentes acima.
            </p>
          </Fade>
          <Fade delay={0.3}>
            <p
              style={{
                color: C.sky,
                fontStyle: 'italic',
                fontSize: 14,
                margin: 0,
              }}
            >
              Próximo encontro: alinhar prioridades das frentes 1 e 2 do
              roadmap.
            </p>
          </Fade>
        </div>
      </div>
    </div>
  )
}

// ─── Slides registry ──────────────────────────────────────────
export const slides: { title: string; component: () => JSX.Element }[] = [
  { title: 'Capa', component: Slide01 },
  { title: 'Sumário executivo', component: Slide02 },
  { title: 'Status por workstream', component: Slide03 },
  { title: 'Diagnóstico técnico', component: Slide04 },
  { title: 'Frentes em andamento', component: Slide05 },
  { title: 'Direção proposta', component: Slide06 },
  { title: 'Arquitetura de IA', component: Slide07 },
  { title: 'Arquitetura alvo 1.6', component: Slide09 },
  { title: 'Estratégia de implementação', component: Slide10 },
  { title: 'Decisões de arquitetura', component: Slide11 },
  { title: 'Roadmap', component: Slide12 },
  { title: 'Decisões necessárias', component: Slide13 },
  { title: 'Encerramento', component: Slide14 },
]
