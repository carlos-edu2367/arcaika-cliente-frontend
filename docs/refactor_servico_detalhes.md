# Refatoração da Tela de Detalhes do Serviço

Este documento descreve as mudanças realizadas na tela de `ServicoDetalhe.tsx` para atingir uma experiência de usuário premium e uma hierarquia visual rigorosa.

## Arquivos Alterados
- `src/pages/Marketplace/ServicoDetalhe.tsx`: Reescrita completa da interface e lógica de exibição.
- `src/services/api/marketplace.ts`: Adicionado `listarProdutosRelacionados`.
- `src/services/api/avaliacoes.ts`: Atualizado `doServico` para suportar paginação e metadados.
- `src/hooks/useMarketplace.ts`: Adicionado hook `useProdutosRelacionados`.
- `src/types/api.ts`: Adicionado `AvaliacoesPagedResponse`.
- `src/types/marketplace.ts`: Adicionado `ProdutoRelacionado`.

## Decisões de Layout e Hierarquia

Seguimos a ordem obrigatória solicitada:
1. **Rating de Estrelas**: Exibido no topo como um badge elegante (`Stars` + valor numérico).
2. **Título**: Em destaque absoluto com `font-black` e tamanho responsivo.
3. **Galeria**: 
   - **Mobile**: Implementada com scroll horizontal nativo, `snap-x` e `snap-mandatory` para performance e fluidez.
   - **Desktop**: Grid responsivo onde a primeira imagem ganha destaque (`col-span-2`), criando um visual de revista.
4. **Descrição/Preço**: Bloco com fundo suave (`neutral-50`), separando claramente a proposta de valor e o investimento.
5. **Produtos Relacionados**: Seção "Compre junto" que aparece apenas se houver dados, usando cards horizontais.
6. **CTA Sticky**: 
   - **Mobile**: Barra fixa com backdrop-blur e sombra invertida, contendo o preço e o botão de ação.
   - **Desktop**: Sidebar sticky que acompanha o scroll, oferecendo segurança (garantia) e ações rápidas.
7. **Avaliações**: Lista completa com cards de review e parsing defensivo.

## Tratamento de Dados e Endpoints

- **Produtos Relacionados**: Consumidos via `GET /marketplace/servicos/{id}/produtos`. A seção é ocultada automaticamente se o array estiver vazio.
- **Avaliações**: O frontend agora aceita tanto um array simples quanto o objeto de resposta paginado (`{ avaliacoes, media, total }`). Isso garante que a tela não quebre caso o payload do backend mude ou varie entre ambientes.
- **Carregamento Independente**: Fotos, produtos e avaliações possuem seus próprios estados de loading (Skeletons), permitindo que o conteúdo textual apareça imediatamente.

## Casos de Borda Tratados
- **Sem Fotos**: Placeholder amigável com ícone `Sparkles`.
- **Sem Avaliações**: Estado vazio motivador sugerindo que o usuário seja o primeiro a avaliar.
- **Indisponibilidade**: Badge de "Indisponível" e desativação dos botões de compra.
- **Preço Promocional**: Destaque visual para o valor com desconto e exibição do valor original riscado.

## Pendências
- Integração do fluxo final de checkout/carrinho (preparado com `handleContratar`).
- Paginação real na lista de avaliações (atualmente exibe a primeira página de 20 itens).
