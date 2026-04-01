// App.tsx — re-exporta AppRouter como padrão para compatibilidade com ferramentas que esperam um default export em App.tsx
// O ponto de entrada real da aplicação está em src/router/index.tsx (AppRouter)
export { AppRouter as default } from '@/router'
