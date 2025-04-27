// Service for marking activity notifications as read/unread for a user
import { db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

// Mark a notification as read for the user
export async function markActivityRead(userId, notifId) {
  const notifRef = doc(db, 'users', userId, 'activityRead', notifId);
  await setDoc(notifRef, { read: true });
}

// Mark a notification as unread for the user (optional)
export async function markActivityUnread(userId, notifId) {
  const notifRef = doc(db, 'users', userId, 'activityRead', notifId);
  await deleteDoc(notifRef);
}

// Check if a notification is read (client-side, pass in the readIds set)
export function isActivityRead(notifId, readIdsSet) {
  return readIdsSet.has(notifId);
}
