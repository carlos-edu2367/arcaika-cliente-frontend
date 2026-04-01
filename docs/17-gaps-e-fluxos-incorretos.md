# 17 — Gaps e Fluxos Incorretos no Frontend Cliente

> **Data da análise:** 2026-03-26
> **Metodologia:** Comparação estática entre `frontend-cliente/src/` e `backend/web/` — routers, schemas, pages, stores, hooks e types.

---

## Índice

1. [Severidade Alta — Bloqueadores](#1-severidade-alta--bloqueadores)
2. [Divergências API: Frontend × Backend](#2-divergências-api-frontend--backend)
3. [Fluxos de Página Incorretos ou Incompletos](#3-fluxos-de-página-incorretos-ou-incompletos)
4. [Gerenciamento de Estado e Hooks](#4-gerenciamento-de-estado-e-hooks)
5. [Tipagem e Domain Types](#5-tipagem-e-domain-types)
6. [Endpoints Não Utilizados pelo Frontend](#6-endpoints-não-utilizados-pelo-frontend)
7. [Tabela Resumo por Prioridade](#7-tabela-resumo-por-prioridade)

---

## 1. Severidade Alta — Bloqueadores

### GAP-001 · Arquivo `Conta/Perfil.tsx` não existe

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `src/router/index.tsx` (linhas 31, 135, 141) |
| **Impacto** | 🔴 ALTO — crash de runtime |

O router importa `lazy(() => import('@/pages/Conta/Perfil'))`, mas o arquivo não existe no filesystem. Qualquer navegação para `/conta` ou `/conta/perfil` causa um erro de carregamento de módulo e derruba o Suspense boundary.

**Correção:** Criar `src/pages/Conta/Perfil.tsx` com os dados do cliente (nome, email, CPF, telefone) consumindo `useCliente()`.

---

### GAP-002 · Marketplace sem paginação

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `src/pages/Marketplace/index.tsx` (linha 50) |
| **Impacto** | 🔴 ALTO — apenas 20 resultados exibidos para sempre |

`page: 1, page_size: 20` estão hard-coded; não existe botão "carregar mais" nem controle de página. Usuários só veem a primeira página de resultados.

**Correção:** Adicionar estado de paginação, botão "Ver mais" ou scroll infinito usando `useInfiniteQuery`.

---

### GAP-003 · Login sem feedback de erro

| Atributo | Detalhe |
|----------|---------|
| **Arquivo** | `src/pages/Auth/Login.tsx` |
| **Impacto** | 🔴 ALTO — UX quebrada |

`useAuth().login()` pode lançar exceções (credenciais inválidas, erro de rede) mas a página não exibe nenhum toast nem mensagem inline. O usuário não recebe feedback sobre a falha.

**Correção:** Capturar a Promise de `login()` e exibir mensagem de erro via `useToast` ou campo de erro no formulário.

---

## 2. Divergências API: Frontend × Backend

### GAP-004 · `POST /pedidos/` — payload completamente divergente

| Campo | Frontend envia | Backend espera |
|-------|---------------|----------------|
| `endereco_id` | ✅ UUID | ✅ UUID |
| `data_desejada` | `string` opcional | ❌ não existe |
| `observacoes` | `string` opcional | ❌ não existe |
| `agendamentos` | ❌ não enviado | `[{data, periodo}]` **obrigatório** |
| `tipo_pagamento` | ❌ não enviado | `string` **obrigatório** |
| `cupom_codigo` | ❌ não enviado | `string` opcional |

**Arquivo frontend:** `src/services/api/pedidos.ts`, `src/pages/Checkout/index.tsx`
**Arquivo backend:** `backend/web/schemas/pedido.py → FinalizarPedidoRequest`
**Impacto:** 🔴 ALTO — criação de pedido falha com erro 422

**Correção:** O Checkout precisa coletar `tipo_pagamento` explicitamente e converter `data_desejada + periodo` para a lista `agendamentos: [{ data: "YYYY-MM-DD HH:MM", periodo: "manha|tarde|noite" }]`.

---

### GAP-005 · `POST /cotacoes/` — nomes de campos divergentes

| Campo | Frontend envia | Backend espera |
|-------|---------------|----------------|
| `categoria_id` | `string` | ❌ não existe |
| `localidade` | `string` | ❌ não existe |
| `data_desejada` | `string` opcional | ❌ não existe |
| `orcamento_minimo/maximo` | números | ❌ não existe |
| `tipo_servico` | ❌ não enviado | `string` **obrigatório** |
| `cidade` | ❌ não enviado | `string` **obrigatório** |
| `estado` | ❌ não enviado | `string` **obrigatório** |
| `endereco_completo` | ❌ não enviado | `string` **obrigatório** |

**Arquivo frontend:** `src/services/api/cotacoes.ts`, `src/pages/Orcamentos/Novo.tsx`
**Arquivo backend:** `backend/web/schemas/cotacao.py → CriarSolicitacaoRequest`
**Impacto:** 🔴 ALTO — criação de cotação falha com erro 422

---

### GAP-006 · `GET /marketplace/recomendacoes` — resposta assíncrona (202) tratada como síncrona

| Aspecto | Frontend | Backend |
|---------|----------|---------|
| Status esperado | `200 OK` | `202 ACCEPTED` |
| Resposta esperada | `Servico[]` | `{ job_id: string; status: "processing" }` |
| Polling necessário | ❌ não implementado | `GET /marketplace/recomendacoes/{job_id}` |

**Arquivo frontend:** `src/services/api/marketplace.ts` (linha 10)
**Arquivo backend:** `backend/web/routers/marketplace.py`
**Impacto:** 🔴 ALTO — recomendações nunca são exibidas

**Correção:** Implementar fluxo de polling: disparar requisição → aguardar `job_id` → consultar status a cada N segundos até `status === "done"` → renderizar resultados.

---

### GAP-007 · `POST /auth/cliente` — campos obrigatórios opcionais no frontend

| Campo | Frontend | Backend |
|-------|----------|---------|
| `cpf` | `optional` (`cpf?`) | **obrigatório** |
| `telefone` | `optional` (`telefone?`) | **obrigatório** |

**Arquivo frontend:** `src/services/api/auth.ts → RegisterInput`
**Arquivo backend:** `backend/web/schemas/identidade.py → CadastrarClienteRequest`
**Impacto:** 🟡 MÉDIO — cadastro sem CPF/telefone falha no backend sem mensagem clara

---

### GAP-008 · `POST /avaliacoes/` — campo `referencia_id` vs `alvo_id`

| Campo | Frontend envia | Backend espera |
|-------|---------------|----------------|
| `referencia_id` | enviado | ❌ ignorado |
| `alvo_id` | ❌ não enviado | **obrigatório** (UUID) |
| `titulo` | ❌ não enviado | opcional |

**Arquivo frontend:** `src/services/api/avaliacoes.ts`
**Arquivo backend:** `backend/web/schemas/avaliacao.py → CriarAvaliacaoRequest`
**Impacto:** 🟡 MÉDIO — criação de avaliação falha com erro 422

---

### GAP-009 · `POST /assistente/recomendacoes` — response shape divergente

| Aspecto | Frontend espera | Backend retorna |
|---------|----------------|-----------------|
| Tipo raiz | `Servico[]` | `{ recomendacoes: [...], motivo_geral: string, total: int }` |

**Arquivo frontend:** `src/services/api/assistente.ts`
**Arquivo backend:** `backend/web/routers/assistente.py → RecomendacoesResponse`
**Impacto:** 🟡 MÉDIO — recomendações do Arky não renderizam

---

### GAP-010 · `AdicionarItemCarrinho` — campo `servico_vinculado_id` nunca enviado

O backend aceita `servico_vinculado_id?: UUID` em `AdicionarItemCarrinhoRequest` para vincular um item físico a um serviço, mas o frontend nunca envia esse campo.
**Impacto:** 🟢 BAIXO — funcionalidade não implementada no frontend

---

## 3. Fluxos de Página Incorretos ou Incompletos

### GAP-011 · Cadastro (Step 3) — endereço coletado mas descartado

**Arquivo:** `src/pages/Auth/Cadastro.tsx` (handler `handleStep3`)
O Step 3 do wizard coleta campos de endereço (`logradouro`, `numero`, `bairro`, `cidade`, `estado`, `cep`), mas `handleStep3` envia apenas `{ nome, sobrenome, email, senha, cpf, telefone }` para o backend. Os dados de endereço são descartados.
**Impacto:** 🟡 MÉDIO — dado inserido pelo usuário é perdido silenciosamente

---

### GAP-012 · Checkout — `observacoes` nunca enviadas ao backend

**Arquivo:** `src/pages/Checkout/index.tsx`
O Step 3 coleta `data.observacoes` via formulário, mas `criarPedido.mutateAsync()` não inclui esse campo no payload.
**Impacto:** 🟡 MÉDIO — mensagens do cliente ao prestador se perdem

---

### GAP-013 · Checkout — remoção de cupom não disponível

**Arquivo:** `src/pages/Checkout/index.tsx` (Step 4)
`removerCupom` está definido no hook mas não há nenhum botão/link na UI para acionar a remoção de cupom durante o checkout. Uma vez aplicado, o cupom só pode ser removido voltando ao carrinho.
**Impacto:** 🟡 MÉDIO — usuário fica "preso" ao cupom

---

### GAP-014 · Conta/index.tsx não existe

**Arquivo:** `src/pages/Conta/` (ausente)
Não existe página de índice para a seção "Minha Conta". As subpáginas (`Enderecos`, `Avaliacoes`, `Senha`) são isoladas sem dashboard de navegação comum.
**Impacto:** 🟡 MÉDIO — não existe entrada clara para a área da conta

---

### GAP-015 · `Conta/Avaliacoes.tsx` exibe avaliações de **prestador**, não de cliente

**Arquivo:** `src/pages/Conta/Avaliacoes.tsx` (linhas 29–32)
A página busca `avaliacoesService.doPrestador(user?.id)` — avaliações *recebidas* pelo prestador. Para clientes comuns (sem conta de prestador), a lista estará sempre vazia. O título "Minhas avaliações" induz a erro.
**Impacto:** 🟡 MÉDIO — UX enganosa

---

### GAP-016 · RecuperarSenha — token não validado antes de exibir o formulário

**Arquivo:** `src/pages/Auth/RecuperarSenha.tsx`
O token é lido via query string, mas o formulário de redefinição é exibido imediatamente sem verificar se o token está presente/válido. Erros só aparecem no submit.
**Impacto:** 🟡 MÉDIO — UX confusa em links expirados

---

### GAP-017 · RecuperarSenha — sem feedback de resultado do envio de e-mail

**Arquivo:** `src/pages/Auth/RecuperarSenha.tsx`
Após submeter o e-mail, a tela mostra "verifique seu e-mail" sem diferenciar sucesso, e-mail não cadastrado ou erro de rede.
**Impacto:** 🟡 MÉDIO — usuário não sabe se a recuperação funcionou

---

### GAP-018 · Busca (`/busca`) sem ponto de entrada na navegação

**Arquivo:** `src/pages/Busca/index.tsx`, `src/components/layout/TopBar`
A rota `/busca` existe e a página está implementada, mas não há campo de busca na TopBar ou Bottom Nav que redirecione para ela. A feature existe mas é inacessível.
**Impacto:** 🟡 MÉDIO — feature morta

---

### GAP-019 · Avaliação de pedido usando `localStorage` como fallback

**Arquivo:** `src/pages/Pedidos/Detalhe.tsx` (linhas 191–193)
O campo `pedido.avaliado` deveria vir do backend, mas como retorno não é confiável, o código usa `localStorage("arcaika_avaliado_${id}")` como workaround. Estado de avaliação se perde ao limpar o browser.
**Impacto:** 🟡 MÉDIO — estado frágil

---

### GAP-020 · NovaCotacao — validação de `cidade` ausente no Step 3

**Arquivo:** `src/pages/Orcamentos/Novo.tsx`
`canNext()` valida `descricao.length >= 30` mas não verifica se o campo `cidade` foi preenchido no Step 3 (localidade). Usuário pode avançar sem cidade selecionada.
**Impacto:** 🟡 MÉDIO — formulário inválido chega ao backend

---

### GAP-021 · Slider de orçamento em NovaCotacao — range pode ficar inválido

**Arquivo:** `src/pages/Orcamentos/Novo.tsx` (linhas 259–266)
Não há garantia de `min <= max` após ajuste manual dos sliders. O backend pode receber `orcamento_minimo > orcamento_maximo`.
**Impacto:** 🟡 MÉDIO — dado inconsistente

---

### GAP-022 · Checkout — defaulting do período usa `||` após type cast (bug sutil)

**Arquivo:** `src/pages/Checkout/index.tsx` (linha 269)
```typescript
periodo: data.periodo as 'manha' | 'tarde' || 'manha'
```
`as` não é uma operação de runtime; o `||` avalia `data.periodo` após o cast, mas se `data.periodo` for string vazia `""` (falsy) o default funciona. Se for `undefined`, o cast retorna `undefined` e o `||` entra. Comportamento correto, mas frágil e não-intencional. Trocar por nullish coalescing: `data.periodo ?? 'manha'`.
**Impacto:** 🟢 BAIXO — funciona acidentalmente, mas pode quebrar com refactor

---

### GAP-023 · `pedido.data_agendada` vs `data_desejada` — nomes inconsistentes

**Arquivo:** `src/types/domain.ts` (linha 19), `src/pages/Pedidos/Detalhe.tsx` (linha 284)
O type domain define `data_agendada` mas o checkout envia `data_desejada`. Na exibição do pedido, o campo pode não estar disponível.
**Impacto:** 🟡 MÉDIO — data agendada não exibida no detalhe do pedido

---

## 4. Gerenciamento de Estado e Hooks

### GAP-024 · `carrinhoStore` é uma abstração desnecessária

**Arquivo:** `src/stores/carrinhoStore.ts`
O store só guarda `itemCount: number`. Os dados reais do carrinho são buscados via `useCarrinho()` (React Query). O store está quase completamente ocioso e pode causar inconsistência se `itemCount` divergir da contagem real retornada pela API.
**Impacto:** 🟢 BAIXO — code smell, possível fonte futura de bug

---

### GAP-025 · Race condition em `locationStore` no carregamento do Marketplace

**Arquivo:** `src/stores/locationStore.ts`, `src/pages/Marketplace/index.tsx` (linha 49)
A `localidade` salva no `locationStore` (via localStorage) pode não estar hidratada quando o Marketplace executa a primeira query. O componente pode fazer o fetch sem o filtro de localização.
**Impacto:** 🟡 MÉDIO — resultados aparecem sem filtro de localidade na primeira visita

---

### GAP-026 · `onSettled` em vez de `onSuccess` em mutação de atualização de quantidade

**Arquivo:** `src/pages/Carrinho/index.tsx` (linhas 48–52)
A mutation `atualizarQtd` usa `onSettled` para invalidar a query do carrinho, o que acontece tanto em sucesso quanto em falha. Em caso de erro, a UI pode mostrar brevemente a quantidade errada antes de re-fetch.
**Impacto:** 🟡 MÉDIO — estado transitório incorreto após erro

---

## 5. Tipagem e Domain Types

### GAP-027 · `Pagamento.status` não exibido na tela de detalhe do pedido

**Arquivo:** `src/types/domain.ts`, `src/pages/Pedidos/Detalhe.tsx` (linha 308)
O tipo `Pagamento` tem `status: PagamentoStatus` mas a página só exibe `pagamento.metodo`. O status do pagamento (aprovado, pendente, recusado) não é visível ao usuário.
**Impacto:** 🟡 MÉDIO — usuário não vê se o pagamento foi processado

---

### GAP-028 · `Servico.tags` sem type guard

**Arquivo:** `src/types/domain.ts`, `src/pages/Marketplace/ServicoDetalhe.tsx` (linha 175)
`tags?: string[]` é assumido como array de strings, mas sem type guard no render. Se o backend retornar formato diferente, o render falha silenciosamente.
**Impacto:** 🟢 BAIXO

---

### GAP-029 · `Cupom` sem campo de descrição

**Arquivo:** `src/types/domain.ts`, `src/pages/Carrinho/index.tsx`
O tipo `Cupom` não inclui campo de descrição ou título. O usuário vê apenas o código e o desconto, sem saber o que o cupom representa.
**Impacto:** 🟢 BAIXO

---

## 6. Endpoints Não Utilizados pelo Frontend

Os seguintes endpoints existem no backend mas não têm chamada correspondente no frontend cliente:

| Endpoint | Router | Observação |
|----------|--------|------------|
| `POST /auth/recuperar-senha` | `auth.py` | RecuperarSenha envia e-mail mas não chama esse endpoint |
| `POST /auth/redefinir-senha` | `auth.py` | Idem — não há chamada no frontend |
| `GET /marketplace/recomendacoes/{job_id}` | `marketplace.py` | Polling do job assíncrono não implementado |
| Todos os endpoints `/orcamentos/*` (organização) | `orcamentos.py` | São para o lado do prestador/organização, não do cliente |
| `DELETE /avaliacoes/{id}` | `avaliacoes.py` | Nenhuma página oferece UI para deletar avaliação |
| `GET /clientes/me/enderecos/{id}` | `clientes.py` | Detalhe de endereço individual nunca buscado |

---

## 7. Tabela Resumo por Prioridade

| ID | Descrição | Área | Severidade |
|----|-----------|------|-----------|
| GAP-001 | `Conta/Perfil.tsx` não existe — crash em runtime | Pages | 🔴 ALTO |
| GAP-002 | Marketplace sem paginação | Pages | 🔴 ALTO |
| GAP-003 | Login sem feedback de erro | Auth Flow | 🔴 ALTO |
| GAP-004 | `POST /pedidos/` — payload incompatível com backend | API | 🔴 ALTO |
| GAP-005 | `POST /cotacoes/` — campos errados | API | 🔴 ALTO |
| GAP-006 | Recomendações marketplace são async (202) — frontend trata como sync | API | 🔴 ALTO |
| GAP-007 | CPF e telefone opcionais no frontend, obrigatórios no backend | API | 🟡 MÉDIO |
| GAP-008 | `referencia_id` vs `alvo_id` em avaliações | API | 🟡 MÉDIO |
| GAP-009 | Response de recomendações do Arky com shape errada | API | 🟡 MÉDIO |
| GAP-011 | Cadastro — endereço coletado mas descartado | Pages | 🟡 MÉDIO |
| GAP-012 | Checkout — `observacoes` nunca enviadas | Pages | 🟡 MÉDIO |
| GAP-013 | Checkout — sem botão para remover cupom | Pages | 🟡 MÉDIO |
| GAP-014 | `Conta/index.tsx` não existe | Pages | 🟡 MÉDIO |
| GAP-015 | Avaliações da conta exibem reviews de prestador, não de cliente | Pages | 🟡 MÉDIO |
| GAP-016 | RecuperarSenha — token não validado antes do formulário | Auth Flow | 🟡 MÉDIO |
| GAP-017 | RecuperarSenha — sem feedback do envio de e-mail | Auth Flow | 🟡 MÉDIO |
| GAP-018 | Rota `/busca` sem ponto de entrada na navegação | Navigation | 🟡 MÉDIO |
| GAP-019 | Status "avaliado" via localStorage | State | 🟡 MÉDIO |
| GAP-020 | NovaCotacao — cidade não validada no Step 3 | Forms | 🟡 MÉDIO |
| GAP-021 | Sliders de orçamento podem ficar inválidos | Forms | 🟡 MÉDIO |
| GAP-023 | `data_agendada` vs `data_desejada` — inconsistência | Types | 🟡 MÉDIO |
| GAP-025 | Race condition de localidade no Marketplace | State | 🟡 MÉDIO |
| GAP-026 | `onSettled` em vez de `onSuccess` no carrinho | State | 🟡 MÉDIO |
| GAP-027 | Status de pagamento não exibido no detalhe do pedido | Pages | 🟡 MÉDIO |
| GAP-010 | `servico_vinculado_id` nunca enviado ao carrinho | API | 🟢 BAIXO |
| GAP-022 | Defaulting de período com operador frágil | Pages | 🟢 BAIXO |
| GAP-024 | `carrinhoStore` é redundante | State | 🟢 BAIXO |
| GAP-028 | `Servico.tags` sem type guard | Types | 🟢 BAIXO |
| GAP-029 | `Cupom` sem campo de descrição | Types | 🟢 BAIXO |

---

*Documento gerado por análise estática. Nenhuma execução de código foi necessária.*
