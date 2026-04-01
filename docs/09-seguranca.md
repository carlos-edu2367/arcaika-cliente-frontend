# 09 — Segurança

Segurança no frontend é uma camada de defesa em profundidade, não a linha principal. O backend deve validar e autorizar tudo. O frontend implementa as seguintes medidas para reduzir superfícies de ataque e melhorar a experiência em cenários adversos.

---

## Proteção de Rotas

### Componente `RequireAuth`

Arquivo: `src/components/layout/RequireAuth.tsx`

Wrapper que envolve todas as rotas que exigem autenticação. Verifica o `authStore.isAuthenticated` no momento da renderização.

**Lógica:**
```
// Estrutura conceitual do RequireAuth
function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return children
}
```

**`state: { from: location }`** permite que após o login, o usuário seja redirecionado de volta para a página que tentava acessar.

**Proteção dupla:** além do redirect no frontend, toda rota protegida no backend rejeita requests sem token válido com 401. O frontend é a primeira camada de UX; o backend é a camada de segurança real.

### Redirect reverso (rotas de auth)

Páginas de `/auth/login` e `/auth/cadastro` redirecionam para `/` se o usuário já está autenticado:
```
if (isAuthenticated) return <Navigate to="/" replace />
```

Isso evita que um usuário logado fique "travado" em telas de auth.

---

## Armazenamento de Token

### Decisão: `localStorage` com mitigações

Armazenar JWT em `localStorage` expõe o token a ataques XSS: qualquer script injetado na página pode ler `localStorage`. Para mitigar:

| Mitigação | Implementação |
|---|---|
| **Content Security Policy (CSP)** | Header `Content-Security-Policy` no servidor de assets: `script-src 'self'` bloqueia scripts inline e de origens não autorizadas |
| **DOMPurify em todo HTML renderizado** | Qualquer conteúdo HTML vindo da API (descrições de serviços, respostas da Arky) passa por `DOMPurify.sanitize()` antes de ir ao DOM |
| **Subresource Integrity (SRI)** | Recursos de CDN externos (fontes, scripts de análise) usam atributo `integrity` com hash SHA-256 |
| **Auditoria de dependências** | `npm audit` no CI; dependências com vulnerabilidade crítica bloqueiam o build |
| **Sem execução de código de usuário** | O frontend nunca usa `eval()`, `innerHTML` direta ou `dangerouslySetInnerHTML` sem sanitização |

### Estrutura de tokens

| Token | Storage | Expiração | Risco |
|---|---|---|---|
| `access_token` | `localStorage` (`arcaika:token`) | 1 hora | Médio (XSS) |
| `refresh_token` | `sessionStorage` (`arcaika:refresh_token`) | 7 dias | Baixo (apenas nessa aba) |
| Dados do usuário | `localStorage` (`arcaika:user`) | Junto com access_token | Baixo (sem dados sensíveis) |

**Por que `refresh_token` em `sessionStorage`?** Isso impede que o refresh token persista entre sessões do browser (fechar e reabrir). O usuário precisa fazer login novamente após fechar o navegador, o que é um trade-off de segurança aceitável para o perfil de produto.

### Limpeza em logout

```
// authStore.logout()
localStorage.removeItem('arcaika:token')
localStorage.removeItem('arcaika:user')
sessionStorage.removeItem('arcaika:refresh_token')
sessionStorage.removeItem('arcaika:arky:historico')
sessionStorage.removeItem('arcaika:pendingAction')
// Limpar cache do TanStack Query
queryClient.clear()
```

---

## CSRF (Cross-Site Request Forgery)

Como o token é enviado no header `Authorization: Bearer <token>` (e não em cookie), requests cross-origin automáticas (CSRF clássico via form submission) não incluem o token. Portanto, **o CSRF não é uma ameaça relevante para esta arquitetura JWT-in-localStorage**.

Se no futuro o token for movido para httpOnly cookie, será necessário implementar:
- Header personalizado `X-CSRF-Token` em todas as mutações
- Token gerado pelo backend e lido via cookie não-httpOnly separado

---

## Sanitização de Input (XSS)

### DOMPurify em conteúdo da API

Qualquer dado que possa conter HTML e seja renderizado no DOM deve passar por DOMPurify:

```typescript
// utils/sanitize.ts
import DOMPurify from 'dompurify'

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
  })
}

// Uso em componente
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(servico.descricao_html) }} />
```

**Links externos** gerados do conteúdo da API sempre incluem `rel="noopener noreferrer"` para evitar `window.opener` attacks.

### Inputs de formulário

Inputs de formulário **não precisam** de sanitização no frontend — o React já escapa o valor automaticamente ao renderizar. A validação de formato é feita com Zod, e a validação de conteúdo malicioso é responsabilidade do backend.

---

## Rate Limiting no Cliente

### Tentativas de login

Armazenado em `sessionStorage` com timestamp:

```
// Estrutura: { tentativas: number, bloqueadoAte: number (timestamp) }
sessionStorage.setItem('arcaika:loginAttempts', JSON.stringify({ tentativas: 3, bloqueadoAte: 0 }))
```

**Fluxo:**
1. Tentativa de login falha (email/senha errados): incrementa `tentativas`
2. Ao atingir 5 tentativas: seta `bloqueadoAte = Date.now() + 60_000` (60 segundos)
3. O botão "Entrar" fica desabilitado e exibe countdown: "Aguarde 58s para tentar novamente"
4. Após o cooldown: reseta o contador
5. Login bem-sucedido: reseta o contador imediatamente

Esta medida é de **UX e proteção superficial** — o backend deve implementar rate limiting real (por IP, por email). O frontend apenas evita spam acidental e atrai menos atenção de bots simples.

### Buscas e requests frequentes

- Busca no marketplace: debounce de 300ms (evita spam de requests)
- Aplicar cupom: botão desabilitado durante o request (evita double submit)
- Qualquer `useMutation` tem o botão de submit desabilitado enquanto `isPending === true`

---

## Variáveis de Ambiente

### Prefixo obrigatório `VITE_`

Apenas variáveis com prefixo `VITE_` são expostas no bundle de frontend. Isso é uma limitação do Vite, não configurável.

**Arquivos:**
- `.env` — variáveis de desenvolvimento (commitado, sem secrets)
- `.env.local` — overrides locais (não commitado, no `.gitignore`)
- `.env.production` — variáveis de produção (commitado, sem secrets)

**Regra:** **nunca colocar secrets no frontend**. O frontend é código público. Qualquer valor em `VITE_*` pode ser lido por qualquer pessoa que inspecione o bundle.

```
# .env.example (commitado — serve como documentação)
VITE_API_BASE_URL=https://api.arcaika.com.br
VITE_APP_ENV=production
VITE_SENTRY_DSN=         # DSN público do Sentry (não é secret)
```

---

## Validação de Tipos de Arquivo (Upload)

No wizard de orçamento, o upload de arquivos valida:

```typescript
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const TAMANHO_MAXIMO = 10 * 1024 * 1024  // 10MB

function validarArquivo(file: File): string | null {
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou PDF.'
  }
  if (file.size > TAMANHO_MAXIMO) {
    return `Arquivo muito grande. Máximo: 10MB.`
  }
  return null  // válido
}
```

**Nota:** a validação de tipo por `file.type` (MIME type) pode ser falsificada por usuários mal-intencionados. O backend deve validar o conteúdo real do arquivo (magic bytes), não apenas o MIME type reportado pelo browser.

---

## Cabeçalhos de Segurança (responsabilidade do servidor)

O servidor de assets (CDN ou servidor web) deve configurar os seguintes headers. Documentados aqui para referência ao configurar o deploy:

| Header | Valor recomendado |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.arcaika.com.br` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |

---

## Monitoramento e Logging

Em produção, erros de JavaScript não capturados e erros de API são reportados para o Sentry (ou equivalente):

- Erros de `ErrorBoundary` → `Sentry.captureException(error)`
- Respostas 5xx da API → `Sentry.captureException` com contexto da request
- **Nunca logar** tokens, senhas ou dados pessoais (CPF, cartão) nos eventos do Sentry

O DSN do Sentry é público (vai no bundle) — isso é esperado e seguro. A segurança dos dados do Sentry está no controle de acesso ao painel.
