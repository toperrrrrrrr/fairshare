import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { isUsernameUnique } from '../services/userService';
import AccountTabSkeleton from './skeletons/AccountTabSkeleton';
import SplashScreen from '../components/SplashScreen';
import FeedbackSection from './FeedbackSection';
import './AccountTab.css';

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

  if (loading) return <AccountTabSkeleton />;

  return (
    <div className="account-tab-root">
      <div className="account-section">
        <div className="account-title">Profile</div>
        <form onSubmit={handleSave} className="account-form">
          <label htmlFor="username" className="account-label">Username</label>
          <input
            id="username"
            className="account-input"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_@]/g, ''))}
            disabled={saving}
            maxLength={21}
            autoComplete="username"
            required
          />
          <div className="account-email">Email: {email}</div>
          <button className="account-save-btn" type="submit" disabled={saving || !usernameAvailable}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {success && <div style={{color: '#38a169', marginTop: 6}}>{success}</div>}
          {error && <div style={{color: '#e53e3e', marginTop: 6}}>{error}</div>}
        </form>
      </div>
      <hr className="account-divider" />
      <FeedbackSection />
    </div>
  );
};

export default AccountTab;
