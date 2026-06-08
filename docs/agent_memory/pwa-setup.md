# PWA — frontend-cliente (2026-06-08)

Configuração de PWA instalável para mobile adicionada ao `frontend-cliente` (Vite + React SPA, deploy Vercel).

## Stack
- `vite-plugin-pwa@^0.21` (Workbox, `generateSW`), `registerType: 'autoUpdate'`.
- `sharp` (devDep) usado apenas pelo script de ícones.

## Arquivos
- `vite.config.ts` — plugin `VitePWA`: manifest + workbox (precache do shell, runtime cache de fontes Google e imagens same-origin). `injectRegister: null` (registro manual).
- `src/pwa.ts` — `registerPWA()` chama `registerSW({ immediate: true })` de `virtual:pwa-register`; revalida update a cada 1h. Chamado em `src/main.tsx`.
- `index.html` — meta tags iOS (`apple-touch-icon`, `apple-mobile-web-app-*`). O `<link rel="manifest">` é injetado pelo plugin no build.
- `src/vite-env.d.ts` — `/// <reference types="vite-plugin-pwa/client" />`.
- `scripts/generate-pwa-icons.mjs` — gera `public/icons/*` a partir de `src/assets/logo.png` (usa `.trim()` para remover o padding transparente embutido do logo). Rodar: `node scripts/generate-pwa-icons.mjs`.
- `public/icons/` — `pwa-192x192.png`, `pwa-512x512.png` (purpose any), `pwa-maskable-512x512.png` (safe zone 60%), `apple-touch-icon.png` (180).

## Decisões / cuidados
- API fica em **outra origem** (`arcaika-api-*.run.app`) → não é interceptada pelo SW. `navigateFallbackDenylist` cobre `/api` e `/auth/` por segurança.
- `globIgnores: ['**/assets/landing/**']` mantém imagens pesadas da landing fora do precache (vão para runtime cache `app-images`, StaleWhileRevalidate).
- `devOptions.enabled: false` → SW só ativo em build/preview, não no `npm run dev`.
- Manifest: `display: standalone`, `theme_color #F97316`, `background_color #FFFFFF`, `orientation portrait`, `lang pt-BR`.

## Verificado
- `npm run build` emite `dist/sw.js`, `dist/manifest.webmanifest`, `dist/icons/*`; 81 entradas de precache (~1.1 MB), sem landing pngs.
- `npm run typecheck` ✓ (inclui o import virtual `virtual:pwa-register`).
- `npm run preview`: `/manifest.webmanifest` (application/manifest+json), `/sw.js` (text/javascript) e ícones retornam 200.

## Botão de instalação (banner)
- `src/hooks/useInstallPrompt.ts` — captura `beforeinstallprompt` (Android/Chromium), detecta iOS (UA + `maxTouchPoints` p/ iPadOS) e `display-mode: standalone`. Expõe `promptInstall()`.
- `src/components/pwa/InstallBanner.tsx` — banner dispensável (1 botão) acima do TopBar (no fluxo, rola junto). Android → prompt nativo real; iOS → abre sheet. Dispensa persistida em `localStorage['arcaika:pwa-install-dismissed']`. Oculto em `/auth*` e `/checkout` e quando standalone.
- `src/components/pwa/IOSInstallSheet.tsx` — bottom-sheet com instruções (Compartilhar → Adicionar à Tela de Início). **iOS não tem API de instalação** — é o máximo possível na plataforma.
- Montado em `src/router/index.tsx` (dentro do `BrowserRouter`, antes do `<TopBar/>`).
- **Verificado ao vivo** (preview mobile 375px): banner renderiza; clique em "Instalar" dispara o prompt nativo (stub), some o banner e persiste a dispensa. Sem erros de console. Sheet iOS verificado por build/typecheck (não visualmente — exige UA iOS).

## Pendências / não verificado
- Não foi feito teste de instalação em dispositivo real / Lighthouse PWA audit.
- Estratégia de update é silenciosa (sem toast "nova versão"). Se quiserem prompt de atualização, trocar para `onNeedRefresh` em `src/pwa.ts`.
- Bug pré-existente não relacionado: `.env` usa `VITE_API_BASE_URL` mas `src/lib/axios.ts` lê `VITE_API_URL` → axios sempre cai no fallback de produção.
