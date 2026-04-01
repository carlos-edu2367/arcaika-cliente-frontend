# 13 — Planejamento: Frontend 100% Funcional

**Data:** 26/03/2026
**Objetivo:** eliminar todos os bugs, gaps de UX e itens faltantes para o frontend estar pronto para produção.
**Estado atual:** ~88% completo — estrutura e fluxos prontos, mas com bugs críticos que impedem funcionamento real.

---

## Resumo executivo dos problemas encontrados

| # | Problema | Impacto |
|---|---------|---------|
| 1 | `<Toaster>` nunca montado — nenhum toast é exibido | 🔴 Crítico |
| 2 | Logo `assets/logo.png` não usada em nenhum lugar | 🔴 Crítico |
| 3 | Interceptor 401 faz `window.location.href` (hard reload) | 🔴 Crítico |
| 4 | TopBar link de perfil aponta para `/perfil` em vez de `/conta/perfil` | 🟠 Alto |
| 5 | TopBar busca desktop não funciona como busca real | 🟠 Alto |
| 6 | `useArky` perde histórico ao fechar o Drawer (sem sessionStorage) | 🟠 Alto |
| 7 | `App.tsx` é uma casca vazia sem uso — confunde maintainers | 🟡 Médio |
| 8 | Sem `ErrorBoundary` global — erros derrubam a app toda | 🟡 Médio |
| 9 | Sem `ScrollRestoration` — scroll não volta ao topo ao navegar | 🟡 Médio |
| 10 | Página `/marketplace/item/:id` (ItemDetalhe) não existe | 🟡 Médio |
| 11 | Botão "Avaliar serviço" não verifica se pedido já foi avaliado | 🟡 Médio |
| 12 | Build de produção quebrado (`@rollup/rollup-linux-x64-gnu`) | 🔴 Infra |
| 13 | Zero testes automatizados | 🔴 Infra |
| 14 | Endpoints de recuperação de senha não existem no backend | 🟠 Backend |

---

## BLOCO 1 — Bugs Críticos
> Sem estes o app não funciona corretamente mesmo em desenvolvimento.

---

### Tarefa 1.1 — Montar o `<Toaster>` globalmente
**Prioridade:** 🔴 Crítico
**Complexidade:** XS (5 min)
**Por que crítico:** `addToast()` é chamado em toda mutation de sucesso/erro da app — login, cadastro, carrinho, pedidos, avaliações, endereços, senha, orçamentos. Nenhum desses feedbacks é exibido atualmente. O `<Toaster>` foi implementado em `src/components/ui/Toast.tsx` mas nunca montado em nenhum componente pai.

**Arquivo a editar:** `src/router/index.tsx`

```tsx
// Adicionar import
import { Toaster } from '@/components/ui/Toast'

// Adicionar dentro de <BrowserRouter>, junto com LoginModal:
<Toaster />
```

**Verificação:** Após a mudança, qualquer `addToast({ type: 'success', title: '...' })` deve exibir um toast no canto superior direito.

---

### Tarefa 1.2 — Usar a logo `assets/logo.png`
**Prioridade:** 🔴 Crítico (identidade visual)
**Complexidade:** S (20 min)
**Por que crítico:** O TopBar exibe texto puro "Arcaika" e o Hero da Home também. A logo é o principal elemento de branding da plataforma.

**Passos:**
1. Copiar `assets/logo.png` para `src/assets/logo.png` (ou confirmar o caminho correto com `public/logo.png`)
2. **`src/components/layout/TopBar.tsx`** — substituir o `<Link>` com texto por:
   ```tsx
   import logo from '@/assets/logo.png'
   // ...
   <Link to="/">
     <img src={logo} alt="Arcaika" className="h-8 w-auto" />
   </Link>
   ```
3. **`src/pages/Home/index.tsx`** — adicionar logo no Hero (versão clara, pois o fundo é escuro):
   ```tsx
   import logo from '@/assets/logo.png'
   // No hero, acima do h1:
   <img src={logo} alt="Arcaika" className="h-12 w-auto mx-auto brightness-0 invert" />
   ```

**Observação:** Se a logo já tiver versão em branco/transparente, não usar `brightness-0 invert`. Verificar o arquivo antes.

---

### Tarefa 1.3 — Corrigir o interceptor 401 no Axios
**Prioridade:** 🔴 Crítico
**Complexidade:** S (15 min)
**Por que crítico:** Quando o token expira, o interceptor atual faz `window.location.href = '/auth/login'`, que destrói todo o estado React (TanStack Query cache, Zustand stores, componentes montados). O usuário perde o contexto da página em que estava.

**Arquivo a editar:** `src/lib/axios.ts`

**Solução:** Usar `authStore.logout()` + emitir um evento customizado que o router captura para redirecionar via React Router, preservando o estado.

```ts
// src/lib/axios.ts
import { useAuthStore } from '@/stores/authStore'

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Limpar auth sem hard reload
      useAuthStore.getState().logout()
      // Disparar evento para o router redirecionar suavemente
      window.dispatchEvent(new CustomEvent('arcaika:unauthorized'))
    }
    return Promise.reject(error)
  }
)
```

**`src/router/index.tsx`** — ouvir o evento dentro do `AppRouter`:
```tsx
useEffect(() => {
  const handler = () => navigate('/auth/login', { replace: true })
  window.addEventListener('arcaika:unauthorized', handler)
  return () => window.removeEventListener('arcaika:unauthorized', handler)
}, [navigate])
```

**Nota:** O `navigate` do React Router precisa estar dentro de um componente que está dentro do `<BrowserRouter>`. Criar um componente filho `<RouterEventHandler>` para isso, montado dentro do `<Routes>` (ou como sibling das rotas).

---

## BLOCO 2 — Bugs de Navegação e UX
> Itens que o usuário percebe imediatamente ao usar o app.

---

### Tarefa 2.1 — Corrigir link de perfil no TopBar
**Prioridade:** 🟠 Alto
**Complexidade:** XS (2 min)
**Arquivo:** `src/components/layout/TopBar.tsx`

```tsx
// Linha 41 — trocar:
<Link to="/perfil" ...>
// Por:
<Link to="/conta/perfil" ...>
```

---

### Tarefa 2.2 — Fazer campo de busca do TopBar funcionar
**Prioridade:** 🟠 Alto
**Complexidade:** S (20 min)
**Problema atual:** O campo de busca desktop usa `onFocus={() => navigate('/marketplace')}`. Isso navega mesmo quando o usuário não digitou nada, e não carrega o termo buscado na nova página.

**Arquivo:** `src/components/layout/TopBar.tsx`

**Solução:**
```tsx
const [q, setQ] = useState('')
const navigate = useNavigate()

const handleSearch = (e: React.FormEvent) => {
  e.preventDefault()
  if (q.trim()) {
    navigate(`/busca?q=${encodeURIComponent(q.trim())}`)
    setQ('')
  }
}

// No JSX — usar um <form> ao redor do input:
<form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
  <input
    value={q}
    onChange={(e) => setQ(e.target.value)}
    placeholder="Buscar serviços..."
    // remover onFocus
    className="..."
  />
</form>
```

---

### Tarefa 2.3 — Persistir histórico do Arky em sessionStorage
**Prioridade:** 🟠 Alto
**Complexidade:** S (25 min)
**Problema:** `useArky` usa `useState` para mensagens — ao fechar o Drawer e reabrir, o histórico some. A doc especifica persistência via `sessionStorage` (se limpa ao fechar a aba, mas persiste enquanto a sessão estiver ativa).

**Arquivo:** `src/hooks/useArky.ts`

**Solução:** Substituir `useState` por um estado inicializado a partir do `sessionStorage` e sincronizado a cada mensagem nova:

```ts
const SESSION_KEY = 'arcaika_arky_history'

function loadHistory(): MensagemArky[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function useArky() {
  const [mensagens, setMensagens] = useState<MensagemArky[]>(loadHistory)

  const addMensagem = (msg: MensagemArky) => {
    setMensagens((prev) => {
      const next = [...prev, msg]
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next.slice(-50))) // limitar a 50 msgs
      return next
    })
  }

  const limpar = useCallback(() => {
    setMensagens([])
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  // ...resto da lógica usando addMensagem ao invés de setMensagens direto
}
```

---

### Tarefa 2.4 — Adicionar ScrollRestoration
**Prioridade:** 🟡 Médio
**Complexidade:** XS (5 min)
**Problema:** Ao navegar entre páginas (ex: Marketplace → Detalhe → voltar), o scroll permanece na posição anterior em vez de ir ao topo.

**Arquivo:** `src/router/index.tsx`

```tsx
import { ScrollRestoration } from 'react-router-dom'

// Dentro de <BrowserRouter>, adicionar:
<ScrollRestoration />
```

**Nota:** O `ScrollRestoration` do React Router v6 funciona automaticamente para navegação push, preservando a posição ao usar o botão "Voltar" do navegador.

---

### Tarefa 2.5 — Verificar avaliação duplicada no PedidoDetalhe
**Prioridade:** 🟡 Médio
**Complexidade:** S (20 min)
**Problema:** O botão "Avaliar serviço" é exibido para todo pedido com status CONCLUÍDO, mesmo que já tenha sido avaliado.

**Solução:**

Opção A (recomendada — depende de backend): A API deve retornar `avaliado: boolean` no payload do pedido. Quando presente, esconder o botão:
```tsx
const podeConcluido = pedido.status === 'CONCLUIDO' && !pedido.avaliado
```

Opção B (client-only): Armazenar IDs de pedidos avaliados em localStorage após submit bem-sucedido:
```ts
const jaAvaliados = JSON.parse(localStorage.getItem('arcaika_avaliados') ?? '[]') as string[]
const podeConcluido = pedido.status === 'CONCLUIDO' && !jaAvaliados.includes(id)

// No onSuccess da mutation:
const atualizados = [...jaAvaliados, pedidoId]
localStorage.setItem('arcaika_avaliados', JSON.stringify(atualizados))
```

Adicionar `avaliado?: boolean` ao tipo `Pedido` em `src/types/domain.ts` de qualquer forma para preparar a integração.

---

## BLOCO 3 — Funcionalidades Faltantes

---

### Tarefa 3.1 — Página ItemDetalhe (`/marketplace/item/:id`)
**Prioridade:** 🟡 Médio
**Complexidade:** M (1–2h)
**Arquivo a criar:** `src/pages/Marketplace/ItemDetalhe.tsx`
**Arquivo a editar:** `src/router/index.tsx`

O `marketplaceService.detalheItem()` já existe mas não há UI. A página deve ser similar ao `ServicoDetalhe` mas para o tipo `Item` do domain (`src/types/domain.ts`):
- Galeria de fotos
- Nome, descrição, preço, categoria
- Botão "Adicionar ao carrinho" (sem "Solicitar orçamento", pois itens não são orçáveis)
- Avaliações (se aplicável via `avaliacoesService`)

**Adicionar ao router:**
```tsx
const ItemDetalhe = lazy(() => import('@/pages/Marketplace/ItemDetalhe'))
// ...
<Route path="/marketplace/item/:id" element={<ItemDetalhe />} />
```

**Adicionar link no `ServiceCard`** quando `tipo === 'item'` (verificar se o card precisa distinguir os dois).

---

### Tarefa 3.2 — Adicionar `ErrorBoundary` global
**Prioridade:** 🟡 Médio
**Complexidade:** S (30 min)
**Arquivo a criar:** `src/components/shared/ErrorBoundary.tsx`
**Arquivo a editar:** `src/router/index.tsx`

```tsx
// ErrorBoundary.tsx — class component (obrigatório para boundaries no React)
import { Component, type ReactNode } from 'react'

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 p-8">
          <p className="text-5xl">⚠️</p>
          <h2 className="text-xl font-bold text-neutral-800">Algo deu errado</h2>
          <p className="text-sm text-neutral-500 max-w-sm">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Recarregar
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs text-red-500 bg-red-50 p-3 rounded-lg max-w-full overflow-auto mt-2">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
```

**Montar em `src/router/index.tsx`**, envolvendo o `<Suspense>`:
```tsx
<ErrorBoundary>
  <Suspense fallback={<PageFallback />}>
    <Routes>...</Routes>
  </Suspense>
</ErrorBoundary>
```

---

### Tarefa 3.3 — Remover / converter `App.tsx`
**Prioridade:** 🟡 Médio
**Complexidade:** XS (5 min)

O `App.tsx` é uma casca vazia que não é usada pelo `main.tsx` (que importa `AppRouter` diretamente). Sua existência confunde qualquer desenvolvedor que abre o projeto.

**Opção A (recomendada):** Deletar `src/App.tsx`.
**Opção B:** Converter para re-exportar `AppRouter`:
```tsx
export { AppRouter as default } from '@/router'
```
E ajustar `main.tsx` para `import App from './App'` como padrão de projeto CRA-like.

---

## BLOCO 4 — Infraestrutura

---

### Tarefa 4.1 — Corrigir o build de produção
**Prioridade:** 🔴 Infra
**Complexidade:** S (20 min de diagnóstico, sem código)
**Problema:** `npm run build` falha com `Cannot find module @rollup/rollup-linux-x64-gnu`. É um addon nativo do Rollup que não foi instalado corretamente no ambiente Linux.

**Passos de diagnóstico e correção:**
```bash
# 1. Verificar versão do rollup instalada
npm ls rollup

# 2. Forçar reinstalação dos opcionais (que incluem os addons nativos)
npm install --include=optional

# 3. Se ainda falhar, fixar versão compatível
npm install rollup@^3.29.0 --save-dev

# 4. Alternativa: usar esbuild como bundler
# No vite.config.ts adicionar: build: { rollupOptions: { ... } }
# ou migrar para @vitejs/plugin-react com esbuild puro
```

**Se o problema persistir no ambiente de desenvolvimento:** confirmar que o ambiente tem acesso ao npm registry sem 403 (pode ser necessário usar `npm config set registry https://registry.npmjs.org/`).

---

### Tarefa 4.2 — Configurar testes automatizados
**Prioridade:** 🔴 Infra
**Complexidade:** L (1–2 dias para cobertura básica)

**Setup inicial:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**`vite.config.ts`** — adicionar:
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
}
```

**`src/test/setup.ts`:**
```ts
import '@testing-library/jest-dom'
```

**Testes prioritários a escrever (ordem de risco/impacto):**

| Arquivo de teste | O que testar |
|-----------------|-------------|
| `LoginModal.test.tsx` | Renderiza, fecha com ESC, submete com credenciais válidas, exibe erro de validação |
| `Cadastro.test.tsx` | Wizard avança pelos 3 passos, validação de CPF, validação de 18 anos, reset se voltar |
| `RequireAuth.test.tsx` | Redireciona para login se não autenticado, renderiza children se autenticado |
| `useCarrinho.test.ts` | `adicionarServico` chama mutation correta, `aplicarCupom` invalida cache |
| `ModalAvaliacao.test.tsx` | Estrelas respondem a click, submit desabilitado sem nota, submit envia dados corretos |
| `Checkout.test.tsx` | Avança entre passos, ViaCEP preenche campos, step 5 redireciona para MercadoPago |

---

## BLOCO 5 — Dependências de Backend

> Itens que requerem endpoints ainda não implementados na API.

---

### Tarefa 5.1 — Endpoints de recuperação de senha
**Prioridade:** 🟠 Alto (backend)
**Arquivo frontend já pronto:** `src/pages/Auth/RecuperarSenha.tsx`

O frontend já chama:
- `POST /auth/recuperar-senha` — body: `{ email: string }` — resposta: 200 (silencioso)
- `POST /auth/redefinir-senha` — body: `{ token: string, senha: string }` — resposta: 200

O backend precisa implementar:
1. Geração de token único com expiração de 30 minutos
2. Envio de email com link `https://app.arcaika.com/auth/recuperar-senha?token=...`
3. Validação do token e atualização da senha

**Nenhuma mudança necessária no frontend** quando o backend estiver pronto.

---

### Tarefa 5.2 — Campo `avaliado` no payload de Pedido
**Prioridade:** 🟡 Médio (backend)
**Relacionado com:** Tarefa 2.5

O endpoint `GET /pedidos/:id` deveria retornar `avaliado: boolean` para que o frontend saiba se o usuário já avaliou aquele pedido. Adicionar ao tipo:

```ts
// src/types/domain.ts
export interface Pedido {
  // ...campos existentes...
  avaliado?: boolean  // adicionar
}
```

---

### Tarefa 5.3 — Endereço no registro de cliente
**Prioridade:** 🔵 Baixo (backend)

O wizard de Cadastro coleta endereço no passo 3, mas `POST /auth/cliente` não aceita `endereco` no payload. Quando o backend suportar:

```ts
// src/services/api/auth.ts
export interface RegisterInput {
  nome: string
  email: string
  senha: string
  cpf?: string
  telefone?: string
  endereco?: {           // adicionar
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
  }
}
```

E ajustar `src/pages/Auth/Cadastro.tsx` para incluir `step3` no payload do `registerUser()`.

---

## Ordem de execução recomendada

```
Semana 1 — Bugs críticos e navegação
  ├── 1.1  Montar <Toaster>                    (5 min)
  ├── 1.2  Usar logo assets/logo.png            (20 min)
  ├── 1.3  Corrigir interceptor 401             (15 min)
  ├── 2.1  TopBar link de perfil                (2 min)
  ├── 2.2  TopBar campo de busca funcional      (20 min)
  └── 2.4  ScrollRestoration                   (5 min)

Semana 1 (cont.) — UX e funcionalidades
  ├── 2.3  useArky sessionStorage               (25 min)
  ├── 2.5  Verificar avaliação duplicada        (20 min)
  └── 3.2  ErrorBoundary global                 (30 min)

Semana 2 — Conteúdo e limpeza
  ├── 3.1  Página ItemDetalhe                   (1–2h)
  ├── 3.3  Remover App.tsx                      (5 min)
  └── 4.1  Fix build de produção               (diagnóstico)

Semana 2–3 — Qualidade
  └── 4.2  Testes automatizados                (1–2 dias)

Paralelo — Backend
  ├── 5.1  Endpoints de recuperação de senha
  ├── 5.2  Campo avaliado no Pedido
  └── 5.3  Endereço no registro
```

---

---

## BLOCO 6 — Feature: Marketplace por Localidade ✅ (implementado em 26/03/2026)

Ver documentação completa em `14-localidade.md`.

**Resumo do que foi entregue:**
- `src/stores/locationStore.ts` — Zustand persist com cidade selecionada
- `src/components/location/LocationPicker.tsx` — modal com 31 cidades, geolocalização via Nominatim e opção "Todo o Brasil"
- TopBar com chip de cidade (desktop) e faixa de contexto (mobile)
- Home com título e CTA dinâmicos por cidade
- Marketplace e Busca passando `localidade` para a API automaticamente
- Primeira visita: LocationPicker abre bloqueante até o usuário escolher

**Pendência de backend:** implementar match por região metropolitana no endpoint `GET /marketplace/?localidade=...`.

---

## Checklist final de produção

Antes de considerar o frontend 100% pronto para produção, validar:

- [ ] `<Toaster>` montado e exibindo toasts em todas as mutations
- [ ] Logo `assets/logo.png` exibida no TopBar e no Hero
- [ ] Interceptor 401 usando `authStore.logout()` + evento customizado (sem hard reload)
- [ ] TopBar link de perfil aponta para `/conta/perfil`
- [ ] Campo de busca do TopBar navega para `/busca?q=...`
- [ ] `useArky` persiste histórico via sessionStorage
- [ ] `ScrollRestoration` ativo
- [ ] `ErrorBoundary` envolvendo as rotas
- [ ] Página ItemDetalhe implementada
- [ ] Avaliação duplicada tratada (com flag `avaliado` ou localStorage)
- [ ] `App.tsx` removido ou convertido
- [ ] `npm run build` passa sem erros
- [ ] Suite de testes passa sem erros
- [ ] LocationPicker abre na primeira visita (sem `hasChosen`)
- [ ] Geolocalização funciona e preenche cidade corretamente
- [ ] Chip de localidade no TopBar abre o picker
- [ ] Faixa mobile de localidade aparece quando cidade está definida
- [ ] Marketplace e Busca exibem resultados filtrados por cidade
- [ ] Estado vazio com cidade mostra opções "Limpar filtros" e "Mudar cidade"
- [ ] Testar fluxo completo em mobile (375px): Home → Marketplace → Detalhe → Carrinho → Checkout → Pedido → Avaliação
- [ ] Testar fluxo completo em desktop (1280px)
- [ ] Testar com token expirado (simular 401)
- [ ] Testar sem conexão (simular offline no DevTools)
- [ ] Variável de ambiente `VITE_API_URL` configurada para produção
