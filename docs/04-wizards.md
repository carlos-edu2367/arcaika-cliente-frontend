# 04 — Wizards (Fluxos Multi-Step)

Wizards são fluxos de múltiplos passos com navegação linear (back/forward), barra de progresso, validação por step e recuperação de estado em caso de erro. Todos os wizards do Arcaika seguem o mesmo padrão de implementação.

---

## Padrão Arquitetural dos Wizards

### Gerenciamento de estado

Cada wizard usa **estado local** (via `useReducer` + `useContext`) para os dados entre passos. O estado **não** vai para o Zustand global, pois é efêmero e específico do fluxo.

```
WizardProvider (Context + Reducer)
  └── WizardShell (barra de progresso + botões back/next)
        ├── Step1Component
        ├── Step2Component
        ├── Step3Component
        └── StepConfirmacao
```

O `WizardProvider` expõe:
- `currentStep: number`
- `data: WizardData` — acumulação dos dados de todos os steps
- `goToNext(stepData: Partial<WizardData>)` — valida o step atual e avança
- `goToPrev()` — volta sem validar
- `goToStep(n: number)` — navegação direta (apenas para steps já visitados)

### Validação por step

Cada step tem um schema Zod próprio. O botão "Próximo" não fica desabilitado por padrão (evita frustração), mas ao clicar, dispara a validação e exibe erros inline se inválido.

Exemplo de schema do Step 1 do cadastro:
```
const step1Schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos 1 letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos 1 número'),
})
```

### Barra de progresso

Componente `WizardProgress` visual: círculos numerados conectados por linha. Step atual em laranja cheio. Steps completados com ícone de check verde. Steps futuros em cinza vazio.

No mobile, exibe apenas "Passo 2 de 5" em texto (os círculos ficariam muito pequenos).

### Navegação back/forward

- **"Voltar"**: navega para o passo anterior sem perder dados. Não valida o passo atual ao voltar.
- **"Próximo"**: valida o step atual antes de avançar.
- **"Cancelar"**: abre `ModalConfirmacao` ("Tem certeza? Seu progresso será perdido.") antes de descartar.

### Recuperação de estado (rascunho)

Para wizards longos (checkout, orçamento), o estado é salvo em `sessionStorage` a cada mudança de step. Se o usuário recarrega a página, o wizard é restaurado no último step preenchido.

Chave de exemplo: `arcaika:wizard:checkout` com os dados serializados. O rascunho expira ao finalizar o wizard ou ao fechar a aba.

---

## Wizard 1 — Contratar Serviço (Checkout)

**Rota:** `/checkout`
**Componente raiz:** `CheckoutWizard`
**Endpoint final:** `POST /pedidos/` → `POST /pedidos/:id/pagamento`

### Passo 1 — Revisar serviço selecionado

**Componente:** `CheckoutStep1Revisao`

**O que exibe:**
- Imagem, nome e descrição curta do serviço (lidos do carrinho)
- Preço base + descontos já aplicados
- Botão "Editar carrinho" (link para `/carrinho`, sai do checkout)
- Resumo de todos os itens do carrinho com quantidade e subtotal

**Validação:** nenhuma (apenas revisão). Botão "Próximo" sempre habilitado.

**UX:** sem formulário nesse passo. Layout limpo de confirmação visual.

---

### Passo 2 — Selecionar endereço de entrega/execução

**Componente:** `CheckoutStep2Endereco`
**Dados carregados:** `GET /clientes/me/enderecos/:id`

**O que exibe:**
- Lista de endereços cadastrados como radio cards (selecionar um)
- Botão "Usar novo endereço" abre formulário inline de novo endereço (sem sair do wizard)
- Badge "Principal" no endereço padrão

**Validação (Zod):**
```
enderecoSchema = z.object({
  endereco_id: z.string().uuid('Selecione um endereço válido'),
})
```

**UX:** se o cliente não tem nenhum endereço cadastrado, o formulário de novo endereço aparece automaticamente aberto.

---

### Passo 3 — Escolher data e horário preferencial

**Componente:** `CheckoutStep3Agendamento`

**O que exibe:**
- Calendário de seleção de data (mínimo: amanhã)
- Seletor de período: Manhã (8h–12h), Tarde (13h–18h)
- Campo de texto opcional: "Observações para o prestador"

**Validação:**
```
agendamentoSchema = z.object({
  data_preferencial: z.date().min(amanha, 'Data deve ser a partir de amanhã'),
  periodo: z.enum(['manha', 'tarde']),
  observacoes: z.string().max(500).optional(),
})
```

**UX:** o campo de data usa um componente de calendário nativo com `min` setado para amanhã. No mobile, usa o input `type="date"` nativo para aproveitar o seletor do sistema.

---

### Passo 4 — Resumo + cupom de desconto

**Componente:** `CheckoutStep4Resumo`
**Endpoints:** `POST /carrinho/cupom` (aplicar), `DELETE /carrinho/cupom` (remover)

**O que exibe:**
- Lista final de itens com preços
- Campo de cupom de desconto com botão "Aplicar"
- Breakdown de valores: subtotal, desconto, taxa de serviço, **total**
- Endereço selecionado (resumo)
- Data e período selecionados

**Validação:** nenhuma obrigatória. O campo de cupom tem validação própria inline.

**UX:** cupom inválido mostra mensagem em vermelho abaixo do campo. Cupom válido mostra desconto destacado em verde. O total é atualizado imediatamente ao aplicar/remover cupom.

---

### Passo 5 — Pagamento

**Componente:** `CheckoutStep5Pagamento`
**Endpoint:** `POST /pedidos/:id/pagamento`

**Pagamento pelo mercado pago, api deve fornecer checkout_url**

---

### Confirmação — Pedido realizado

**Componente:** `CheckoutConfirmacao`

**O que exibe:**
- Animação Lottie de check verde (✓ animado)
- "Pedido #12345 realizado com sucesso!"
- Resumo: serviço, data, valor total
- Botão "Acompanhar pedido" → `/pedidos/:id`
- Botão "Continuar comprando" → `/marketplace`

**UX:** após mostrar a confirmação, limpar o estado do wizard e invalidar o cache do carrinho (`queryClient.invalidateQueries(['carrinho'])`).

---

## Wizard 2 — Solicitar Orçamento

**Rota:** `/orcamentos/novo`
**Componente raiz:** `OrcamentoWizard`
**Endpoint final:** `POST /cotacoes/`

### Passo 1 — Categoria do serviço

**Componente:** `OrcamentoStep1Categoria`
**Dados carregados:** `GET /marketplace/categorias`

**O que exibe:** grid de cards de categoria com ícone e nome. Seleção única (radio visual).

Subcategorias aparecem ao selecionar a categoria pai (lista expansível ou segundo nível de seleção).

**Validação:**
```
{ categoria_id: z.string().uuid('Selecione uma categoria') }
```

---

### Passo 2 — Descrição detalhada

**Componente:** `OrcamentoStep2Descricao`

**O que exibe:**
- `<textarea>` "Descreva o serviço que você precisa" (mínimo 30, máximo 2000 caracteres)
- Contador de caracteres (ex: "150/2000")
- Upload de fotos/anexos: drag-and-drop + clique. Aceita JPG, PNG, PDF. Máximo 5 arquivos, 10MB cada.
- Preview dos arquivos enviados com botão de remoção.

**Validação:**
```
descricaoSchema = z.object({
  descricao: z.string().min(30, 'Descreva com pelo menos 30 caracteres').max(2000),
  anexos: z.array(z.instanceof(File)).max(5, 'Máximo 5 arquivos').optional(),
})
```

**UX:** os arquivos são enviados no `POST /cotacoes/` como `multipart/form-data`. Enquanto o upload ocorre, barra de progresso por arquivo.

---

### Passo 3 — Localidade e data desejada

**Componente:** `OrcamentoStep3LocalidadeData`

**O que exibe:**
- Campo de CEP (autopreenchimento de cidade/estado)
- Campo de cidade + estado (editável)
- "Aceito atendimento remoto?" (checkbox)
- Seleção de data: calendário ou opção "Flexível" (sem data definida)

**Validação:**
```
localidadeSchema = z.object({
  cidade: z.string().min(2),
  estado: z.string().length(2),
  aceita_remoto: z.boolean(),
  data_desejada: z.date().optional().nullable(),
})
```

---

### Passo 4 — Orçamento estimado (range)

**Componente:** `OrcamentoStep4Orcamento`

**O que exibe:**
- Slider de faixa de preço: min e max (ex: R$200 — R$800)
- Opção "Não sei / Quero as melhores ofertas" (desmarca o slider)
- Texto: "Prestadores com orçamentos nessa faixa serão priorizados"

**Validação:** opcional. Se "Não sei" marcado, `orcamento_min` e `orcamento_max` são `null`.

---

### Passo 5 — Revisão e envio

**Componente:** `OrcamentoStep5Revisao`

**O que exibe:**
- Resumo de todas as informações: categoria, descrição (truncada com "ver mais"), localidade, data, faixa de valor, anexos (lista de nomes).
- Botão "Editar" em cada seção (navega direto para o passo correspondente via `goToStep(n)`).

**UX:** o botão final é "Enviar solicitação" (não "Próximo"). Após envio: estado de loading no botão.

---

### Confirmação — Orçamento enviado

**Componente:** `OrcamentoConfirmacao`

**O que exibe:**
- Ícone de envelope enviado (laranja)
- "Solicitação enviada! Prestadores irão analisar e enviar propostas."
- "Você receberá uma notificação quando houver propostas."
- Botão "Ver minha solicitação" → `/orcamentos/:id`
- Botão "Solicitar outro orçamento" (reinicia o wizard)

---

## Wizard 3 — Cadastro de Cliente

**Rota:** `/auth/cadastro`
**Componente raiz:** `CadastroWizard`
**Endpoint final:** `POST /auth/cliente`

### Passo 1 — Dados de acesso

**Componente:** `CadastroStep1Acesso`

**Campos:**
- Nome completo
- Email
- Senha (com indicador de força: fraca/média/forte)
- Confirmar senha

**Validação:**
```
acessoSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email(),
  senha: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmar_senha: z.string(),
}).refine(d => d.senha === d.confirmar_senha, {
  message: 'As senhas não coincidem',
  path: ['confirmar_senha'],
})
```

**UX:** verificação de email duplicado via debounce de 500ms após sair do campo (`onBlur`). Se email já cadastrado, erro inline "Este email já está em uso. Fazer login?".

---

### Passo 2 — Dados pessoais

**Componente:** `CadastroStep2DadosPessoais`

**Campos:**
- CPF (máscara XXX.XXX.XXX-XX, validação de dígitos verificadores)
- Telefone (máscara (XX) XXXXX-XXXX)
- Data de nascimento (deve ser maior de 18 anos)

**Validação:**
```
dadosPessoaisSchema = z.object({
  cpf: z.string().refine(validarCPF, 'CPF inválido'),
  telefone: z.string().length(15, 'Telefone inválido'),
  data_nascimento: z.date().max(
    subYears(new Date(), 18),
    'É necessário ter ao menos 18 anos'
  ),
})
```

---

### Passo 3 — Endereço principal

**Componente:** `CadastroStep3Endereco`

**Campos:**
- CEP (autopreenchimento)
- Rua / Logradouro
- Número
- Complemento (opcional)
- Bairro
- Cidade
- Estado (select com UFs)

**Validação:** todos obrigatórios exceto complemento. CEP validado via regex `\d{5}-\d{3}`.

**UX:** ao preencher CEP válido, os campos de rua, bairro, cidade e estado são preenchidos automaticamente via API pública de CEP (ViaCEP ou similar). O usuário pode editar os campos preenchidos.

---

### Confirmação — Bem-vindo à Arcaika

**Componente:** `CadastroConfirmacao`

**O que exibe:**
- Animação de confete ou ilustração festiva
- "Bem-vindo(a), [Nome]! Sua conta foi criada com sucesso."
- Botão "Começar a explorar" → `/marketplace`
- Botão "Ver tour da plataforma" (abre modal de onboarding com 3 slides)

**Ação automática:** o usuário já está logado após o cadastro (o backend retorna token no `POST /auth/cliente`). Não é necessário fazer login separado.

**Tour opcional:** `ModalOnboarding` com 3 slides:
1. "Encontre serviços perto de você"
2. "Solicite orçamentos de múltiplos prestadores"
3. "Converse com a Arky, sua assistente IA"

O tour pode ser pulado e acessado novamente via ajuda.
