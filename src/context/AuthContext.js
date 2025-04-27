import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export { AuthContext };

// Remove useAuth definition (moved to hooks)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        let userData = {};
        if (!userSnap.exists()) {
          userData = {
            name: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email,
            groupIds: [],
            createdAt: serverTimestamp(),
            accessLevel: 'USER', // Default accessLevel
          };
          await setDoc(userRef, userData);
          console.log('User document created!');
        } else {
          userData = userSnap.data();
        }
        // Merge Firebase Auth and Firestore user fields
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          ...userData,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};