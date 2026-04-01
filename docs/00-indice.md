# Índice da Documentação — Frontend Cliente Arcaika

Este arquivo é o ponto de entrada para toda a documentação do pacote `frontend-cliente`. Cada seção abaixo linka para um documento especializado.

---

## Mapa de documentos

| # | Arquivo | O que responde |
|---|---|---|
| 01 | [01-arquitetura.md](01-arquitetura.md) | "Como o sistema está organizado e por quê?" |
| 02 | [02-design-system.md](02-design-system.md) | "Como eu construo componentes com consistência visual?" |
| 03 | [03-paginas-e-rotas.md](03-paginas-e-rotas.md) | "Que páginas existem e o que cada uma faz?" |
| 04 | [04-wizards.md](04-wizards.md) | "Como funcionam os fluxos multi-step?" |
| 05 | [05-performance.md](05-performance.md) | "Como garantimos velocidade e boa pontuação Lighthouse?" |
| 06 | [06-estado-e-api.md](06-estado-e-api.md) | "Como dados do servidor chegam ao componente?" |
| 07 | [07-arky-assistente.md](07-arky-assistente.md) | "Como funciona o chat com a IA Arky?" |
| 08 | [08-mobile-first.md](08-mobile-first.md) | "Como a UI se adapta ao mobile?" |
| 09 | [09-seguranca.md](09-seguranca.md) | "Como protegemos tokens, rotas e dados?" |
| 10 | [10-ux-flows.md](10-ux-flows.md) | "Qual o caminho do usuário nos fluxos principais?" |
| 17 | [17-gaps-e-fluxos-incorretos.md](17-gaps-e-fluxos-incorretos.md) | "Quais os gaps e fluxos incorretos identificados no frontend vs backend?" |

---

## Guia de leitura por papel

### Novo desenvolvedor front-end entrando no projeto
1. Leia o [README](../README.md) do pacote
2. Leia [01 — Arquitetura](01-arquitetura.md) para entender a estrutura
3. Leia [02 — Design System](02-design-system.md) antes de escrever qualquer JSX
4. Consulte [06 — Estado e API](06-estado-e-api.md) para entender como usar os hooks existentes

### Desenvolvedor implementando uma nova página
1. Verifique se a rota já está documentada em [03 — Páginas e Rotas](03-paginas-e-rotas.md)
2. Se a página envolve wizard, consulte [04 — Wizards](04-wizards.md)
3. Consulte os hooks necessários em [06 — Estado e API](06-estado-e-api.md)
4. Verifique o fluxo UX em [10 — UX Flows](10-ux-flows.md)

### Tech lead revisando decisões
- [01 — Arquitetura](01-arquitetura.md) para decisões de stack e estrutura
- [05 — Performance](05-performance.md) para metas e estratégia de otimização
- [09 — Segurança](09-seguranca.md) para revisão de segurança

### Designer avaliando implementação
- [02 — Design System](02-design-system.md) para tokens e componentes
- [08 — Mobile First](08-mobile-first.md) para navegação e breakpoints
- [10 — UX Flows](10-ux-flows.md) para fluxos mapeados

---

## Decisões técnicas já tomadas (não reabrir)

As decisões abaixo são definitivas e não precisam ser rediscutidas em sessões futuras:

- **Vite** em vez de CRA ou Next.js (SPA puro, sem SSR necessário)
- **TanStack Query v5** para todo server state (sem Redux para dados de servidor)
- **Zustand** para estado global de UI e sessão (sem Redux/Context para isso)
- **Tailwind CSS** + **Radix UI** para UI (sem Material UI ou Chakra)
- **React Hook Form + Zod** para todos os formulários
- **Axios** com interceptors centralizados (sem fetch nativo nos hooks)
- **Mobile-first** com breakpoints Tailwind padrão (sm: 640px, lg: 1024px)
- **Português brasileiro** em toda a interface do usuário

---

## Status dos documentos

| Doc | Status |
|---|---|
| 01 — Arquitetura | Completo |
| 02 — Design System | Completo |
| 03 — Páginas e Rotas | Completo |
| 04 — Wizards | Completo |
| 05 — Performance | Completo |
| 06 — Estado e API | Completo |
| 07 — Arky Assistente | Completo |
| 08 — Mobile First | Completo |
| 09 — Segurança | Completo |
| 10 — UX Flows | Completo |
