import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Adds a settlement transaction to Firestore under the group's Transactions collection.
 * @param {string} groupId - The group ID
 * @param {string} fromUserId - The user ID of the payer
 * @param {string} toUserId - The user ID of the receiver
 * @param {number} amount - The amount settled
 * @param {string} [note] - Optional note
 * @returns {Promise<string>} - The document ID of the new transaction
 */
export async function addSettlementTransaction({ groupId, fromUserId, toUserId, amount, note }) {
  if (!groupId || !fromUserId || !toUserId || !amount || amount <= 0) {
    throw new Error('Invalid settlement transaction data');
  }
  const transactionsRef = collection(db, 'groups', groupId, 'transactions');
  const docRef = await addDoc(transactionsRef, {
    type: 'settlement',
    from: fromUserId,
    to: toUserId,
    amount: Number(amount),
    note: note || '',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
