# Analise do Frontend Cliente - Orcamentos, Fluxos e Roadmap

Data da analise: 2026-05-18  
Escopo: `frontend_cliente`, com foco em solicitacoes de orcamento/cotacoes, integracao com backend, fluxos quebrados e UX/UI.

## Resumo executivo

O frontend cliente compila com sucesso (`npm run build`), mas o fluxo de orcamentos tem quebras funcionais relevantes. O problema mais critico e que varios CTAs apontam para `/orcamentos/novo`, rota documentada em materiais antigos, mas inexistente no router atual. O unico fluxo funcional de criacao esta como modal (`WizardOrcamento`) aberto na home; a pagina de servico e a area "Minha conta > Orcamentos" mandam o usuario para 404.

Tambem ha desalinhamentos importantes com o backend: parametros de paginacao (`page_size` vs `limit`), formato de resposta (`solicitacoes/pagina/por_pagina` vs `items/page_size/has_next`), status do dominio, campos novos da solicitacao (`numero_contrato`, `status`, `data_finalizacao_estimada`) e campos ricos do orcamento (`titulo`, `detalhamento`, `validade_dias`, `valor_com_desconto`, `anexos_count`) que o front nao exibe ou mapeia parcialmente.

## Implementacoes e referencias legadas ou nao utilizadas

### Rota `/orcamentos/novo` documentada e linkada, mas nao implementada

Evidencias:

- `src/router/index.tsx` registra `/conta/orcamentos` e `/orcamentos/:id`, mas nao registra `/orcamentos/novo`.
- `src/pages/Conta/Orcamentos.tsx` usa `<Link to="/orcamentos/novo">` para "Nova solicitacao" e "Fazer meu primeiro pedido".
- `src/pages/Marketplace/ServicoDetalhe.tsx` executa `navigate('/orcamentos/novo')` em "Solicitar Orcamento".
- `docs/03-paginas-e-rotas.md` e `docs/04-wizards.md` descrevem `/orcamentos/novo` como rota existente, mas a implementacao atual usa modal na home.

Impacto: fluxo quebrado com 404 em pontos centrais da jornada.

### Wizard antigo/documentado diverge do wizard real

A documentacao descreve wizard de 5 passos com campos como data desejada e faixa de orcamento. O componente real (`src/components/marketplace/WizardOrcamento.tsx`) tem etapas: categoria, detalhes, endereco, revisao, anexos/sucesso. Ele nao coleta `data_desejada`, `orcamento_minimo`, `orcamento_maximo` ou `aceita_remoto`.

Parte disso parece ser legado, porque o backend atual (`backend/web/schemas/cotacao.py`) tambem nao aceita esses campos no `CriarSolicitacaoRequest`. Portanto, a correcao deve ser alinhar a documentacao e remover tipos/interface legados, ou reabrir uma demanda backend se esses campos voltarem a fazer parte do produto.

### Tipos de frontend mantem campos que o backend nao usa mais

`src/services/api/cotacoes.ts` ainda declara `aceita_remoto`, `data_desejada`, `orcamento_minimo` e `orcamento_maximo` em `CriarCotacaoInput`, mas o schema real de criacao aceita apenas:

- `titulo`
- `descricao`
- `tipo_servico`
- `cidade`
- `estado`
- `endereco_completo`
- `metragem`

Impacto: aumenta risco de regressao e confunde futuras implementacoes.

### Servico `uploadAnexoCotacao` parece legado

`src/services/api/midia.ts` tem `uploadAnexoCotacao(cotacaoId)` chamando `/midia/cotacoes/{id}/anexos`. O fluxo atual usa `/midia/solicitacoes/{solicitacaoId}/anexos`. Pelas rotas/backend atuais, anexos sao de solicitacao ou de orcamento, nao de "cotacao" nesse path.

Recomendacao: confirmar se a rota existe; se nao existir, remover ou substituir por `uploadAnexoSolicitacao`.

## Informacoes do backend subutilizadas ou mal mapeadas

### Solicitacao de orcamento

O backend retorna campos que hoje nao aparecem bem na UI:

- `numero_contrato`: util para identificacao amigavel e suporte. Hoje a UI usa descricao ou ID em varios lugares.
- `status`: o backend tem ciclo real (`aguardando_orcamento`, `orcamento_recebido`, `orcamento_aceito`, `em_contato`, `em_execucao`, `finalizado`, `cancelado`). O frontend reduz isso para `ABERTA`, `COM_PROPOSTAS`, `ACEITA`, `CANCELADA`, `EXPIRADA` e muitas vezes infere por `ativa`/`qtd_orcamentos`.
- `data_finalizacao_estimada`: nao exibida, embora seja importante depois do aceite.
- `endereco_completo` e `metragem`: existem no detalhe, mas a UI de listagem/detalhe usa principalmente localidade e descricao.

Risco: o cliente nao acompanha corretamente estados pos-aceite, como contato, execucao e finalizacao.

### Orcamento/proposta

Campos retornados pelo backend que sao perdidos ou pouco usados:

- `titulo`: nao aparece nos cards; a UI prioriza provedor/valor.
- `numero_contrato`: nao aparece no detalhe da proposta.
- `detalhamento`: o backend possui detalhamento estruturado do orcamento; a UI nao renderiza composicao de custos.
- `validade_dias`: o backend mapeia para `prazo_dias` no schema, mas semanticamente isso parece validade da proposta em alguns DTOs. A UI mostra como "Prazo de execucao", o que pode induzir erro.
- `valor_com_desconto`: presente no DTO de detalhe do cliente, mas nao exposto no schema/consumo atual da UI.
- `anexos_count`: poderia indicar que ha anexos antes de abrir o modal.

### Paginacao

O backend de cotações usa `page` e `limit`, e responde `pagina`, `por_pagina`, `total`, `solicitacoes`. O frontend chama:

- `cotacoesService.listar({ page, page_size })`
- `useCotacoes` le `has_next`
- `PagedResponse<T>` espera `items`, `page`, `page_size`, `has_next`

Impacto: `page_size` e ignorado pelo backend. Em `src/pages/Conta/Orcamentos.tsx`, `useCotacoes(1, 100)` tende a retornar apenas o default do backend (`20`) e nao 100. `hasNext` sempre fica falso.

## Fluxos quebrados

### Criar nova solicitacao pela conta

Status: quebrado.

Fluxo esperado: Minha conta > Meus orcamentos > Nova solicitacao.  
Fluxo atual: navega para `/orcamentos/novo`, que nao existe, caindo no 404.

### Solicitar orcamento pelo detalhe do servico

Status: quebrado.

Fluxo esperado: usuario em `/servicos/:id` abre criacao de orcamento com contexto do servico.  
Fluxo atual: botao "Solicitar Orcamento" navega para `/orcamentos/novo`, tambem inexistente.

### Breadcrumb do detalhe de orcamento

Status: parcialmente quebrado.

`src/pages/Orcamentos/Detalhe.tsx` usa link para `/orcamentos` no breadcrumb, mas nao existe rota `/orcamentos`. O caminho funcional e `/conta/orcamentos`.

### Aceitar proposta

Status: funcional com ressalvas.

O endpoint `PUT /cotacoes/{solicitacao_id}/orcamentos/{orcamento_id}/aceitar` retorna `204 No Content`, mas `cotacoesService.aceitarOrcamento` esta tipado como se retornasse `Orcamento`. Hoje a mutation nao depende do payload, entao tende a funcionar, mas o contrato esta incorreto.

Tambem ha dois componentes quase duplicados de card/modal de proposta: um em `src/pages/Conta/Orcamentos.tsx` e outro em `src/pages/Orcamentos/Detalhe.tsx`. Isso aumenta chance de comportamento divergente.

### Upload de anexos

Status: parcial.

O wizard cria a solicitacao antes de abrir a etapa de anexos. Se o upload falhar ou o usuario fechar nessa etapa, a solicitacao ja existe sem anexos. Isso nao e necessariamente errado, mas a UX precisa deixar claro que a solicitacao foi criada antes dos anexos.

Tambem nao ha limite de quantidade/tamanho no frontend, preview, barra de progresso ou validacao detalhada por arquivo.

## Problemas de UX/UI

### Criacao de orcamento so existe na home

O fluxo mais importante fica escondido em um card da home. Em locais naturais, como Minha conta e detalhe do servico, o usuario cai em 404. Isso quebra expectativa e reduz conversao.

### Modal de wizard grande e com cantos muito arredondados

`WizardOrcamento` usa modal `h-[95vh]` no mobile e `rounded-[32px]`. Em telas pequenas, isso pode parecer uma pagina presa dentro de outra, com scroll interno e footer fixo. Uma rota dedicada ou full-screen modal mobile seria mais ergonomica.

### Status simplificados demais

Depois de aceitar uma proposta, o cliente deveria acompanhar progresso: aceito, em contato, em execucao, finalizado/cancelado. O frontend condensa isso em "Aceita" ou "Cancelada", perdendo a linha do tempo real do backend.

### Cards usam descricao como titulo

Na listagem, a descricao aparece como titulo principal da solicitacao. O backend recebe `titulo`, mas o schema de resposta atual nao devolve esse campo. Resultado: cards longos, pouco escaneaveis e sem identificador amigavel.

### Linguagem inconsistente

O frontend alterna entre "orcamento", "cotacao", "pedido", "proposta" e "solicitacao". Para o cliente, a sugestao e padronizar:

- "Solicitacao" para o pedido de orcamento criado pelo cliente.
- "Proposta" para o orcamento recebido do prestador.
- "Pedido" apenas para checkout/compra ja contratada.

### Duplicacao de UI de proposta

Ha dois cards/modais de proposta com logicas parecidas. Isso dificulta consistencia de confirmacoes, estados de loading, mensagens e exibicao de anexos.

## Roadmap de correcoes

### P0 - Corrigir fluxos quebrados

1. Criar rota `/orcamentos/novo` ou trocar todos os CTAs para abrir o `WizardOrcamento`.
2. Corrigir breadcrumb de `/orcamentos` para `/conta/orcamentos`.
3. Ajustar `ServicoDetalhe` para abrir o wizard ou navegar para a rota nova, idealmente pre-preenchendo `tipo_servico`/titulo com contexto do servico.
4. Corrigir contrato de `aceitarOrcamento` para retorno `void`/`204`.

### P1 - Alinhar contrato frontend/backend

1. Trocar `page_size` por `limit` em `cotacoesService.listar`.
2. Criar tipos especificos para `ListaSolicitacoesClienteResponse`, `SolicitacaoResponse`, `SolicitacaoComOrcamentosResponse` e `OrcamentoDetalheResponse`, sem reaproveitar `PagedResponse`.
3. Usar `pagina`, `por_pagina` e `total` para calcular `hasNext`.
4. Normalizar status usando enums reais do backend e mapear labels da UI a partir desses status, sem inferir por `ativa` quando `status` existir.
5. Remover campos legados de `CriarCotacaoInput` ou documentar explicitamente como futuros.

### P2 - Melhorar informacao exibida ao cliente

1. Exibir `numero_contrato` na listagem/detalhe.
2. Solicitar ao backend que `SolicitacaoResponse` devolva `titulo`; depois trocar cards para usar titulo como heading e descricao como corpo.
3. Exibir `metragem`, `endereco_completo` resumido e `data_finalizacao_estimada` no detalhe.
4. Renderizar `detalhamento` da proposta quando existir.
5. Diferenciar "validade da proposta" de "prazo de execucao"; se o backend nao tiver prazo de execucao real, renomear o texto da UI.

### P3 - Reduzir duplicacao e melhorar manutencao

1. Extrair `OrcamentoCard`, modal de detalhes e modal de confirmacao para componentes compartilhados.
2. Centralizar mapeadores de API em um arquivo como `src/services/api/mappers/cotacoes.ts`.
3. Remover `uploadAnexoCotacao` se a rota nao existir.
4. Atualizar docs antigas em `frontend_cliente/docs` para refletir o fluxo real.

### P4 - UX e qualidade

1. Transformar o wizard em rota dedicada ou full-screen mobile, mantendo modal opcional no desktop.
2. Salvar progresso do wizard em `sessionStorage` se a criacao for longa.
3. Adicionar validacao de anexos por tamanho/tipo/quantidade e feedback por arquivo.
4. Adicionar testes de rota para CTAs de orcamento.
5. Adicionar testes de contrato para `useCotacoes`, cobrindo resposta real com `solicitacoes`, `pagina`, `por_pagina` e `total`.

## Checklist de verificacao sugerido

- `npm run build`
- Teste manual: Home > Solicitar Meu Orcamento > criar solicitacao > anexos > conta/orcamentos.
- Teste manual: Conta > Orcamentos > Nova solicitacao.
- Teste manual: Servico detalhe > Solicitar Orcamento.
- Teste manual: Conta > Orcamentos > expandir solicitacao > ver detalhes da proposta > aceitar/rejeitar.
- Teste manual: `/orcamentos/:id` > breadcrumb volta corretamente para `/conta/orcamentos`.
