# Índice de Imagens — NextLevel

Colocar os ficheiros nesta pasta (`docs/imagens/`) com estes nomes. Cada item indica onde capturar.

- arquitetura-geral.png — Diagrama da arquitetura (Cloud Functions ⇄ Firestore/Auth/Storage ⇄ Frontend). (Pode ser criado no draw.io/Figma)
- estrutura-frontend.png — Screenshot do explorador de pastas (src/). 
- estrutura-backend.png — Screenshot do explorador de pastas (functions/).
- resultado-home-desktop.png — Rota `/` (Home.jsx) em 1440×900.
- resultado-home-mobile.png — Rota `/` (Home.jsx) em viewport mobile 390×844.
- gamecard.png — Componente `src/components/GameCard.jsx` aberto e render em Home.
- resultado-detalhe-jogo.png — Rota `/game/:id` (GameDetail.jsx).
- resultado-carrinho.png — `src/components/Cart.jsx` / `FloatingCart.jsx` com itens.
- resultado-checkout.png — Rota `/checkout` (Checkout.jsx) antes de ir para Stripe.
- resultado-perfil.png — Rota `/profile` (Profile.jsx): avatar + histórico de encomendas.
- empty-favorites.png — Estado vazio em Profile (sem favoritos).
- resultado-admin.png — Rota `/admin` (AdminPanel.jsx) com lista de jogos.
- code-functions-index.png — `functions/index.js` (createCheckoutSession/stripeWebhook).
- code-firebase-config.png — `src/firebase.js` (configuração e exports).
- code-stripe-util.png — `src/utils/stripe.js` (integração cliente).
- code-firestore-queries.png — `src/utils/firestoreUtils.js` (consultas/auxiliares Firestore).

Sugestões:
- Usar PNG para UI/código; SVG para diagramas.
- Guardar versões @2x para impressão, ex.: `resultado-home-desktop@2x.png`.
- Para screenshots de código: tema escuro, zoom 100%, secção relevante da função.
