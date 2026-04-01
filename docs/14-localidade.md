# 14 — Feature: Marketplace por Localidade

**Data:** 26/03/2026
**Status:** ✅ Implementado
**TypeScript:** `npx tsc --noEmit` → 0 erros

---

## Motivação

O marketplace exibia todos os serviços cadastrados sem nenhum filtro geográfico, tornando a experiência irrelevante para o usuário — um morador de Goiânia via serviços de Porto Alegre sem contexto. A feature de localidade resolve isso mostrando apenas serviços disponíveis na cidade do usuário (e região), com a possibilidade de ampliar para todo o Brasil.

---

## Arquitetura da solução

### 1. `src/stores/locationStore.ts` — estado global persistido

Zustand store com `persist` middleware (localStorage key `arcaika_location`).

```ts
interface Localidade {
  cidade: string   // "Goiânia"
  estado: string   // "GO"
  label: string    // "Goiânia e Região, GO"
}

interface LocationStore {
  localidade: Localidade | null  // null = "Todo o Brasil"
  hasChosen: boolean             // true após qualquer escolha (inclusive "todos")
  isPickerOpen: boolean          // controla o modal

  setLocalidade(loc)  // salva e fecha o picker
  clearLocalidade()   // "Todo o Brasil" e fecha o picker
  openPicker()
  closePicker()
}
```

**Persistência seletiva:** apenas `localidade` e `hasChosen` são salvos. O estado do modal (`isPickerOpen`) é sempre `false` ao recarregar.

---

### 2. `src/components/location/LocationPicker.tsx` — modal de seleção

**Comportamento de abertura:**
- **Primeira visita** (`!hasChosen`): abre automaticamente ao montar no router. Não pode ser fechado sem fazer uma escolha (sem botão X, overlay não fecha).
- **Visitas seguintes**: abre apenas ao chamar `openPicker()` (TopBar, Marketplace, Busca). Tem botão X e fecha ao clicar no overlay.

**Formas de seleção:**
1. **Lista pré-carregada** de 31 cidades (todas as capitais + Aparecida de Goiânia, Anápolis, Campinas, Guarulhos). Pesquisável por nome, estado ou UF.
2. **Geolocalização**: botão "Usar minha localização" — chama `navigator.geolocation.getCurrentPosition()`, faz reverse geocode gratuito via **Nominatim/OpenStreetMap** (sem API key), preenche cidade e UF automaticamente.
3. **"Todo o Brasil"**: limpa o filtro — `clearLocalidade()`.

**UX:** Bottom sheet em mobile (`rounded-t-2xl`, `items-end`), modal centralizado em desktop (`sm:rounded-2xl`, `sm:items-center`).

---

### 3. Integração no router (`src/router/index.tsx`)

```tsx
<LocationPicker firstVisit />
```

Montado globalmente ao lado de `LoginModal`, `ArkyFAB` etc. O `firstVisit` ativa o bloqueio de fechamento na primeira visita.

---

### 4. TopBar (`src/components/layout/TopBar.tsx`)

- **Desktop:** chip clicável entre logo e campo de busca, mostra nome da cidade selecionada ou "Selecionar cidade". Ao clicar → `openPicker()`.
- **Mobile (ícone):** ícone de `MapPin` na barra de ações. Com cidade selecionada → ícone laranja.
- **Mobile (faixa):** banner laranja claro abaixo do TopBar mostrando `localidade.label` + link "Alterar". Aparece apenas quando `localidade !== null`.
- **Campo de busca:** placeholder dinâmico — "Buscar em Goiânia..." quando cidade definida.

---

### 5. Home (`src/pages/Home/index.tsx`)

- **Hero — título dinâmico:**
  - Com cidade: `"Serviços em Goiânia e região para você"`
  - Sem cidade: `"Encontre os melhores serviços perto de você"`
- **Hero — botão de localidade:** chip translúcido no hero "Goiânia e Região, GO" (ou "Definir minha cidade") → `openPicker()`.
- **Seção de destaques — título dinâmico:**
  - Com cidade: `"Destaques em Goiânia"` + subtítulo "Os mais bem avaliados na sua região"
  - Sem cidade: `"Serviços em destaque"`
- **Banner de call-to-action:** exibido **apenas quando** `localidade === null`. Convida o usuário a definir sua cidade com botão laranja.

---

### 6. Marketplace (`src/pages/Marketplace/index.tsx`)

- Passa `localidade: localidade?.cidade` para `MarketplaceParams` → API filtra pelo campo `localidade` do serviço.
- **Cabeçalho dinâmico:** "Serviços em Goiânia" + subtítulo "Goiânia e Região, GO" + botão "Alterar cidade".
- **Contagem:** "42 resultados em Goiânia".
- **Estado vazio com cidade:** mensagem contextualizada + botões "Limpar filtros" e "Mudar cidade".
- **Skeletons** substituem o Spinner antigo (alinhado com padrão do docs).

---

### 7. Busca (`src/pages/Busca/index.tsx`)

- Passa `localidade: localidade?.cidade` para `MarketplaceParams`.
- Chip de cidade na barra de resultados (desktop) → abre picker.
- Contagem contextualizada: "8 resultados para 'pintura' em Goiânia".
- Estado vazio com cidade: opções de limpar filtros e mudar cidade.

---

## Fluxo completo do usuário

```
1. Usuário acessa a app pela primeira vez
   └── LocationPicker abre automaticamente (bloqueante)
       ├── Opção A: clica em "Goiânia" → localidade salva, modal fecha
       ├── Opção B: clica "Usar minha localização" → geolocalização → salva
       └── Opção C: clica "Todo o Brasil" → localidade null, modal fecha

2. App carrega com localidade definida
   ├── TopBar: chip "📍 Goiânia" visível (desktop)
   ├── TopBar mobile: faixa "Goiânia e Região, GO | Alterar"
   ├── Home hero: "Serviços em Goiânia e região para você"
   └── Marketplace/Busca: passa localidade à API automaticamente

3. Usuário quer mudar de cidade
   ├── Clica no chip do TopBar (desktop)
   ├── Clica no ícone MapPin (mobile)
   ├── Clica "Alterar cidade" no Marketplace ou Busca
   └── LocationPicker abre (fechável desta vez) → escolhe nova cidade
```

---

## Responsabilidade do backend

O parâmetro `localidade` é enviado para a API via `GET /marketplace/?localidade=Goiânia`. O backend é responsável por:

1. Filtrar serviços cujo campo `localidade` contenha a cidade informada (match parcial ou fuzzy).
2. Definir o que é "e região" — pode ser:
   - Match exato na cidade
   - Match em lista de cidades da mesma região metropolitana
   - Raio em km usando coordenadas geográficas (requer lat/lon nos serviços)
3. Retornar `total` correto para exibição na UI.

O campo `localidade` em `MarketplaceParams` (`src/types/api.ts`) já existia antes desta feature — nenhuma mudança de tipo foi necessária.

---

## Arquivos modificados

| Arquivo | Operação |
|---------|----------|
| `src/stores/locationStore.ts` | **Criado** |
| `src/components/location/LocationPicker.tsx` | **Criado** |
| `src/components/layout/TopBar.tsx` | Reescrito |
| `src/pages/Home/index.tsx` | Reescrito |
| `src/pages/Marketplace/index.tsx` | Reescrito |
| `src/pages/Busca/index.tsx` | Reescrito |
| `src/router/index.tsx` | Editado (+ LocationPicker) |

---

## Próximos passos (backend + expansão)

- **Backend:** implementar lógica de "e região" — pode ser via tabela de regiões metropolitanas ou raio geográfico.
- **Busca por CEP:** alternativa ao campo de texto — usuário digita CEP e o frontend usa ViaCEP para resolver cidade/UF automaticamente (sem dependência de Nominatim para a seleção manual).
- **Serviços sem localidade:** serviços com `localidade: null` na API (prestadores que atendem online ou em todo o Brasil) devem aparecer mesmo com filtro de cidade ativo. Cabe ao backend retorná-los junto aos locais, ou ao frontend ter uma opção "incluir serviços online".
- **Histórico de cidades recentes:** guardar as últimas 3 cidades pesquisadas no `locationStore` para acesso rápido no picker.
