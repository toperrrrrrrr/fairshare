import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
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

  // Utility to generate a random short invite code
  function generateInviteCode(length = 7) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0, O, I, 1
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

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
        const inviteCode = generateInviteCode();
        transaction.set(groupDocRef, {
          name: groupName,
          memberIds: [userId],
          createdAt: serverTimestamp(),
          ownerId: userId,
          inviteCode,
        });
        transaction.update(userRef, {
          groupIds: arrayUnion(groupDocRef.id),
        });
        // Pass groupDocRef to parent for optimistic update
        if (onGroupCreated) {
          // Pass minimal info for optimistic UI, Firestore will sync full data
          onGroupCreated({
            id: groupDocRef.id,
            name: groupName,
            memberIds: [userId],
            createdAt: new Date(), // Use local time for now
            ownerId: userId,
            inviteCode,
          });
        }
      });

      setSuccess('✅ Group Created!');
      setGroupName('');
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
    <form onSubmit={handleSubmit}>
      <div className="create-group-title">Create a New Group</div>
      <input
        type="text"
        className="create-group-input"
        placeholder="Group name"
        value={groupName}
        onChange={e => setGroupName(e.target.value)}
        disabled={loading}
      />
      <button
        className="create-group-btn"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Group'}
      </button>
      {error && <div className="create-group-error">{error}</div>}
      {success && <div className="create-group-success">{success}</div>}
    </form>
  );
};

export default CreateGroupForm;
