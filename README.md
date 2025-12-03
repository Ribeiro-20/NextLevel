# NextLevel



NextLevel é uma Single-Page Application (SPA) construída com React e Firebase, permitindo listar, pesquisar e comprar jogos. O projeto inclui autenticação, favoritos, carrinho persistente e um painel de administração para gestão do catálogo.



# 🚀 Principais Funcionalidades



Navegação SPA com React



Autenticação com Firebase Authentication



Base de dados e armazenamento com Firestore



Carrinho persistente e sistema de favoritos



Painel de Administração (AdminPanel)



Layout responsivo (mobile e desktop)



Otimizações para performance



# 🛠️ Tecnologias Utilizadas



React (JSX)



Vite (ambiente de desenvolvimento e build)



Firebase (Auth, Firestore)



ESLint / Prettier (sugerido)



Jest + React Testing Library (sugerido para testes)



# 📌 Estado do Projeto



Status: Em desenvolvimento / Beta

(Atualiza conforme o estado real do projeto)



# 📚 Índice



Instalação



Configuração (.env / Firebase)



Scripts úteis



Estrutura do projeto



Configuração do Firebase



Boas práticas e segurança



Contribuição



Licença



Contacto



# 🔧 1. Instalação (Windows – PowerShell)

Clonar o repositório:

git clone <url-do-repositorio>

cd gamehub

Instalar dependências:

pnpm install ou npm install




# 🔑 2. Variáveis de Ambiente

Cria um ficheiro .env baseado em .env.example.



Exemplo mínimo de .env.example:

REACT\_APP\_FIREBASE\_API\_KEY=

REACT\_APP\_FIREBASE\_AUTH\_DOMAIN=

REACT\_APP\_FIREBASE\_PROJECT\_ID=

REACT\_APP\_FIREBASE\_STORAGE\_BUCKET=

REACT\_APP\_FIREBASE\_MESSAGING\_SENDER\_ID=

REACT\_APP\_FIREBASE\_APP\_ID=



# ▶️ 3. Executar o Projeto

Modo desenvolvimento:

npm run dev

Build para produção:

npm run build

Pré-visualizar build:

npm run preview

Testes (se configurados):

npm test



# 📦 4. Scripts no package.json

dev – servidor de desenvolvimento (Vite)



build – gerar build de produção



preview – pré-visualização da build



lint – executar ESLint (opcional)



test – correr testes (opcional)



# 🗂️ 5. Estrutura do Projeto



public/              # assets públicos

src/

## Stripe & Payments (local development)

This project integrates Stripe Checkout. Important notes for local development and deployment:

- Do NOT store secret keys in the client or commit them to the repo. Only the Stripe publishable key (starting with `pk_`) belongs in `.env.local` as `VITE_STRIPE_PUBLISHABLE_KEY`.
- Server-side secrets (Stripe secret key `sk_` and webhook signing secret `whsec_`) must be stored in Firebase Functions config or other secure server-side config. Locally you can put them into `functions/.runtimeconfig.json` (this file is gitignored) or use `firebase functions:config:set`.

Local quickstart for Stripe testing:

1. Fill `.env.local` with your Firebase client keys and `VITE_STRIPE_PUBLISHABLE_KEY`.
2. Add your Stripe secret and webhook secret to `functions/.runtimeconfig.json` locally, e.g.:

```json
{
	"stripe": {
		"secret": "<YOUR_STRIPE_SECRET_HERE>",
		"webhook": "<YOUR_STRIPE_WEBHOOK_SECRET_HERE>"
	},
	"app": {
		"success_url": "http://localhost:5173/success",
		"cancel_url": "http://localhost:5173/cart"
	}
}
```

3. Start the Functions emulator (in a new terminal):

```powershell
cd C:\Users\josep\GameHub\gamehub
firebase emulators:start --only functions --project <your-project-id> --config ./firebase.json
```

4. Start the Vite dev server in another terminal:

```powershell
npm run dev
```

5. Add games to the cart and click `Finalizar Compra` — in development the frontend posts to the Functions emulator and opens Stripe Checkout.

Testing webhooks locally (recommended):

- Install the Stripe CLI and forward webhooks to the functions emulator:

```powershell
stripe login
stripe listen --forward-to localhost:5001/<your-project-id>/us-central1/stripeWebhook
```

- When you complete a test checkout, the `stripeWebhook` function will receive `checkout.session.completed` and persist an order to Firestore (emulator or production, depending on your setup).

Security reminder:

- If any secret key has been committed or leaked, rotate it immediately in the Stripe dashboard.


&nbsp; components/        # componentes reutilizáveis (Header, Footer, GameCard...)

&nbsp; pages/             # páginas (Home, Login, Checkout, AdminPanel...)

&nbsp; hooks/             # hooks personalizados (useAdmin, etc.)

&nbsp; utils/             # utilitários (favorites, firestoreUtils...)

&nbsp; data/              # datasets locais (games.js)

&nbsp; firebase.js        # configuração Firebase

&nbsp; main.jsx           # ponto de entrada

&nbsp; App.jsx

README.md

package.json

vite.config.js

eslint.config.js     # se existir



🔥 6. Configuração do Firebase
Criar projeto no Firebase Console



Ativar Authentication (Email/Password ou OAuth)



Criar Firestore Database e configurar regras



Copiar credenciais para .env



Regras Firestore (exemplo simplificado):

// Utilizadores só podem ler/escrever os seus próprios dados

match /users/{uid} {

&nbsp; allow read, write: if request.auth.uid == uid;

}



// Apenas admins podem gerir /games

match /games/{gameId} {

&nbsp; allow read: if true;

&nbsp; allow write: if request.auth.token.admin == true;

}



# 🛡️ 7. Boas Práticas \& Segurança

Nunca commits chaves / segredos → usa .env



Regras Firestore restritas e seguras



Usar ESLint + Prettier para consistência



Configurar lint-staged + husky para pré-commits



Adicionar CI/CD para lint / testes / build



Acessibilidade: alt em imagens, label em inputs



Performance:



Lazy-load de imagens



Otimização de assets



Testar com Lighthouse

## 💳 8. Integração Stripe (Checkout)

Se quiseres aceitar pagamentos com Stripe, aqui estão os passos mínimos para integrar com segurança usando Stripe Checkout.

1. Criar conta em https://dashboard.stripe.com e testar em *Test mode*.
2. Obter chaves (Developer → API keys):
	- `pk_test_...` (Publishable key) → usado no frontend (ex.: `REACT_APP_STRIPE_PUBLISHABLE_KEY`).
	- `sk_test_...` (Secret key) → usado apenas no servidor / Cloud Functions (`STRIPE_SECRET_KEY`).
3. Configurar um endpoint server-side que cria uma Checkout Session (ex.: Cloud Functions or Express). O servidor usa `STRIPE_SECRET_KEY` e retorna `session.id`.
4. No frontend usar `@stripe/stripe-js` e `loadStripe` para redirecionar o utilizador para o Checkout (usa a publishable key).
5. Configurar um Webhook no Stripe para receber `checkout.session.completed` e actualizar a Firestore/ordens.

Ficheiros que adicionámos como exemplo no repositório:
- `functions/index.js` → esqueleto da Cloud Function (`createCheckoutSession` + `stripeWebhook`).
- `src/utils/stripe.js` → helper frontend para redirecionar para o Checkout.
- `.env.example` → variables de ambiente (placeholders; NÃO colocar chaves reais aqui).

Variáveis de ambiente necessárias (exemplo, preencher em `.env` local):
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUCCESS_URL=http://localhost:5173/success
CANCEL_URL=http://localhost:5173/cart
```

Testar localmente com Stripe CLI:
```powershell
stripe login
stripe listen --forward-to http://localhost:5001/<project>/us-central1/stripeWebhook
```

Segurança importante:
- NÃO commites `STRIPE_SECRET_KEY` nem `STRIPE_WEBHOOK_SECRET`.
- Rotaciona (roll) a secret key imediatamente se a exposure ocorrer.
- Valida sempre preços/quantidades no servidor; não confies no cliente.

Se quiseres que eu implemente e commite o esqueleto das Cloud Functions e o helper frontend, diz-me que o faço num branch e explico como testar localmente.



🤝 8. Como Contribuir
===

Fazer fork do repositório



Criar branch:

git checkout -b feature/nova-funcionalidade



Commitar seguindo Conventional Commits



Abrir Pull Request com:



O que foi alterado



Porquê



Como testar



Template de PR:



Título: feat|fix(scope): descrição curta

Descrição: O quê, porquê e como testar



# 📄 9. Licença

Escolhe uma licença (ex: MIT).

Caso ainda não tenhas decidido, usa MIT temporariamente.



# 👤 10. Autor

Autor: Ribeiro-20

Contacto: (email ou GitHub)





