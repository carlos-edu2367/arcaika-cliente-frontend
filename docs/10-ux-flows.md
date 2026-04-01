# 10 — UX Flows

Diagramas textuais dos fluxos principais do usuário. Cada fluxo documenta o caminho feliz, variações e pontos de decisão críticos.

Legenda:
- `[ ]` — Página ou tela
- `( )` — Ação do usuário
- `{ }` — Decisão / condição do sistema
- `→` — Sequência direta
- `⇢` — Redirecionamento automático do sistema
- `↩` — Retorno / volta

---

## Fluxo 1 — Compra de Serviço

**Objetivo:** usuário descobre um serviço e o contrata.

```
[Home /]
  (clica em categoria ou busca por termo)
    ↓
[Marketplace /marketplace?categoria=limpeza]
  (navega pelos cards de serviço)
  (passa o mouse → prefetch do detalhe em background)
  (clica no card de serviço)
    ↓
[Detalhe do Serviço /marketplace/servico/:id]
  (vê galeria, descrição, avaliações, preço)
    ↓
  { usuário está logado? }
    ├── NÃO → [Modal de Login] "Faça login para contratar"
    │           (clica "Fazer login") → [Login /auth/login]
    │             (entra com credenciais) ⇢ [Detalhe do Serviço] (retorna)
    │             { intenção salva em sessionStorage: 'adicionar ao carrinho' }
    │             (ação pendente é executada automaticamente)
    │                 ↓
    └── SIM → (clica "Adicionar ao carrinho")
                  ↓
              { item já está no carrinho? }
                ├── SIM → Toast "Serviço já está no carrinho" + botão "Ver carrinho"
                └── NÃO → Toast "Adicionado ao carrinho ✓" + badge atualiza (+1)
                              ↓
[Carrinho /carrinho]
  (revisa itens, ajusta quantidade, aplica cupom)
  (clica "Finalizar pedido")
    ↓
[Checkout /checkout] — Wizard de 5 passos
  Passo 1: Revisar serviços no carrinho
  Passo 2: Selecionar endereço de execução
  Passo 3: Escolher data e horário preferencial
  Passo 4: Resumo + cupom de desconto
  Passo 5: Pagamento (cartão / PIX / boleto)
    ↓
  { pagamento aprovado? }
    ├── NÃO (cartão recusado) → Toast de erro + permanece no passo 5
    │                            "Cartão recusado. Verifique os dados ou use outro método."
    └── SIM → [Confirmação de Pedido]
                  "Pedido #12345 realizado com sucesso!"
                  Animação de check ✓
                      ↓
[Detalhe do Pedido /pedidos/12345]
  (acompanha status do pedido via timeline)
  (pedido concluído?) → fluxo de avaliação
```

### Variações

**Usuário volta ao carrinho antes de finalizar:**
O carrinho é persistido no servidor — os itens estão lá quando o usuário retornar, mesmo em outra sessão.

**Timeout de sessão durante o checkout:**
O interceptor detecta 401, tenta refresh. Se falhar, exibe modal "Sua sessão expirou. Faça login para continuar" — o wizard é preservado em sessionStorage e restaurado após o re-login.

---

## Fluxo 2 — Solicitação de Orçamento

**Objetivo:** usuário não sabe exatamente o preço e quer receber propostas de múltiplos prestadores.

```
[Qualquer página]
  (descobre que existe funcionalidade de orçamento via: banner na home,
   botão "Solicitar orçamento" no detalhe de serviço, ou item no menu)
    ↓
  { usuário está logado? }
    ├── NÃO → [Modal de Login] → [Login] ⇢ retorna ao ponto de entrada
    └── SIM ↓

[Novo Orçamento /orcamentos/novo] — Wizard de 5 passos
  Passo 1: (seleciona categoria: ex. "Reformas > Pintura")
    ↓
  Passo 2: (descreve o serviço necessário em detalhes)
           (opcional: faz upload de fotos do local/referência)
    ↓
  Passo 3: (informa CEP / cidade)
           (marca se aceita atendimento remoto)
           (seleciona data desejada ou marca "Flexível")
    ↓
  Passo 4: (define faixa de orçamento: R$300 — R$800)
           (ou marca "Não sei, quero as melhores ofertas")
    ↓
  Passo 5: (revisa todas as informações)
           (clica "Enviar solicitação")
    ↓
[Confirmação de Envio]
  "Solicitação enviada! Prestadores receberão sua solicitação."
  "Você será notificado quando houver propostas."
    ↓
[Detalhe da Cotação /orcamentos/:id]
  (aguarda propostas)

  { chegou proposta? }
    ├── NÃO → [estado vazio] "Nenhuma proposta ainda. Aguarde."
    │          (badge de notificação aparece na BottomNav quando chegar proposta)
    └── SIM → [lista de OrcamentoCard] — cada card com:
                  nome do prestador, rating, valor proposto, prazo, mensagem
                      ↓
              (compara propostas)
              (clica "Aceitar" em uma proposta)
                  ↓
              [Modal de Confirmação] "Tem certeza? Ao aceitar, os outros prestadores serão notificados."
              (confirma)
                  ↓
              { proposta aceita com sucesso }
              Toast "Orçamento aceito! O prestador entrará em contato."
                  ↓
[Status da cotação → "Aceito"]
  (o fluxo continua como um pedido gerado a partir do orçamento aceito)
```

### Variações

**Múltiplas propostas chegam:** o usuário pode rejeitar propostas individualmente (feedback opcional: "Fora do orçamento" / "Prazo inadequado" / "Outro") enquanto avalia as restantes.

**Nenhuma proposta em 48h:** exibe sugestão "Nenhum prestador respondeu ainda. Considere ampliar sua localidade ou aumentar a faixa de orçamento" com botão de editar a cotação.

---

## Fluxo 3 — Avaliação de Serviço

**Objetivo:** após conclusão de um pedido, o usuário avalia o prestador.

```
[Pedido concluído]
  { sistema detecta pedido com status "Concluído" sem avaliação }
    ↓
  [Notificação visual] — Badge/indicador no item do pedido na lista
  "Pedido concluído! Avalie o prestador."
    ↓
[Detalhe do Pedido /pedidos/:id]
  (clica "Avaliar prestador")
    ↓
[Modal de Avaliação]
  Componente: ModalAvaliacao

  Estrutura:
  ┌─────────────────────────────────────────┐
  │ [Avatar do prestador] [Nome]            │
  │ Como foi o serviço de [Nome]?           │
  │                                         │
  │ ★ ★ ★ ★ ★  (clique para selecionar)   │
  │                                         │
  │ [Textarea] "Conte sua experiência..."   │
  │ (opcional, max 500 caracteres)          │
  │                                         │
  │ [Cancelar]    [Enviar avaliação]        │
  └─────────────────────────────────────────┘

  (seleciona de 1 a 5 estrelas)
  (opcional: escreve comentário)
  (clica "Enviar avaliação") → POST /avaliacoes/
    ↓
  { sucesso }
  Toast "Avaliação enviada! Obrigado pelo seu feedback."
  Modal fecha.
    ↓
[Detalhe do Pedido] — botão "Avaliar" substituído por "Avaliação enviada ✓"
```

### Validações

- Estrelas: obrigatório selecionar de 1 a 5. O botão "Enviar" fica desabilitado sem seleção.
- Comentário: opcional, máximo 500 caracteres. Contador visível.
- Avaliação duplicada: impossível via UI (botão "Avaliar" some após avaliação enviada). O backend também rejeita com 422.

### Variações

**Avaliação de item/produto:**
Mesmo fluxo, mas o avaliado é o item, não o prestador.

**Avaliação de organização:**
Pedidos de organizações exibem opção de avaliar a organização em vez (ou além) do prestador individual.

**Excluir avaliação:**
Na página `/conta/avaliacoes`, cada avaliação tem botão "Excluir" → Modal de confirmação → `DELETE /avaliacoes/:id` → Toast de confirmação.

---

## Fluxo 4 — Recuperação de Senha

**Objetivo:** usuário esqueceu sua senha e precisa redefinir.

```
[Login /auth/login]
  (clica "Esqueci minha senha")
    ↓
[Recuperar Senha /auth/recuperar-senha]

  ─── Passo 1: Solicitar email ───────────────────────────
  [Input de email]
  (preenche email cadastrado)
  (clica "Enviar instruções")
    ↓
  POST /auth/recuperar-senha (endpoint a confirmar com backend)
    ↓
  { email cadastrado? }
    ├── NÃO → Por segurança, a mesma mensagem de sucesso é exibida
    │          (não revelar se o email existe ou não — enumeração de emails)
    └── SIM → Email enviado com link de recuperação

  [Tela de confirmação]
  "Enviamos um link para [email]. Verifique sua caixa de entrada."
  "Não recebeu? Reenviar em 60s" (countdown + botão reenviar)

  ─── Fora do app: usuário abre email ────────────────────
  (clica no link do email: https://arcaika.com.br/auth/recuperar-senha?token=abc123)
    ↓
  ─── Passo 2: Definir nova senha ────────────────────────
  { token válido e não expirado? }
    ├── NÃO → Tela de erro "Link inválido ou expirado"
    │          Botão "Solicitar novo link" → volta ao Passo 1
    └── SIM → [Formulário de nova senha]
                  [Input] Nova senha
                  [Input] Confirmar nova senha
                  [Indicador de força da senha]
                  Botão "Redefinir senha"
                    ↓
              POST /auth/redefinir-senha { token, nova_senha }
                    ↓
              { sucesso }
              Toast "Senha redefinida com sucesso!"
              ⇢ [Login /auth/login] (redireciona automaticamente)
              (campos de email pré-preenchidos com o email do token)
```

### Segurança

- O token de recuperação deve ter expiração curta (15-30 minutos) — definida pelo backend.
- O link é de uso único: após utilizado, o token é invalidado.
- A tela de confirmação de envio **não revela** se o email está cadastrado ou não (para evitar enumeração de emails).

---

## Fluxo 5 — Primeiro Acesso (Cadastro + Onboarding)

```
[Home /] ou [Qualquer página com CTA "Criar conta"]
  (clica "Criar conta grátis")
    ↓
[Cadastro /auth/cadastro] — Wizard de 3 passos
  Passo 1: Nome, email, senha
  Passo 2: CPF, telefone, data de nascimento
  Passo 3: Endereço principal
    ↓
  POST /auth/cliente
    ↓
  { sucesso → token retornado }
  authStore.setAuth(user, token)  — usuário já está logado
    ↓
[Confirmação de Cadastro]
  "Bem-vindo(a), [Nome]!"
  Botão "Começar a explorar"
  Botão "Ver tour rápido"
    ↓
  { clicou "Ver tour"? }
    ├── SIM → [ModalOnboarding] — 3 slides:
    │          Slide 1: "Encontre serviços perto de você" + CTA "Explorar"
    │          Slide 2: "Solicite orçamentos gratuitos" + CTA "Próximo"
    │          Slide 3: "Converse com a Arky, sua assistente" + CTA "Começar"
    │          (ao fechar) ⇢ [Marketplace /marketplace]
    └── NÃO → ⇢ [Marketplace /marketplace]
```

---

## Fluxo 6 — Gerenciamento de Endereços

```
[Conta /conta/enderecos]
  (lista de endereços cadastrados)

  ─── Adicionar ──────────────────────────────────────────
  (clica "Adicionar endereço")
    ↓
  [Modal EnderecoForm] abre
  (preenche CEP → autopreenchimento de rua/bairro/cidade/estado)
  (preenche número e complemento)
  (marca como "Endereço principal"?) — checkbox
  (clica "Salvar") → POST /clientes/me/enderecos/:id
    ↓
  Modal fecha, lista atualiza, toast "Endereço adicionado."

  ─── Editar ─────────────────────────────────────────────
  (clica ícone de editar em um EnderecoCard)
    ↓
  [Modal EnderecoForm] abre pré-preenchido
  (edita campos desejados)
  (clica "Salvar") → PUT /clientes/me/enderecos/:id
    ↓
  Modal fecha, lista atualiza, toast "Endereço atualizado."

  ─── Excluir ────────────────────────────────────────────
  (clica ícone de lixeira em um EnderecoCard)
    ↓
  [Modal de Confirmação] "Excluir este endereço?"
  (confirma) → DELETE /clientes/me/enderecos/:id
    ↓
  Modal fecha, card remove com animação, toast "Endereço removido."

  { endereço era o principal? }
    └── SIM → Toast adicional "Defina um novo endereço principal."
               O próximo endereço da lista é automaticamente definido como principal.
```

---

## Resumo dos Estados de Loading por Fluxo

| Tela | Estado de carregamento | Skeleton? |
|---|---|---|
| Listagem marketplace | `isLoading` inicial | ✅ Grid de SkeletonServiceCard |
| Detalhe de serviço | `isLoading` inicial | ✅ SkeletonServicoDetalhe |
| Carrinho | `isLoading` | ✅ SkeletonCarrinho |
| Lista de pedidos | `isLoading` | ✅ SkeletonPedidoCard × 3 |
| Detalhe de pedido | `isLoading` | ✅ SkeletonPedidoDetalhe |
| Confirmação de ação (botão) | `isPending` da mutation | Spinner no botão, botão desabilitado |
| Troca de passo em wizard | Transição visual | Spinner pequeno por 200ms máx |
