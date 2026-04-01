# 08 — Mobile First

O Arcaika é projetado **primariamente para mobile**. A maioria dos usuários de marketplace de serviços acessa via smartphone. Todo componente é especificado no breakpoint menor primeiro e expandido para breakpoints maiores.

---

## Breakpoints

| Nome | Breakpoint | Prefixo Tailwind | Dispositivos-alvo |
|---|---|---|---|
| **mobile** | 0 — 639px | (sem prefixo, base) | Smartphones |
| **tablet** | 640px — 1023px | `sm:` | Tablets, smartphones grandes |
| **desktop** | 1024px+ | `lg:` | Notebooks e desktops |
| **wide** | 1280px+ | `xl:` | Monitores amplos |

**Nota:** o breakpoint `md:` (768px) é evitado intencionalmente para simplificar — o design trabalha com apenas 3 zonas: mobile, tablet/intermediário (`sm:`), desktop (`lg:`).

---

## Navegação

### Mobile — Bottom Navigation Bar

Componente: `BottomNav` (`src/components/layout/BottomNav.tsx`)

Barra fixa no fundo da tela com 5 destinos:

| Ícone | Label | Rota | Badge |
|---|---|---|---|
| 🏠 Home | "Início" | `/` | — |
| 🛒 Marketplace | "Serviços" | `/marketplace` | — |
| 🛍 Carrinho | "Carrinho" | `/carrinho` | Número de itens (laranja) |
| 📋 Pedidos | "Pedidos" | `/pedidos` | — |
| 👤 Conta | "Conta" | `/conta/perfil` | — |

**Especificações:**
- Altura: 64px + safe-area-inset-bottom (para iPhones com notch)
- Fundo: branco `#FFFFFF`, sombra `shadow-[0_-1px_0_0_#E5E7EB]` (linha sutil no topo)
- Item ativo: ícone e texto em laranja `#F97316`
- Item inativo: ícone e texto em cinza `#6B7280`
- Touch target de cada item: ocupa 1/5 da largura, altura total da barra (≥ 44px)
- `position: fixed; bottom: 0; left: 0; right: 0; z-index: 40`

**Visibilidade:**
- Visível em todas as páginas mobile, exceto:
  - `/checkout` (wizard — sem distração)
  - `/auth/*` (páginas de autenticação)
  - Quando o drawer/modal ocupa tela cheia

**Comportamento ao navegar:** o item ativo é destacado. O scroll da página volta ao topo ao clicar no item já ativo (comportamento nativo de iOS/Android).

---

### Desktop — Top Navigation Bar (TopBar)

Componente: `TopBar` (`src/components/layout/TopBar.tsx`)

Barra horizontal fixa no topo, altura 64px, fundo branco, sombra `shadow-sm`.

**Estrutura (da esquerda para a direita):**

```
[Logo Arcaika]   [Campo de busca — ocupa espaço central]   [Ícones de ação]
```

**Ícones de ação (direita):**
- Ícone de carrinho com badge de count
- Avatar do usuário (foto ou inicial do nome) + dropdown com links de conta

**Campo de busca desktop:** presente na TopBar em todas as páginas exceto na página de busca (onde seria redundante). Ao focar, expande levemente e exibe histórico de buscas recentes (sessionStorage).

**Navegação secundária:** abaixo da TopBar, em algumas páginas, aparece uma `SubNav` com tabs (ex: no `/pedidos`: "Todos | Em andamento | Concluídos | Cancelados").

---

## Sticky Header com Hide-on-Scroll

**Desktop:** a TopBar é sempre visível (sticky top-0). Não oculta.

**Mobile:** a TopBar (versão compacta, apenas logo + ícones) oculta ao rolar para baixo e reaparece ao rolar para cima.

Implementação via `useScrollDirection`:
```
// Estado: 'up' | 'down' | 'top'
// Ao scroll down: translateY(-64px) com transition 300ms
// Ao scroll up ou top: translateY(0) com transition 300ms
```

O `BottomNav` é sempre visível e não afetado pelo scroll.

---

## Layout de Página

### Mobile (`< 640px`)

```
[TopBar compacta — logo + busca + ícones]  ← sticky, oculta no scroll down
[Conteúdo da página]                        ← padding-bottom: 80px (espaço para BottomNav)
[BottomNav]                                 ← fixed bottom-0
[ArkyButton FAB]                            ← fixed bottom-20 right-4 (acima da BottomNav)
```

O `padding-bottom` do conteúdo evita que a BottomNav cubra o último elemento.

### Desktop (`>= 1024px`)

```
[TopBar completa — logo + busca + nav + conta]  ← sticky top-0
[Conteúdo da página — max-width: 1280px, centrado]
```

Sem BottomNav. O ArkyButton FAB fica em `bottom-8 right-8`.

---

## Gestos (Mobile)

### Swipe para fechar drawers

Drawers (filtros do marketplace, ArkyDrawer, menu mobile) podem ser fechados com swipe horizontal:
- Limiar de disparo: 80px de deslocamento horizontal
- Velocity mínima: 0.3 (swipe rápido fecha mesmo sem atingir o limiar de distância)
- Feedback visual: o drawer segue o dedo durante o gesto

Implementação via `useDrag` do `react-use-gesture` ou eventos touch nativos.

### Pull-to-refresh em listas

As páginas `/pedidos`, `/cotacoes` e `/carrinho` suportam pull-to-refresh:
- O usuário puxa a lista para baixo quando está no topo (scroll position = 0)
- Um indicador de loading aparece acima da lista
- Ao soltar, invalida o cache e refaz o fetch

Implementação: detectar `touchstart` com `scrollTop === 0` e `touchmove` com delta Y positivo maior que 60px.

---

## Touch Targets

**Regra mínima:** todos os elementos interativos (botões, links, checkboxes, radio, toggles) devem ter área de toque de **no mínimo 44x44px**.

**Implementação:**
- Botões: altura mínima definida via classe `min-h-[44px]` em mobile
- Links de texto: padding vertical `py-2` para ampliar a área clicável
- Checkboxes e radios: label wrapper clicável que envolve o input (não apenas o ícone)
- Ícones de ação pequenos (ex: remover item): envolver em `<button className="p-2">` para ampliar a área

**Espaçamento entre targets:** mínimo 8px entre elementos clicáveis adjacentes para evitar cliques acidentais.

---

## Teclado Virtual no Mobile

Quando o teclado virtual abre em um input, o viewport é redimensionado (em alguns browsers) ou o conteúdo é empurrado. Situações a tratar:

| Situação | Solução |
|---|---|
| Input no final da tela coberto pelo teclado | `scrollIntoView({ behavior: 'smooth', block: 'center' })` no `onFocus` do input |
| BottomNav cobre o input do chat da Arky | O ArkyDrawer tem `position: fixed` e altura calculada com `dvh` (dynamic viewport height) |
| Wizard com formulário no último step | Step container com `overflow-y: auto` e padding-bottom suficiente |
| Campo de busca na TopBar | TopBar sobe junto com o teclado (comportamento padrão de `position: sticky`) |

**Meta viewport:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

`viewport-fit=cover` garante que o conteúdo chegue até a notch do iPhone, enquanto padding com `safe-area-inset-*` protege o conteúdo interativo.

---

## Adaptações específicas de componentes

### `FilterSidebar` → `FilterDrawer`

- **Desktop:** sidebar fixa à esquerda (240px), filtros sempre visíveis
- **Mobile:** botão "Filtrar" no topo → abre `FilterDrawer` como sheet que sobe da base (altura 85vh), com overlay escurecido atrás

### `ServiceCard`

- **Mobile:** card horizontal (imagem 96x96px à esquerda, conteúdo à direita), largura 100%
- **Tablet:** grid 2 colunas de cards verticais
- **Desktop:** grid 3 ou 4 colunas de cards verticais

### Calendário de Agendamento

- **Mobile:** usa `<input type="date">` nativo (seletor do sistema operacional, melhor UX no touch)
- **Desktop:** componente de calendário visual customizado

### Galeria de Imagens (detalhe de serviço)

- **Mobile:** carrossel swipeable (desliza com o dedo), indicadores de ponto abaixo
- **Desktop:** grade de thumbnails à esquerda, imagem principal à direita; clique muda a principal

---

## Configuração PWA (Fase 2)

Para que o app possa ser "instalado" na tela inicial do celular:

```json
// public/manifest.json
{
  "name": "Arcaika",
  "short_name": "Arcaika",
  "theme_color": "#F97316",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

O ícone do app deve ser o logo Arcaika em fundo laranja, legível em 192x192px.
