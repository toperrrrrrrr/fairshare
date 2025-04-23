import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseTestPage = () => {
  const [status, setStatus] = useState('Connecting...');
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Test Auth connection
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser.email || firebaseUser.uid);
        setStatus('Auth Connected ✅');
      } else {
        setUser(null);
        setStatus('No user signed in');
      }
    }, (err) => setError('Auth error: ' + err.message));
    // Test Firestore connection
    getDocs(collection(db, 'groups'))
      .then((snapshot) => {
        setGroups(snapshot.docs.map(doc => doc.id));
      })
      .catch((err) => setError('Firestore error: ' + err.message));
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2>Firebase Connection Test</h2>
      <div>Status: <b>{status}</b></div>
      {user && <div>User: {user}</div>}
      {groups.length > 0 && (
        <div>Groups collection (IDs): <pre>{JSON.stringify(groups, null, 2)}</pre></div>
      )}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      <div style={{ marginTop: 24, color: '#888' }}>
        <div>Auth config: <pre>{JSON.stringify(auth.config || {}, null, 2)}</pre></div>
      </div>
    </div>
  );
};

export default FirebaseTestPage;
