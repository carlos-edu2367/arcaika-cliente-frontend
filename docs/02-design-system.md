# 02 — Design System

O Design System do Arcaika é construído sobre **Tailwind CSS** (utility classes) e **Radix UI** (primitivos acessíveis sem estilo). Os componentes base ficam em `src/components/ui/` e são os blocos fundamentais de toda a interface.

---

## Tokens de Design

### Cores

Definidas como CSS custom properties e mapeadas no `tailwind.config.ts`:

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#F97316` | CTA principal, links ativos, badges de destaque, avatar Arky |
| `--color-primary-hover` | `#EA6C0A` | Estado hover de botões primários |
| `--color-primary-light` | `#FFF7ED` | Fundo de chips de categoria, alertas suaves |
| `--color-text-primary` | `#111827` | Corpo de texto principal |
| `--color-text-secondary` | `#6B7280` | Labels, placeholders, textos de suporte |
| `--color-surface` | `#FFFFFF` | Fundo de cards, modais, inputs |
| `--color-surface-alt` | `#F3F4F6` | Fundo de página, linhas zebradas, inputs disabled |
| `--color-border` | `#E5E7EB` | Bordas de cards, divisores, inputs |
| `--color-success` | `#16A34A` | Status concluído, confirmações |
| `--color-warning` | `#D97706` | Status pendente, avisos |
| `--color-error` | `#DC2626` | Erros de validação, status cancelado |
| `--color-info` | `#2563EB` | Informações neutras, status em andamento |

### Tipografia

**Fontes:** `Inter` (corpo e UI) e `Poppins` (títulos e hero). Carregadas via Google Fonts com `font-display: swap`.

| Escala | Classe Tailwind | Tamanho | Peso | Uso |
|---|---|---|---|---|
| `display-xl` | `text-5xl font-bold font-poppins` | 48px | 700 | Hero da home |
| `display-lg` | `text-4xl font-bold font-poppins` | 36px | 700 | Títulos de seção hero |
| `heading-xl` | `text-3xl font-semibold font-poppins` | 30px | 600 | H1 de páginas internas |
| `heading-lg` | `text-2xl font-semibold font-poppins` | 24px | 600 | H2 de seções |
| `heading-md` | `text-xl font-semibold` | 20px | 600 | H3, títulos de cards |
| `body-lg` | `text-base font-normal` | 16px | 400 | Corpo padrão |
| `body-sm` | `text-sm font-normal` | 14px | 400 | Labels, descrições curtas |
| `caption` | `text-xs font-normal` | 12px | 400 | Metadados, timestamps |
| `label` | `text-sm font-medium` | 14px | 500 | Labels de formulário |
| `button` | `text-sm font-semibold` | 14px | 600 | Texto de botões |

### Espaçamento

Segue a escala padrão do Tailwind (base 4px). Convenções de uso:

| Contexto | Valor |
|---|---|
| Gap interno de componente (padding de card) | `p-4` (16px) ou `p-6` (24px) |
| Gap entre componentes em lista | `gap-4` (16px) |
| Gap entre seções de página | `gap-8` (32px) ou `gap-12` (48px) |
| Padding lateral de página mobile | `px-4` (16px) |
| Padding lateral de página desktop | `px-8` (32px) |
| Margem máxima de conteúdo | `max-w-7xl mx-auto` (1280px centrado) |

### Border Radius

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 4px | Badges pequenos, chips |
| `rounded-md` | 6px | Inputs, selects |
| `rounded-lg` | 8px | Cards padrão |
| `rounded-xl` | 12px | Cards de destaque, modais |
| `rounded-2xl` | 16px | Cards hero, imagens de destaque |
| `rounded-full` | 9999px | Avatares, pills de filtro, botão FAB da Arky |

### Sombras

| Token | Classe Tailwind | Uso |
|---|---|---|
| Elevação 1 | `shadow-sm` | Cards em repouso |
| Elevação 2 | `shadow-md` | Cards em hover, dropdowns |
| Elevação 3 | `shadow-lg` | Modais, drawers |
| Elevação 4 | `shadow-xl` | Toasts, popovers |

---

## Componentes Base

### Button

Localização: `src/components/ui/Button.tsx`

**Variantes:**

| Variant | Aparência | Uso |
|---|---|---|
| `primary` | Fundo laranja `#F97316`, texto branco | CTA principal ("Contratar", "Finalizar pedido") |
| `secondary` | Fundo `#F3F4F6`, texto `#111827` | Ações secundárias ("Cancelar", "Voltar") |
| `outline` | Borda `#E5E7EB`, fundo transparente, texto `#111827` | Ações terciárias ("Ver mais") |
| `ghost` | Sem borda, sem fundo, texto `#6B7280` | Ações inline, links de ação |
| `destructive` | Fundo `#DC2626`, texto branco | Cancelar pedido, remover item |
| `link` | Sem fundo, texto `#F97316` sublinhado no hover | Links textuais dentro de parágrafo |

**Tamanhos:**

| Size | Altura | Padding horizontal | Uso |
|---|---|---|---|
| `sm` | 32px | `px-3` | Ações em tabelas, chips |
| `md` | 40px | `px-4` | Padrão de formulários |
| `lg` | 48px | `px-6` | CTAs principais |
| `xl` | 56px | `px-8` | Hero CTA |
| `icon` | 40x40px | — | Botões apenas com ícone |

**Props esperadas:**

```
variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
isLoading?: boolean          // mostra Spinner e desabilita
disabled?: boolean
leftIcon?: React.ReactNode
rightIcon?: React.ReactNode
fullWidth?: boolean          // width: 100%
asChild?: boolean            // Radix Slot para composição
```

**Acessibilidade:** quando `isLoading=true`, adiciona `aria-busy="true"` e `aria-label="Carregando..."`. O botão permanece focalizável mas desabilitado com `aria-disabled="true"`.

---

### Input

Localização: `src/components/ui/Input.tsx`

Sempre usado junto ao wrapper `FormField` que inclui label, hint e mensagem de erro.

**Props esperadas:**

```
type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'search'
label?: string
hint?: string                // texto de ajuda abaixo do input
error?: string               // mensagem de erro (vermelho)
leftElement?: React.ReactNode  // ícone ou texto à esquerda
rightElement?: React.ReactNode // ícone ou botão à direita
mask?: 'cpf' | 'telefone' | 'cep' | 'data'  // máscara automática
```

**Estados visuais:**
- **Default:** borda `#E5E7EB`, fundo branco
- **Focus:** borda `#F97316` (ring laranja 2px), sem outline nativo
- **Error:** borda `#DC2626`, hint em vermelho, ícone de alerta à direita
- **Disabled:** fundo `#F3F4F6`, texto `#6B7280`, cursor `not-allowed`
- **Read-only:** igual disabled mas sem opacidade reduzida

---

### Card

Localização: `src/components/ui/Card.tsx`

Componente de container. Variantes via composição:

```
<Card>                  // container base: fundo branco, shadow-sm, rounded-lg
  <Card.Header>         // padding-top + título + subtítulo
  <Card.Body>           // padding lateral e vertical
  <Card.Footer>         // padding-bottom, opcional divisor
  <Card.Image>          // imagem com aspect-ratio configurável
```

**Variante `ServiceCard`** (em `src/components/shared/ServiceCard.tsx`): card de serviço do marketplace com imagem, nome, categoria, preço base, rating, e badge "Mais contratado".

---

### Badge

Localização: `src/components/ui/Badge.tsx`

| Variant | Cores | Uso |
|---|---|---|
| `default` | Fundo `#F3F4F6`, texto `#374151` | Tags genéricas |
| `primary` | Fundo `#FFF7ED`, texto `#F97316` | Categoria de serviço |
| `success` | Fundo `#DCFCE7`, texto `#16A34A` | Status "Concluído" |
| `warning` | Fundo `#FEF3C7`, texto `#D97706` | Status "Pendente" |
| `error` | Fundo `#FEE2E2`, texto `#DC2626` | Status "Cancelado" |
| `info` | Fundo `#DBEAFE`, texto `#2563EB` | Status "Em andamento" |
| `outline` | Borda atual, fundo transparente | Variante discreta |

---

### Modal (Dialog)

Construído sobre **Radix UI Dialog**. Localização: `src/components/ui/Modal.tsx`

**Props:**
```
isOpen: boolean
onClose: () => void
title: string
description?: string
size?: 'sm' | 'md' | 'lg' | 'fullscreen'
closeOnOverlayClick?: boolean  // default: true
```

**Comportamento:** foco preso dentro do modal (focus trap automático do Radix), fecha com `Escape`, overlay escurece o fundo com `backdrop-blur-sm`. Animação de entrada: slide-up + fade-in (150ms).

---

### Toast

Baseado em **Radix UI Toast**. Localização: `src/components/ui/Toast.tsx` e `src/stores/uiStore.ts`.

**API de uso:**
```
// Em qualquer componente
const { toast } = useToast()
toast.success('Pedido realizado com sucesso!')
toast.error('Erro ao processar pagamento. Tente novamente.')
toast.warning('Seu carrinho tem itens indisponíveis.')
toast.info('Arky está aprendendo suas preferências.')
```

**Comportamento:** aparece no canto superior direito (mobile: full-width no topo). Auto-fecha em 5s. Máximo de 3 toasts simultâneos; os mais antigos desaparecem primeiro.

---

### Skeleton

Localização: `src/components/ui/Skeleton.tsx`

Usado em vez de spinners para carregamento de conteúdo. Animação de shimmer (gradiente que percorre da esquerda para a direita).

**Variantes pré-construídas:**
- `<SkeletonServiceCard />` — shape de card do marketplace
- `<SkeletonPedidoCard />` — shape de card de pedido
- `<SkeletonText lines={3} />` — linhas de texto
- `<SkeletonAvatar size="md" />` — círculo de avatar

---

### Spinner

Localização: `src/components/ui/Spinner.tsx`

Usado apenas para ações de submissão (botão carregando) e carregamento de página (rota lazy). **Não usar em listas e cards** — nesses contextos, usar Skeleton.

```
size?: 'sm' | 'md' | 'lg'   // 16px, 24px, 40px
color?: 'primary' | 'white' | 'muted'
```

---

## Acessibilidade

### Padrões obrigatórios

| Contexto | Requisito |
|---|---|
| Contraste de texto | Mínimo **4.5:1** (WCAG AA) para texto normal; **3:1** para texto grande (+18px) |
| Contraste de componentes interativos | Mínimo **3:1** contra o fundo |
| Touch targets | Mínimo **44x44px** em mobile |
| Imagens | Todo `<img>` com `alt` descritivo; imagens decorativas com `alt=""` |
| Formulários | Cada input com `<label>` associado via `htmlFor` / `aria-labelledby` |
| Erros | Mensagens de erro com `aria-describedby` apontando para o input |
| Modais | Focus trap, `aria-modal="true"`, título em `aria-labelledby` |
| Botões de ícone | `aria-label` descritivo obrigatório |
| Loading states | `aria-busy="true"` + `aria-live="polite"` para anunciar conclusão |
| Navegação de teclado | Toda funcionalidade acessível via teclado (Tab, Enter, Space, Esc, Arrow keys) |

### Checklist de contraste crítico

| Combinação | Razão | Aprovado? |
|---|---|---|
| `#F97316` (laranja) sobre `#FFFFFF` (branco) | 3.0:1 | ✅ Para texto grande / ícones |
| `#111827` sobre `#FFFFFF` | 16.1:1 | ✅ |
| `#6B7280` sobre `#FFFFFF` | 4.6:1 | ✅ |
| `#FFFFFF` sobre `#F97316` | 3.0:1 | ✅ Para texto bold em botão |
| `#111827` sobre `#F3F4F6` | 14.9:1 | ✅ |

> **Nota:** O laranja `#F97316` sobre fundo branco tem razão 3.0:1, que passa WCAG AA somente para texto grande (≥18px regular ou ≥14px bold). Para texto pequeno em fundo laranja claro (`#FFF7ED`), usar texto `#C2500A` (laranja escuro) para garantir contraste.

---

## Dark Mode

### Estratégia

Dark mode é implementado com **CSS custom properties + classe `dark` no `<html>`**. O Tailwind está configurado com `darkMode: 'class'`.

A preferência é salva no `uiStore` (Zustand) e persistida no `localStorage` (`arcaika:theme`). Na inicialização, o app lê `localStorage` e, se ausente, usa `prefers-color-scheme`.

### Tokens em dark mode

| Token Light | Token Dark |
|---|---|
| `--color-surface: #FFFFFF` | `--color-surface: #1F2937` |
| `--color-surface-alt: #F3F4F6` | `--color-surface-alt: #111827` |
| `--color-text-primary: #111827` | `--color-text-primary: #F9FAFB` |
| `--color-text-secondary: #6B7280` | `--color-text-secondary: #9CA3AF` |
| `--color-border: #E5E7EB` | `--color-border: #374151` |
| `--color-primary: #F97316` | `--color-primary: #FB923C` (laranja mais claro para contraste) |

> Dark mode é uma funcionalidade de **fase 2**. Os tokens devem ser definidos desde o início para evitar refatoração. Na fase 1, apenas a variante light é visualmente finalizada.
