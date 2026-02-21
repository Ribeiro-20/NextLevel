// Lazy-load Firestore functions to avoid loading entire Firebase at startup
// This helps reduce initial bundle size significantly

let firestoreCache = {};

export async function lazyGetDocs(collection) {
  if (!firestoreCache.getDocs) {
    const { getDocs } = await import('firebase/firestore');
    firestoreCache.getDocs = getDocs;
  }
  return firestoreCache.getDocs(collection);
}

export async function lazyGetDoc(ref) {
  if (!firestoreCache.getDoc) {
    const { getDoc } = await import('firebase/firestore');
    firestoreCache.getDoc = getDoc;
  }
  return firestoreCache.getDoc(ref);
}

export async function lazyDoc(db, collectionName, docId) {
  if (!firestoreCache.doc) {
    const { doc } = await import('firebase/firestore');
    firestoreCache.doc = doc;
  }
  return firestoreCache.doc(db, collectionName, docId);
}

export async function lazyCollection(db, collectionName) {
  if (!firestoreCache.collection) {
    const { collection } = await import('firebase/firestore');
    firestoreCache.collection = collection;
  }
  return firestoreCache.collection(db, collectionName);
}

export async function lazyUpdateDoc(ref, data) {
  if (!firestoreCache.updateDoc) {
    const { updateDoc } = await import('firebase/firestore');
    firestoreCache.updateDoc = updateDoc;
  }
  return firestoreCache.updateDoc(ref, data);
}

export async function lazyArrayUnion(...elements) {
  if (!firestoreCache.arrayUnion) {
    const { arrayUnion } = await import('firebase/firestore');
    firestoreCache.arrayUnion = arrayUnion;
  }
  return firestoreCache.arrayUnion(...elements);
}

export async function lazyArrayRemove(...elements) {
  if (!firestoreCache.arrayRemove) {
    const { arrayRemove } = await import('firebase/firestore');
    firestoreCache.arrayRemove = arrayRemove;
  }
  return firestoreCache.arrayRemove(...elements);
}
