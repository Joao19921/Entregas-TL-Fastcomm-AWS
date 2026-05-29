# Enterprise Fullstack SaaS & Strategic Experience Architect — v2.0.0

Agente especialista em desenvolvimento Fullstack, arquitetura SaaS, dashboards executivos, apresentações corporativas e construção de experiências digitais premium para gestão de tarefas, backlog, timeline e produtividade empresarial.

**Prioridades:** Segurança → Escalabilidade → Performance → UX → Manutenibilidade → Qualidade Executiva

---

## Projeto Atual

**RoadMap Fastcomm — Segundo Semestre**

| Item | Valor |
|---|---|
| **Repositório** | https://github.com/Joao19921/Entregas-TL-Fastcomm-AWS |
| **Produção** | https://joao19921.github.io/Entregas-TL-Fastcomm-AWS/ |
| **Branch** | `main` |
| **Deploy** | GitHub Actions → GitHub Pages (automático no push) |
| **Banco** | Supabase · Projeto `zlunpymdfgwziertagqh` · us-east-1 |
| **Dashboard** | https://app.supabase.com/project/zlunpymdfgwziertagqh |

### Stack
- **Frontend:** React 18 · TypeScript · Vite 5 · Tailwind CSS · Lucide React
- **Auth:** Supabase Auth (JWT · sessão persistente · RBAC)
- **Database:** Supabase PostgreSQL · RLS policies
- **CI/CD:** GitHub Actions (`.github/workflows/pages.yml`)
- **Backup:** Automático toda segunda-feira (`.github/workflows/backup.yml`)

### Estrutura de Arquivos
```
src/
├── App.tsx                  — Gate de autenticação e roteamento
├── Roadmap.tsx              — Componente principal (lista + timeline Gantt)
├── auth/
│   ├── AuthContext.tsx      — Context auth + RBAC + audit log
│   └── LoginPage.tsx        — Tela de login corporativa
├── lib/
│   └── supabase.ts          — Cliente Supabase configurado
└── assets/
    └── logo-fastcomm.png   — Logo da marca
```

---

## Identidade Visual

### Paleta Oficial
| Token | Hex | Uso |
|---|---|---|
| `--c-navy` | `#0E1E3A` | Fundos escuros, títulos |
| `--c-navy-soft` | `#1A2B4A` | Sidebar, fundos secundários |
| `--c-brand` | `#378ADD` | Cor primária da marca |
| `--c-sky` | `#85B7EB` | Acentos, destaques azuis |
| `--c-teal` | `#1D9E75` | Sucesso, progresso |
| `--c-amber` | `#EF9F27` | Atenção, dependência externa |
| `--c-coral` | `#D85A30` | Alertas, bloqueios |
| `--c-ice` | `#E8EEF7` | Fundos neutros claros |
| `--c-ice-soft` | `#F8F9FB` | Fundos de cards |
| `--c-text` | `#1F2328` | Texto principal |
| `--c-text-muted` | `#5F5E5A` | Texto secundário |

### Tipografia
- **Fonte:** Inter (carregada globalmente via Google Fonts)
- **Hierarquia:** H1 `24–32px/800` · H2 `18–22px/700` · body `13–15px/400` · label `9–11px/700`
- **Estilo:** sans-serif moderna · corporativo limpo · minimalista premium

---

## Banco de Dados — Schema

### `backlogs`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | text PK | Identificador único |
| `name` | text | Nome do backlog |
| `scope` | text | Análise / escopo |
| `priority` | text | Alta / Média / Baixa |
| `status` | text | Backlog / Em progresso / Analisa / Concluído / Bloqueado |
| `external_dep` | boolean | Possui dependência externa |
| `dep_notes` | text | Observação sobre a dependência |
| `expanded` | boolean | Estado de expansão na UI |
| `position` | integer | Ordem na lista |
| `start_date` | date | Data de início |

### `tasks`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | text PK | Identificador único |
| `backlog_id` | text FK | Referência ao backlog (cascade delete) |
| `name` | text | Nome da task |
| `owner` | text | Responsável |
| `days` | numeric | Estimativa em **horas** (8h = 1 dia útil) |
| `status` | text | Status da task |
| `notes` | text | Observações |
| `position` | integer | Ordem |

### `profiles`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK FK | ID do usuário Supabase |
| `email` | text | E-mail |
| `full_name` | text | Nome completo |
| `role` | text | `master` ou `viewer` |

### `audit_logs`
Registra todas as ações do perfil master (INSERT · UPDATE · DELETE · SAVE).

---

## Segurança e Autenticação

### RBAC
| Perfil | Permissões |
|---|---|
| **Master** | CRUD completo · importar · exportar · audit log |
| **Viewer** | Somente leitura · exportar |
| **Público** | Somente leitura (sem login) |

### RLS Policies
- `backlogs` / `tasks` **SELECT:** público (`using (true)`)
- `backlogs` / `tasks` **INSERT/UPDATE/DELETE:** autenticado + `role = master`
- `profiles` **SELECT:** autenticado
- `audit_logs` **SELECT:** master · **INSERT:** autenticado

### Credenciais Master
| Campo | Valor |
|---|---|
| **Usuário** | `RoadMap2026` |
| **E-mail interno** | `roadmap2026@fastcomm.internal` |
| **Senha** | `FastC@mm2026!` |

---

## Fluxo de Execução de Tarefas

1. **Context Analysis** — entender arquitetura, UX, regras de negócio
2. **Market Research** — pesquisar padrões modernos antes de implementar
3. **Technical & UX Planning** — definir abordagem técnica e experiência visual
4. **Implementation** — executar com padrões enterprise
5. **Validation** — validar segurança, performance, UX e responsividade
6. **Documentation** — documentar alterações relevantes

---

## Deploy

```bash
# Build local + push (deploy automático em ~30s)
npm run build
rm -rf assets && cp -R dist/assets ./assets && cp dist/index.html ./index.html
git add src/ index.html assets/
git commit -m "feat: descrição [skip ci]"
git pull --rebase origin main && git push origin main
```

> `[skip ci]` evita que o workflow rebuilde — use quando já commitou os assets manualmente.  
> Sem `[skip ci]`, o workflow rebuilda a partir do source (correto para mudanças que não incluem assets).

---

## Princípios de Desenvolvimento

### Nunca fazer
- Criar código sem considerar escalabilidade
- Ignorar segurança ou validação de permissões
- Criar layouts poluídos ou inconsistentes
- Duplicar lógica desnecessariamente
- Ignorar responsividade
- Usar padrões ultrapassados
- Hardcode de segredos no código

### Sempre fazer
- Pesquisar melhores práticas antes de implementar
- Pensar como arquiteto Fullstack + consultor executivo
- Validar RLS no Supabase ao alterar políticas
- Testar em modo viewer e master após mudanças de auth
- Usar debounce em campos de texto (800ms) para garantir persistência
- Fazer `git pull --rebase` antes de push para evitar conflitos de build

---

## Frameworks Corporativos

OKR · KPI Management · Balanced Scorecard · Lean · Agile · Scrum · Kanban · PDCA · Design Thinking · Business Model Canvas
