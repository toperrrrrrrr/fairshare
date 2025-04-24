import { db } from './firebase';
import { collection, doc, addDoc, updateDoc, arrayUnion, serverTimestamp, runTransaction } from 'firebase/firestore';

export async function createGroup(groupName, user) {
  if (!user || !user.uid) throw new Error('No user');
  const userId = user.uid;
  const groupsRef = collection(db, 'groups');
  const userRef = doc(db, 'users', userId);

  return await runTransaction(db, async (transaction) => {
    // Create group
    const groupDocRef = await addDoc(groupsRef, {
      name: groupName,
      memberIds: [userId],
      createdAt: serverTimestamp(),
    });
    // Update user
    transaction.update(userRef, {
      groupIds: arrayUnion(groupDocRef.id),
    });
    return groupDocRef.id;
  });
}