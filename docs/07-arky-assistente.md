# 07 — Arky Assistente de IA

A **Arky** é a assistente de inteligência artificial da plataforma Arcaika. Ela ajuda clientes a encontrar serviços, esclarecer dúvidas sobre pedidos, sugerir prestadores e orientar no uso da plataforma.

---

## Posicionamento e comportamento geral

- **Localização:** botão flutuante no canto inferior direito da tela (FAB — Floating Action Button)
- **Visibilidade:** presente em todas as páginas, exceto durante o wizard de checkout (para não distrair o usuário na finalização do pedido)
- **Requisito de auth:** Arky exige login. Usuários não autenticados veem o FAB, mas ao clicar, recebem um modal de login

---

## Componentes

### `ArkyButton` (FAB)

Arquivo: `src/features/arky/components/ArkyButton.tsx`

**Aparência:**
- Círculo de 56px de diâmetro, fundo `#F97316` (laranja), sombra `shadow-xl`
- Letra "A" centralizada em branco bold, ou ícone de chat (a definir com design)
- Posição: `fixed bottom-6 right-6` (mobile) / `fixed bottom-8 right-8` (desktop)
- Z-index: 50 (acima do conteúdo, abaixo de modais)

**Estado com notificação:** quando o usuário tem mensagem não lida ou recomendação nova, exibe badge vermelho no canto superior direito do FAB (ponto vermelho pulsante de 10px).

**Animações:**
- Entrada inicial: scale de 0 → 1 com bounce (500ms, delay de 2s após carregamento da página)
- Hover: scale 1.05 com sombra maior
- Click: scale 0.95 momentâneo (feedback tátil)

**Acessibilidade:**
- `aria-label="Abrir chat com a Arky"`
- `role="button"`
- Foco visível com ring laranja

---

### `ArkyLoginModal`

Exibido para usuários não autenticados que clicam no FAB.

**Conteúdo:**
- Avatar da Arky (círculo laranja com "A")
- Título: "Olá! Sou a Arky 👋"
- Texto: "Para conversar comigo e receber recomendações personalizadas, faça login na sua conta."
- Botão primário: "Fazer login" → `/auth/login`
- Botão secundário: "Criar conta grátis" → `/auth/cadastro`
- Botão X para fechar

**Trigger:** `uiStore.openLoginModal('Para falar com a Arky, faça login')` ao clicar no FAB sem auth.

---

### `ArkyDrawer`

Arquivo: `src/features/arky/components/ArkyDrawer.tsx`

Aparece apenas para usuários autenticados. Abre como um **drawer lateral** (painel deslizante da direita).

**Dimensões:**
- Mobile: cobre 100% da largura e 80% da altura (sheet bottom-up)
- Desktop: painel lateral de 420px de largura, altura 100vh, fixo à direita

**Estrutura interna:**

```
ArkyDrawer
├── ArkyHeader
│   ├── Avatar (círculo laranja "A")
│   ├── "Arky" (nome)
│   ├── "Assistente Arcaika" (subtítulo cinza)
│   ├── Indicador online (bolinha verde pulsante)
│   └── Botão fechar (X)
├── MensagensContainer (scroll vertical)
│   ├── MensagemArky (bolha assistente, esquerda)
│   ├── MensagemUsuario (bolha usuário, direita)
│   └── TypingIndicator (quando Arky está respondendo)
├── SugestoesRapidas (apenas quando sem histórico)
│   └── ChipSugestao[] (clicáveis)
└── InputContainer
    ├── Input de texto ("Pergunte algo para a Arky...")
    └── Botão enviar (ícone de seta, laranja)
```

---

### `MensagemArky` e `MensagemUsuario`

Arquivo: `src/features/arky/components/MensagemChat.tsx`

**Bolha da Arky (esquerda):**
- Avatar pequeno (24px) à esquerda
- Fundo `#F3F4F6` (cinza claro), texto `#111827`
- `border-radius: 0 12px 12px 12px` (canto superior esquerdo reto)
- Timestamp abaixo à direita da bolha

**Bolha do usuário (direita):**
- Sem avatar
- Fundo `#F97316` (laranja), texto `#FFFFFF`
- `border-radius: 12px 0 12px 12px` (canto superior direito reto)
- Timestamp abaixo à esquerda da bolha

**Formatação de conteúdo:** as respostas da Arky suportam markdown básico (negrito, itálico, listas). Renderizado com um parser leve como `react-markdown` ou parseable manualmente para evitar dependência pesada.

---

### `TypingIndicator`

Arquivo: `src/features/arky/components/TypingIndicator.tsx`

Três pontos que animam em sequência (efeito "bolinhas saltando"):
- Aparece enquanto `isTyping === true` no estado do `useArky` hook
- Ocupa o espaço de uma bolha da Arky (fundo cinza, mesma largura mínima)
- Acessibilidade: `aria-label="Arky está digitando..."` com `role="status"`

Animação CSS:
```css
.dot:nth-child(1) { animation-delay: 0ms; }
.dot:nth-child(2) { animation-delay: 150ms; }
.dot:nth-child(3) { animation-delay: 300ms; }
/* Keyframe: translateY(-4px) por 300ms, volta em 300ms */
```

---

### `SugestoesRapidas`

Chips clicáveis com perguntas frequentes. Exibidos apenas quando o histórico de mensagens está vazio (estado inicial do chat).

**Chips padrão:**
- "Como funciona o Arcaika?"
- "Quero contratar um serviço"
- "Como solicitar um orçamento?"
- "Quais são os serviços mais populares?"
- "Como cancelar um pedido?"

**Comportamento:** ao clicar em um chip, o texto do chip é enviado como mensagem do usuário (igual a digitar e enviar manualmente). Os chips desaparecem após a primeira mensagem.

---

## Integração com API

### `POST /assistente/chat`

Payload:
```json
{
  "mensagem": "Como faço para contratar um serviço de limpeza?"
}
```

Resposta:
```json
{
  "resposta": "Para contratar um serviço de limpeza, você pode...",
  "recomendacoes": [
    { "servico_id": "abc123", "nome": "Limpeza Residencial Premium", ... }
  ]
}
```

Se `recomendacoes` não for vazia, os cards de recomendação aparecem abaixo da bolha de resposta da Arky (carousel horizontal de `ServiceCard` compactos).

### `POST /assistente/recomendacoes`

Usado para carregar recomendações proativas ao abrir o drawer (ex: "Baseado nos seus pedidos, você pode gostar de..."). Executado uma vez por sessão, resultado cacheado em sessionStorage.

### `GET /assistente/info`

Retorna nome, versão e mensagem de apresentação da Arky. Usado na primeira abertura do drawer.

---

## Persistência de histórico

O histórico de mensagens é salvo em `sessionStorage` (chave `arcaika:arky:historico`):
- Persiste durante a sessão do navegador (mesma aba)
- É perdido ao fechar a aba ou o navegador
- **Não** sincronizado com o servidor (histórico é efêmero)
- Máximo de 50 mensagens armazenadas; mensagens mais antigas são removidas pelo FIFO

Ao abrir o drawer após ter histórico, o scroll vai automaticamente para a última mensagem.

---

## Scroll automático

Quando uma nova mensagem é adicionada (do usuário ou da Arky):
```
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
```

Um `div` invisível (`messagesEndRef`) fica ao final da lista de mensagens. O scroll suave garante que o usuário sempre veja a mensagem mais recente.

---

## Estado de erro

Quando `POST /assistente/chat` retorna erro:

1. Toast: "Arky está indisponível no momento. Tente novamente."
2. O indicador online muda de verde para cinza ("Offline")
3. Botão "Tentar novamente" aparece abaixo da última mensagem do usuário (retry da mesma mensagem)
4. Após 3 falhas consecutivas, exibe mensagem persistente no chat: "Arky está com instabilidade no momento. Nossa equipe já foi notificada."

---

## Ocultar em páginas específicas

O `ArkyButton` é ocultado nas seguintes condições:

| Página/condição | Motivo |
|---|---|
| `/checkout` | Não distrair o usuário na finalização do pedido |
| Modal/drawer aberto fullscreen | Sobreposição visual desnecessária |
| Teclado virtual aberto no mobile | FAB pode cobrir o input de formulário |

Implementação: o `RootLayout` verifica a rota atual e condicionalmente renderiza o `ArkyButton`.

---

## Personalidade e tom da Arky

- **Tom:** prestativo, direto, levemente amigável. Não excessivamente informal.
- **Nome:** sempre "Arky" (não "IA", não "assistente virtual", não "robô")
- **Não promete:** a Arky não garante prazos, preços ou disponibilidade de prestadores — apenas orienta
- **Erros admitidos:** se não souber responder, Arky indica onde o usuário pode encontrar ajuda (ex: "Veja sua página de pedidos para detalhes atualizados")
