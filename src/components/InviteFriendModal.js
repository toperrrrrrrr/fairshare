import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../components/SplashScreen'; // Import SplashScreen

const InviteFriendModal = ({ groupId, onClose }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Search for friends by username
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Fetch the user's friends array from their user doc (not subcollection)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const data = userDoc.exists() ? userDoc.data() : {};
      const friendIds = data.friends || [];
      console.log('InviteModal: friendIds for user', user.uid, friendIds);

      // Fetch current group members to filter them out
      let memberIds = [];
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          const groupData = groupDoc.data();
          memberIds = groupData.memberIds || [];
        }
      } catch (e) {
        console.warn('Could not fetch group members', e);
      }

      // If search is empty, show all friends not already in the group
      const matched = [];
      for (const fid of friendIds) {
        if (memberIds.includes(fid)) continue; // skip if already a member
        const fdoc = await getDoc(doc(db, 'users', fid));
        const fdata = fdoc.exists() ? fdoc.data() : null;
        let uname = fdata && fdata.username ? fdata.username : '';
        // Remove extra @ if present
        if (uname.startsWith('@@')) uname = uname.slice(1);
        if (!search.trim()) {
          if (fdata) matched.push({ id: fid, ...fdata, username: uname });
        } else if (fdata && uname && uname.toLowerCase().includes(search.toLowerCase())) {
          matched.push({ id: fid, ...fdata, username: uname });
        }
      }
      setResults(matched);
    } catch (err) {
      setError('Failed to search friends.');
      console.error('InviteModal: error searching friends', err);
    }
    setLoading(false);
  };

  // Send group invite (add to groupInvites subcollection)
  const handleInvite = async (friend) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Fetch current user's username from Firestore for invite
      let myUsername = user.email;
      try {
        const myDoc = await getDoc(doc(db, 'users', user.uid));
        if (myDoc.exists() && myDoc.data().username) {
          myUsername = myDoc.data().username;
        }
      } catch {}
      const inviteRef = doc(db, 'users', friend.id, 'groupInvites', groupId);
      await setDoc(inviteRef, {
        groupId,
        from: user.uid,
        fromUsername: myUsername,
        createdAt: new Date(),
        status: 'pending',
      });
      setSuccess(`Invited ${friend.username || friend.email}`);
    } catch (err) {
      setError('Failed to send invite.');
    }
    setLoading(false);
  };

  // Show all friends on modal open
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="modal-invite-friend-overlay" onClick={onClose}>
      <div className="modal-invite-friend-content" onClick={e => e.stopPropagation()}>
        <span style={{ position: 'absolute', top: 10, right: 18, fontSize: 26, cursor: 'pointer', color: '#8f94fb', fontWeight: 700 }} onClick={onClose}>&times;</span>
        <h2 style={{ marginBottom: 18 }}>Invite a Friend to Group</h2>
        <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search friends by username"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', width: '70%' }}
          />
          <button type="submit" style={{ marginLeft: 8, padding: '8px 16px', borderRadius: 6, background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 600 }}>Search</button>
        </form>
        {loading && <SplashScreen message="Loading friends..." />}
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
        <div style={{ maxHeight: 180, overflowY: 'auto' }}>
          {results.map(friend => (
            <div key={friend.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span>{friend.username || friend.email}</span>
              <button style={{ padding: '4px 12px', borderRadius: 6, background: '#4e54c8', color: '#fff', border: 'none', fontWeight: 600 }} onClick={() => handleInvite(friend)}>
                Invite
              </button>
            </div>
          ))}
          {results.length === 0 && !loading && <div style={{ color: '#888', marginTop: 12 }}>No friends found.</div>}
        </div>
      </div>
    </div>
  );
};

export default InviteFriendModal;
