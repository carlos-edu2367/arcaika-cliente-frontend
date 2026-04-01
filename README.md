# Arcaika — Frontend Cliente

Interface web do cliente final da plataforma **Arcaika**, um marketplace de serviços onde usuários descobrem, contratam e avaliam prestadores.

## Propósito

Este pacote é responsável pela experiência do **cliente** (usuário final) da plataforma Arcaika. Cobre desde a navegação anônima no marketplace até o fluxo completo de contratação, acompanhamento de pedidos, solicitação de orçamentos e interação com o assistente de IA **Arky**.

Outros pacotes da plataforma (frontend do prestador, painel administrativo, backend) são mantidos separadamente.

## Stack

| Tecnologia | Versão | Papel |
|---|---|---|
| React | 18.x | UI library |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool e dev server |
| React Router | 6.x | Roteamento client-side |
| TanStack Query | 5.x | Cache e sincronização de dados do servidor |
| Zustand | 4.x | Estado global leve (auth, UI, carrinho badge) |
| Axios | 1.x | HTTP client com interceptors |
| React Hook Form | 7.x | Formulários com validação performática |
| Zod | 3.x | Validação e inferência de tipos |
| Tailwind CSS | 3.x | Utility-first styling |
| Radix UI | latest | Primitivos de acessibilidade sem estilo |
| DOMPurify | 3.x | Sanitização de HTML recebido da API |

## Paradigmas

- **Mobile-first**: design e código começam pela tela menor e escalam para desktop
- **Component-driven**: UI construída de baixo para cima, do Design System até as páginas
- **Server-state separado de client-state**: TanStack Query gerencia dados do servidor; Zustand gerencia estado de UI e sessão
- **TypeScript estrito**: `strict: true` no tsconfig, zero `any` implícito

## Como rodar

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Type check
npm run typecheck

# Lint
npm run lint
```


## Variáveis de ambiente

```
VITE_API_BASE_URL=
VITE_APP_ENV=development
```

## Documentação interna

| Doc | Descrição |
|---|---|
| [00 — Índice](docs/00-indice.md) | Mapa de toda a documentação |
| [01 — Arquitetura](docs/01-arquitetura.md) | Decisões arquiteturais, estrutura de pastas, fluxo de dados |
| [02 — Design System](docs/02-design-system.md) | Tokens, componentes base, acessibilidade |
| [03 — Páginas e Rotas](docs/03-paginas-e-rotas.md) | Cada rota documentada com dados e UX |
| [04 — Wizards](docs/04-wizards.md) | Fluxos multi-step: checkout, orçamento, cadastro |
| [05 — Performance](docs/05-performance.md) | Cache, code splitting, Lighthouse targets |
| [06 — Estado e API](docs/06-estado-e-api.md) | Hooks, Zustand stores, Axios, React Query keys |
| [07 — Arky Assistente](docs/07-arky-assistente.md) | Chat flutuante de IA |
| [08 — Mobile First](docs/08-mobile-first.md) | Breakpoints, navegação, gestos |
| [09 — Segurança](docs/09-seguranca.md) | Auth, tokens, CSRF, sanitização |
| [10 — UX Flows](docs/10-ux-flows.md) | Diagramas dos fluxos principais |

