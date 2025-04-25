import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Checks if a username (handle) is unique
export async function isUsernameUnique(username) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}
