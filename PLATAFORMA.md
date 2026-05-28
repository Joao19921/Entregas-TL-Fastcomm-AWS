# RoadMap Fastcomm — Documentação da Plataforma
**Versão:** 1.0 · **Data de entrega:** Maio 2026  
**Responsável técnico:** Claude Sonnet (Anthropic) via CTC Tech

---

## 1. Visão Geral

Plataforma web de gestão de roadmap de produto, construída com arquitetura moderna e segura. Permite criar backlogs, vincular tasks com estimativas de horas, visualizar o roadmap em timeline de Gantt com navegação por semanas, controle de acesso por perfil (Master/Viewer) e persistência de dados em nuvem.

---

## 2. Links de Acesso

| Ambiente | URL |
|---|---|
| **Aplicação (produção)** | https://joao19921.github.io/Entregas-TL-Fastcomm-AWS/ |
| **Repositório GitHub** | https://github.com/Joao19921/Entregas-TL-Fastcomm-AWS |
| **CI/CD — GitHub Actions** | https://github.com/Joao19921/Entregas-TL-Fastcomm-AWS/actions |
| **Banco de dados — Supabase** | https://app.supabase.com/project/zlunpymdfgwziertagqh |
| **Backups automáticos** | https://github.com/Joao19921/Entregas-TL-Fastcomm-AWS/tree/main/backups |

---

## 3. Credenciais de Acesso

### 3.1 Usuário Master (administrador)
| Campo | Valor |
|---|---|
| **Usuário** | `RoadMap2026` |
| **Senha** | `FastC@mm2026!` |
| **Perfil** | Master — acesso total |
| **E-mail interno** | `roadmap2026@fastcomm.internal` |

> ⚠️ **Recomendado:** Trocar a senha após o primeiro acesso.  
> Acesse: Supabase Dashboard → Authentication → Users.

### 3.2 Acesso de Visualização (público)
Qualquer pessoa com o link abaixo acessa o roadmap em modo leitura, sem necessidade de login:

**Link de visualização:** https://joao19921.github.io/Entregas-TL-Fastcomm-AWS/

O sistema detecta visitantes não autenticados automaticamente e exibe o banner "Modo visualização — somente leitura".

### 3.3 GitHub
| Campo | Valor |
|---|---|
| **Usuário GitHub** | `Joao19921` |
| **Repositório** | `Entregas-TL-Fastcomm-AWS` |
| **Branch principal** | `main` |

---

## 4. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| **Frontend** | React + TypeScript | 18 / 5.x |
| **Build** | Vite | 5.4 |
| **CSS** | Tailwind CSS | 3.x |
| **Animações** | Framer Motion | 11.x |
| **Ícones** | Lucide React | — |
| **Backend/BD** | Supabase (PostgreSQL) | v2 |
| **Autenticação** | Supabase Auth (JWT) | — |
| **Hosting** | GitHub Pages | — |
| **CI/CD** | GitHub Actions | — |
| **Linguagem** | TypeScript | 5.x |

---

## 5. Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   GitHub Pages                      │
│           (CDN estático — React SPA)                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              Supabase (BaaS)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ PostgreSQL  │  │  Supabase    │  │    RLS    │  │
│  │  (banco)    │  │    Auth      │  │ (policies)│  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────┘
                       │ push/merge
┌──────────────────────▼──────────────────────────────┐
│               GitHub Actions                        │
│   npm install → npm test → npm build → deploy       │
└─────────────────────────────────────────────────────┘
```

---

## 6. Banco de Dados — Schema

### Tabela `backlogs`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | text (PK) | Identificador único |
| `name` | text | Nome do backlog |
| `scope` | text | Análise / escopo |
| `priority` | text | Alta / Média / Baixa |
| `status` | text | Backlog / Em progresso / Analisa / Concluído / Bloqueado |
| `external_dep` | boolean | Possui dependência externa |
| `dep_notes` | text | Observação sobre a dependência |
| `expanded` | boolean | Estado de expansão na UI |
| `position` | integer | Ordem na lista |
| `start_date` | date | Data de início |
| `created_at` | timestamptz | Data de criação |

### Tabela `tasks`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | text (PK) | Identificador único |
| `backlog_id` | text (FK) | Referência ao backlog |
| `name` | text | Nome da task |
| `owner` | text | Responsável |
| `days` | numeric | Estimativa em horas |
| `status` | text | Status da task |
| `notes` | text | Observações |
| `position` | integer | Ordem na lista |
| `created_at` | timestamptz | Data de criação |

### Tabela `profiles`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid (PK, FK auth.users) | ID do usuário Supabase |
| `email` | text | E-mail |
| `full_name` | text | Nome completo |
| `role` | text | `master` ou `viewer` |
| `created_at` | timestamptz | Data de criação |

### Tabela `audit_logs`
| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | bigserial (PK) | ID sequencial |
| `user_id` | uuid (FK) | Usuário que executou a ação |
| `user_email` | text | E-mail do usuário |
| `action` | text | INSERT / UPDATE / DELETE |
| `table_name` | text | Tabela afetada |
| `record_id` | text | ID do registro afetado |
| `payload` | jsonb | Dados da alteração |
| `created_at` | timestamptz | Data/hora da ação |

---

## 7. Segurança — Autenticação e Autorização

### 7.1 Modelo de Autenticação
- **Provider:** Supabase Auth com e-mail e senha
- **Sessão:** JWT gerenciado pelo Supabase com auto-refresh
- **Persistência:** localStorage (gerenciado pelo SDK)
- **Fluxo:** Login → JWT → perfil carregado do banco → role aplicada na UI

### 7.2 Perfis (RBAC)

| Ação | Master | Viewer (público) |
|---|---|---|
| Visualizar backlogs e tasks | ✅ | ✅ |
| Criar backlog | ✅ | ❌ |
| Editar backlog | ✅ | ❌ |
| Excluir backlog | ✅ | ❌ |
| Criar task | ✅ | ❌ |
| Editar task | ✅ | ❌ |
| Excluir task | ✅ | ❌ |
| Alterar status/prioridade | ✅ | ❌ |
| Exportar dados | ✅ | ❌ |
| Importar dados | ✅ | ❌ |
| Ver audit log (Supabase) | ✅ | ❌ |

### 7.3 Row Level Security (RLS) — Supabase
- `backlogs` e `tasks`: **leitura pública**, escrita exige `role = master` autenticado
- `profiles`: usuário vê apenas o próprio perfil; masters veem todos
- `audit_logs`: somente masters autenticados podem ler; inserção exige autenticação

### 7.4 Como criar novos usuários
1. Acesse: **Supabase Dashboard** → Authentication → Users → Add user
2. Informe e-mail e senha
3. Execute o SQL abaixo para definir o perfil:

```sql
-- Promover a master:
update profiles set role = 'master' where email = 'novo@email.com';

-- Manter como viewer (padrão):
update profiles set role = 'viewer' where email = 'novo@email.com';
```

---

## 8. Deploy e CI/CD

### 8.1 Fluxo automático
```
Push para main
    ↓
GitHub Actions (.github/workflows/pages.yml)
    ↓
npm install → npm test → npm run build
    ↓
Copia dist/ para raiz do repo (index.html + assets/)
    ↓
Commit "deploy: build React [skip ci]"
    ↓
GitHub Pages publica automaticamente
```

**Tempo médio de deploy:** 30–60 segundos após o push.

### 8.2 Deploy manual
```bash
npm run build
# copia dist/assets → ./assets e dist/index.html → ./index.html
git add index.html assets/
git commit -m "deploy: build manual"
git push origin main
```

### 8.3 Variáveis de ambiente (GitHub Secrets)
| Secret | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anon do Supabase |

---

## 9. Backup Automático

### Workflow: `.github/workflows/backup.yml`
- **Frequência:** Toda segunda-feira às 03h (horário de Brasília)
- **Disparo manual:** GitHub Actions → Backup Semanal Supabase → Run workflow
- **Formato:** JSON com backlogs + tasks aninhadas
- **Local:** `/backups/YYYY-MM-DD.json` no repositório
- **Retenção:** Últimos 12 backups (3 meses)

### Como restaurar um backup
1. Acesse: https://github.com/Joao19921/Entregas-TL-Fastcomm-AWS/tree/main/backups
2. Baixe o arquivo `.json` desejado
3. Na plataforma, faça login como Master
4. Clique em **Importar** e selecione o arquivo

---

## 10. Funcionalidades da Plataforma

### 10.1 View de Lista
- Criar/editar/excluir backlogs com nome, análise/escopo, prioridade, status, data de início
- Entrega estimada calculada automaticamente (horas ÷ 8h/dia)
- Dependência externa: marca o backlog em amarelo e abre campo de observação
- Tasks vinculadas ao backlog com responsável, estimativa em horas, status, observações
- Total de horas por backlog calculado automaticamente
- Barra de progresso baseada nas tasks com status "Concluído"

### 10.2 View de Timeline (Gantt)
- Janela de 3 semanas navegável com botões **Anterior / Próximo**
- Dias individuais: úteis (branco) e fins de semana (cinza)
- Linha vermelha indicando o dia atual
- Barras coloridas por status de cada backlog
- Botão **Hoje** quando o dia atual não está na janela visível
- Swimlanes por prioridade: Alta / Média / Baixa
- Legenda de status no rodapé

### 10.3 Exportar / Importar
- Exportar: baixa `roadmap-fastcomm.json` com todos os dados
- Importar: carrega arquivo JSON e sincroniza com o Supabase (upsert)

---

## 11. Estrutura de Arquivos

```
src/
├── App.tsx                  — Gate de autenticação e roteamento
├── Roadmap.tsx              — Componente principal (lista + timeline)
├── auth/
│   ├── AuthContext.tsx      — Context de auth + RBAC + audit log
│   └── LoginPage.tsx        — Tela de login corporativa
├── lib/
│   └── supabase.ts          — Cliente Supabase configurado
├── assets/
│   └── logo-fastcomm.png   — Logo da marca
└── vite-env.d.ts            — Tipos de ambiente Vite

.github/workflows/
├── pages.yml                — CI/CD deploy automático
└── backup.yml               — Backup semanal Supabase

backups/                     — Backups automáticos em JSON
CLAUDE.md                    — Configuração do agente de desenvolvimento
PLATAFORMA.md                — Este documento
```

---

## 12. Recomendações de Segurança e Evolução

### Imediatas
- [ ] Trocar a senha do usuário master após o primeiro acesso
- [ ] Criar usuários individuais para cada membro da equipe (não compartilhar credenciais)
- [ ] Ativar 2FA no GitHub e Supabase

### Curto prazo
- [ ] Adicionar página de gerenciamento de usuários (criar/desativar contas)
- [ ] Configurar alertas de sessão expirada com mensagem amigável
- [ ] Implementar MFA (Supabase já suporta via TOTP)

### Médio prazo
- [ ] Dashboard de auditoria — visualizar `audit_logs` na própria plataforma
- [ ] Notificações (ex: e-mail quando backlog é bloqueado)
- [ ] Histórico de alterações por backlog
- [ ] Integração com Slack/Teams para atualizações

### Infraestrutura
- Considerar migrar para **Supabase Pro ($25/mês)** para eliminar pausa automática por inatividade
- O plano gratuito pausa projetos após 1 semana sem acesso — dados preservados, mas requer reativação manual

---

## 13. Suporte e Manutenção

| Item | Ação |
|---|---|
| **App não carrega** | Verificar status em: https://github.com/Joao19921/Entregas-TL-Fastcomm-AWS/actions |
| **Banco pausado** | Acessar https://app.supabase.com/project/zlunpymdfgwziertagqh → Restore project |
| **Senha perdida** | Supabase Dashboard → Authentication → Users → Reset password |
| **Novo usuário** | Supabase Dashboard → Authentication → Users → Add user + SQL de role |
| **Restaurar dados** | Importar backup de `/backups/` pela própria plataforma |
| **Novo deploy** | `git push origin main` no repositório — automático em ~30s |

---

*Documento gerado automaticamente · RoadMap Fastcomm v1.0 · Maio 2026*
