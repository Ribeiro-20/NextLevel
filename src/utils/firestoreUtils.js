// src/utils/firestoreUtils.js
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

// Cria documento do usuário se não existir
export async function createUserDocument(user) {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || "",
      saldo: 0,
      compras: [],
      carrinho: [] // padrão: array de { id, quantity }
    });
  }
}

// Normaliza carrinho: aceita legacy array de ids ou array de {id,quantity}
export function normalizeCart(cart) {
  if (!Array.isArray(cart)) return [];
  if (cart.length === 0) return [];
  // detecta se são strings (legacy)
  if (typeof cart[0] === "string") {
    return cart.map(id => ({ id, quantity: 1 }));
  }
  // assume já {id, quantity}
  return cart.map(item => ({ id: item.id, quantity: item.quantity || 1 }));
}

// Atualiza carrinho do usuário (recebe array de {id, quantity})
export async function updateCart(userId, cartArray) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { carrinho: cartArray });
}

// Cria compra e limpa carrinho
export async function checkout(userId, games, total) {
  const purchasesRef = collection(db, "purchases");
  await addDoc(purchasesRef, { userId, games, total, date: Timestamp.now() });

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { carrinho: [] });
}

// Adiciona jogo na coleção games
export async function addGame(game) {
  const gamesRef = collection(db, "games");
  await addDoc(gamesRef, game);
}
