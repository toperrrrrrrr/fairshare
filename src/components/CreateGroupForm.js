import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, doc, runTransaction, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './CreateGroupForm.css';

const CreateGroupForm = ({ onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name required');
      setSuccess('');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const userId = user.uid;
      const groupsRef = collection(db, 'groups');
      const userRef = doc(db, 'users', userId);

      await runTransaction(db, async (transaction) => {
        const groupDocRef = doc(groupsRef); // Pre-generate ID
        transaction.set(groupDocRef, {
          name: groupName,
          memberIds: [userId],
          createdAt: serverTimestamp(),
        });
        transaction.update(userRef, {
          groupIds: arrayUnion(groupDocRef.id),
        });
      });

      setSuccess('✅ Group Created!');
      setGroupName('');
      if (onGroupCreated) onGroupCreated();
      setTimeout(() => {
        setSuccess('');
        navigate('/groups');
      }, 1000);
    } catch (err) {
      setError('❌ ' + (err.message || 'Failed to create group'));
    }
    setLoading(false);
  };

  return (
    <div className="create-group-card">
      <form onSubmit={handleSubmit}>
        <div className="create-group-title">Create a New Group</div>
        <input
          type="text"
          placeholder="Group name"
          value={groupName}
          onChange={(e) => { setGroupName(e.target.value); setError(''); }}
          required
          disabled={loading}
        />
        <button
          type="submit"
          className={`create-group-btn${loading ? ' loading' : ''}`}
          disabled={loading || !groupName.trim()}
        >
          {loading ? <span className="loader"></span> : 'Create Group'}
        </button>
        {error && <div className="create-group-error">{error}</div>}
        {success && <div className="create-group-success">{success}</div>}
      </form>
    </div>
  );
};

export default CreateGroupForm;
