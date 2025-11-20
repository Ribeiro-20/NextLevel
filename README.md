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






# 👤 9. Autor

Autor: Ribeiro-20

Contacto: josepedroribeiro06@gmail.com






