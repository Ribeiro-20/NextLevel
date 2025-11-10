import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 

const firebaseConfig = {
  apiKey: "AIzaSyASRGkAnX69HQLYaRO1ekMB5HMS64igY_0",
  authDomain: "gamehub-c02df.firebaseapp.com",
  projectId: "gamehub-c02df",
  storageBucket: "gamehub-c02df.appspot.com",
  messagingSenderId: "524226813079",
  appId: "1:524226813079:web:75afa514c73f71c6d59dd2",
  measurementId: "G-X3SSGGYYHJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app); // ← exporte o Storage
