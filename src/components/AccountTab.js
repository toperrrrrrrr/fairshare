import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { isUsernameUnique } from '../services/userService';

const AccountTab = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || '');
          setEmail(data.email || user.email || '');
        }
      } catch (err) {
        setError('Failed to load user info');
      }
      setLoading(false);
    };
    fetchUser();
  }, [user]);

  // Check username uniqueness on change
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(true);
      return;
    }
    let isCurrent = true;
    setChecking(true);
    isUsernameUnique(username).then(isUnique => {
      if (isCurrent) setUsernameAvailable(isUnique);
      setChecking(false);
    });
    return () => { isCurrent = false; };
  }, [username]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    if (!username.match(/^@?[a-zA-Z0-9_]{3,20}$/)) {
      setError('Invalid username. Use 3-20 letters, numbers, or underscores.');
      setSaving(false);
      return;
    }
    let handle = username;
    if (!handle.startsWith('@')) handle = '@' + handle;
    if (!usernameAvailable) {
      setError('Username is already taken.');
      setSaving(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), { username: handle.toLowerCase() });
      setSuccess('Username updated!');
    } catch (err) {
      setError('Failed to update username');
    }
    setSaving(false);
  };

  if (loading) return <div style={{padding: 24}}>Loading account...</div>;

  return (
    <div style={{maxWidth: 380, margin: '0 auto', padding: '2rem 1rem'}}>
      <h2 style={{marginBottom: 18}}>Account Settings</h2>
      <form onSubmit={handleSave}>
        <label style={{display: 'block', marginBottom: 8, fontWeight: 600}}>
          Username (unique)
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_@]/g, ''))}
            style={{
              width: '100%',
              padding: '0.7rem',
              marginTop: 4,
              marginBottom: 8,
              borderRadius: 8,
              border: username && (!usernameAvailable || !username.match(/^@?[a-zA-Z0-9_]{3,20}$/)) ? '1.5px solid #e53e3e' : '1.5px solid #ecefff',
              fontSize: '1.05rem',
            }}
            required
            minLength={3}
            maxLength={20}
            disabled={saving}
            placeholder="@yourhandle"
            autoComplete="off"
          />
          {checking && <span style={{color: '#718096', marginLeft: 8, fontSize: '0.97rem'}}>Checking...</span>}
          {!checking && username && username.length >= 3 && (
            usernameAvailable ? (
              <span style={{color: '#38a169', marginLeft: 8, fontSize: '0.97rem'}}>Available</span>
            ) : (
              <span style={{color: '#e53e3e', marginLeft: 8, fontSize: '0.97rem'}}>Taken</span>
            )
          )}
        </label>
        <label style={{display: 'block', marginBottom: 18, fontWeight: 600}}>
          Email
          <input
            type="email"
            value={email}
            readOnly
            style={{
              width: '100%',
              padding: '0.7rem',
              marginTop: 4,
              borderRadius: 8,
              border: '1.5px solid #ecefff',
              fontSize: '1.05rem',
              background: '#f8faff',
              color: '#888'
            }}
          />
        </label>
        <button
          type="submit"
          disabled={saving || !username || !usernameAvailable || !username.match(/^@?[a-zA-Z0-9_]{3,20}$/)}
          style={{
            background: '#4e54c8',
            color: '#fff',
            padding: '0.7rem 2.2rem',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '1.07rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            marginBottom: 8,
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {success && <div style={{color: '#38a169', marginTop: 6}}>{success}</div>}
        {error && <div style={{color: '#e53e3e', marginTop: 6}}>{error}</div>}
      </form>
    </div>
  );
};

export default AccountTab;
