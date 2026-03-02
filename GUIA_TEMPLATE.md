# 📋 Guia do Template de Fechamento Fastcomm

Este guia explica como usar o `template_fechamento.html` para criar novos relatórios mantendo a identidade visual padronizada.

---

## 🚀 Como criar um novo relatório

### 1. Duplique o template
```
Copie template_fechamento.html → Fechamento_Fastcomm_[MÊS].html
```
Exemplo: `Fechamento_Fastcomm_Marco.html`

### 2. Busque os marcadores `✏️ EDITAR`
Use **Ctrl+F** e pesquise por `✏️ EDITAR` — cada marcador indica um ponto que **precisa ser atualizado** a cada período.

---

## 📝 O que editar em cada seção

| # | Seção | O que atualizar |
|---|-------|-----------------|
| 1 | **Título** | `<title>` e `<h1>` — trocar `[MÊS]` pelo mês atual |
| 2 | **Desempenho** | Tabela de horas (meses, horas AWS, horas Fastcomm), percentuais |
| 3 | **Custos** | Horas totais AWS, valor hora, cálculos de economia |
| 4 | **Entregas** | Adicionar/remover linhas `<tr>` por mês. Ver seção abaixo |
| 5 | **Programação** | Atualizar as tarefas da semana |

---

## ➕ Como adicionar uma entrega

Copie o bloco abaixo dentro do `<tbody>` da tabela do mês correspondente:

### Entrega simples (sem imagem)
```html
<tr>
    <td>[NÚMERO]</td>
    <td><span class="entry-icon icon-feature"><i class="fa-solid fa-lightbulb"></i></span>
        [Feature] Descrição da entrega</td>
</tr>
```

### Entrega com imagem
```html
<tr>
    <td>[NÚMERO]</td>
    <td><span class="entry-icon icon-feature"><i class="fa-solid fa-lightbulb"></i></span>
        [Feature] Descrição da entrega
        <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
            <p style="font-size: 12px; color: #666; margin: 0 0 8px 0;">
                <i class="fa-solid fa-image" style="margin-right: 4px;"></i> Legenda da imagem:</p>
            <img src="img_nome_da_imagem.png"
                alt="Descrição da imagem"
                style="max-width: 480px; width: 100%; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        </div>
    </td>
</tr>
```

### Ícones por tipo de entrega

| Tipo | Classe CSS | Ícone |
|------|-----------|-------|
| 🐛 Bug | `icon-bug` | `fa-solid fa-bug` |
| 💡 Feature | `icon-feature` | `fa-solid fa-lightbulb` |
| 🔧 Débito técnico | `icon-debito` | `fa-solid fa-wrench` |
| 📊 Observabilidade | `icon-obs` | `fa-solid fa-chart-line` |
| ⚙️ Engenharia | `icon-eng` | `fa-solid fa-gears` |
| 🛡️ Segurança | `icon-security` | `fa-solid fa-shield-halved` |
| ☁️ AWS | *(sem classe)* | `<img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg">` |

---

## 📊 Como atualizar os gráficos (Chart.js)

Os gráficos usam Chart.js e estão dentro de tags `<script>`. Para atualizar os dados:

### Gráfico de Comparativo por Serviço
Procure por `chartServicos` e atualize os arrays `data` nos `datasets`:
```javascript
data: [431.24, 117.86, ...],  // ← Valores do mês anterior (ANTES)
data: [232.38, 0.36, ...],    // ← Valores do mês atual (DEPOIS)
```

### Gráfico de Projeção HML
Procure por `chartProjecao` e atualize os arrays:
```javascript
const baseline = Array(14).fill(2293.92);      // ← Custo baseline
const otimizado = [2293.92, 2050, 1800, ...];  // ← Valores reais + projeção
```

### Gráfico RDS Office Hours
Procure por `chartRDSEconomia` e atualize:
```javascript
data: [186.90, 108.90],  // ← [custo ANTES, custo DEPOIS]
```

---

## 🎨 Paleta de Cores (Design System)

| Uso | Cor | Hex |
|-----|-----|-----|
| Títulos / Links | Azul | `#0056b3` |
| Sucesso / Economia | Verde | `#28a745` |
| Erro / Bug / Alerta | Vermelho | `#dc3545` |
| Entregas / AWS accent | Laranja | `#ff9900` |
| AWS dark | Escuro | `#232f3e` |
| Roadmap | Roxo | `#6f42c1` |
| Programação | Ciano | `#17a2b8` |
| Engenharia | Violeta | `#6f42c1` |

---

## 📁 Convenção de nomes

| Tipo | Formato | Exemplo |
|------|---------|---------|
| Relatório | `Fechamento_Fastcomm_[Mês].html` | `Fechamento_Fastcomm_Marco.html` |
| Imagens | `img_[descricao].png` | `img_dashboard_custos.png` |
| Tamanho de imagem | `max-width: 480px; width: 100%` | Padrão para todas |

---

## ✅ Checklist para novo relatório

- [ ] Copiar `template_fechamento.html` com novo nome
- [ ] Atualizar `<title>` e `<h1>` com o mês
- [ ] Preencher tabela de desempenho (horas)
- [ ] Atualizar percentuais de distribuição
- [ ] Atualizar custos e comparativos
- [ ] Adicionar entregas do período com ícones corretos
- [ ] Adicionar imagens (salvar como `img_*.png` na mesma pasta)
- [ ] Atualizar dados dos gráficos Chart.js
- [ ] Atualizar programação da semana
- [ ] Revisar todos os cálculos
- [ ] Testar no browser antes de publicar
- [ ] `git add . && git commit -m "Fechamento [Mês]" && git push`
