import { collection, query, where, getDocs, writeBatch, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export const syncLocalToFirestore = async (uid: string, localData: any) => {
  const batch = writeBatch(db);
  
  // Sync transactions
  if (localData.transactions) {
    localData.transactions.forEach((t: any) => {
      const ref = doc(db, `users/${uid}/transactions/${t.id}`);
      batch.set(ref, { ...t, uid });
    });
  }
  
  // Sync Profile
  if (localData.profile) {
    const ref = doc(db, `users/${uid}/profile/main`);
    batch.set(ref, localData.profile);
  }
  
  // Sync Accounts
  if (localData.accounts) {
    localData.accounts.forEach((acc: any) => {
      const ref = doc(db, `users/${uid}/accounts/${acc.id}`);
      batch.set(ref, acc);
    });
  }

  await batch.commit();
};

export const fetchUserFirestoreData = async (uid: string) => {
  // Get all subcollections data
  // Simplified for now: just getting basic collections
  const transactions: any[] = [];
  const querySnapshot = await getDocs(collection(db, `users/${uid}/transactions`));
  querySnapshot.forEach((doc) => transactions.push(doc.data()));

  const accounts: any[] = [];
  const accountsSnapshot = await getDocs(collection(db, `users/${uid}/accounts`));
  accountsSnapshot.forEach((doc) => accounts.push(doc.data()));

  const profileRef = doc(db, `users/${uid}/profile/main`);
  const profileSnap = await getDoc(profileRef);
  const profile = profileSnap.exists() ? profileSnap.data() : null;

  return { transactions, accounts, profile };
};
