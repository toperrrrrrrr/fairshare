import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, doc, getDocs, updateDoc, arrayUnion, deleteDoc, getDoc } from 'firebase/firestore';
import { FiUserPlus, FiUserX } from 'react-icons/fi';
import './ActivityTab.css';

const ActivityTab = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [groupInvites, setGroupInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch incoming friend requests and group invites
  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setLoading(true);
      try {
        // Friend requests
        const reqsSnap = await getDocs(collection(db, 'users', user.uid, 'friendRequests'));
        setRequests(reqsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'friend' })));
        // Group invites
        const invitesSnap = await getDocs(collection(db, 'users', user.uid, 'groupInvites'));
        setGroupInvites(invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'group' })));
      } catch (err) {
        setError('Failed to load friend requests or group invites.');
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user]);

  // Helper: fetch group names for groupInvites
  useEffect(() => {
    const fetchGroupNames = async () => {
      if (groupInvites.length === 0) return;
      const updated = await Promise.all(groupInvites.map(async invite => {
        if (invite.groupName) return invite;
        try {
          const groupDoc = await getDoc(doc(db, 'groups', invite.groupId));
          const groupName = groupDoc.exists() ? groupDoc.data().name : invite.groupId;
          return { ...invite, groupName };
        } catch {
          return { ...invite, groupName: invite.groupId };
        }
      }));
      setGroupInvites(updated);
    };
    fetchGroupNames();
    // eslint-disable-next-line
  }, [groupInvites.length]);

  // Accept friend request
  const handleAccept = async (req) => {
    setLoading(true);
    setError('');
    try {
      // Add each other as friends
      await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(req.from) });
      await updateDoc(doc(db, 'users', req.from), { friends: arrayUnion(user.uid) });
      // Delete request
      await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', req.from));
      setRequests(requests.filter(r => r.from !== req.from));
    } catch (err) {
      setError('Failed to accept request.');
    }
    setLoading(false);
  };

  // Reject friend request
  const handleReject = async (req) => {
    setLoading(true);
    setError('');
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'friendRequests', req.from));
      setRequests(requests.filter(r => r.from !== req.from));
    } catch (err) {
      setError('Failed to reject request.');
    }
    setLoading(false);
  };

  // Accept group invite
  const handleAcceptGroupInvite = async (invite) => {
    setLoading(true);
    setError('');
    try {
      // Add user to group memberIds
      const groupRef = doc(db, 'groups', invite.groupId);
      await updateDoc(groupRef, { memberIds: arrayUnion(user.uid) });
      // Add group to user's groupIds
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { groupIds: arrayUnion(invite.groupId) });
      // Delete invite
      await deleteDoc(doc(db, 'users', user.uid, 'groupInvites', invite.id));
      setGroupInvites(groupInvites.filter(g => g.id !== invite.id));
    } catch (err) {
      setError('Failed to accept group invite.');
    }
    setLoading(false);
  };

  // Reject group invite
  const handleRejectGroupInvite = async (invite) => {
    setLoading(true);
    setError('');
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'groupInvites', invite.id));
      setGroupInvites(groupInvites.filter(g => g.id !== invite.id));
    } catch (err) {
      setError('Failed to reject group invite.');
    }
    setLoading(false);
  };

  return (
    <div className="activity-tab-section">
      <div className="activity-tab-title">Friend Requests</div>
      {loading && <div>Loading...</div>}
      {error && <div className="activity-tab-error">{error}</div>}
      {requests.length === 0 && groupInvites.length === 0 && !loading && (
        <div className="activity-empty-state">
          <div className="activity-empty-icon">
            <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#8f94fb" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" fill="#f6f7fb"/>
              <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="9" r="3" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 5.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="activity-empty-title">No Activity Yet</div>
          <div className="activity-empty-desc">You have no friend requests or group invites.<br/>Invite friends or join a group to get started!</div>
        </div>
      )}
      <ul className="activity-requests-list">
        {requests.map(req => (
          <li key={req.from} className="activity-requests-item">
            <span>@{req.fromUsername?.replace(/^@+/, '')}</span>
            <button className="activity-accept-btn" onClick={() => handleAccept(req)} title="Accept">
              <FiUserPlus /> Accept
            </button>
            <button className="activity-reject-btn" onClick={() => handleReject(req)} title="Reject">
              <FiUserX /> Reject
            </button>
          </li>
        ))}
        {/* Group Invites */}
        {groupInvites.map(invite => (
          <li key={invite.id} className="activity-requests-item" style={{marginBottom: 16, background: '#f8f9ff', borderRadius: 10, padding: 12, boxShadow: '0 1px 4px rgba(78,84,200,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
            <span style={{fontSize: '1.05rem', fontWeight: 500, color: '#4e54c8', marginBottom: 3}}>
              Group Invite: <strong>{invite.groupName || ''}</strong>
            </span>
            <span style={{fontSize: '0.98rem', color: '#666', marginBottom: 10}}>
              from <b>{invite.fromUsername ? (invite.fromUsername.startsWith('@') ? invite.fromUsername : `@${invite.fromUsername}`) : 'Unknown'}</b>
            </span>
            <div style={{display: 'flex', gap: 8}}>
              <button className="activity-accept-btn" style={{padding: '5px 18px', borderRadius: 7, background: '#4e54c8', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px #dbeafe'}} onClick={() => handleAcceptGroupInvite(invite)} title="Accept">
                <FiUserPlus /> Accept
              </button>
              <button className="activity-reject-btn" style={{padding: '5px 18px', borderRadius: 7, background: '#ecefff', color: '#4e54c8', border: 'none', fontWeight: 600, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px #f3f0ff'}} onClick={() => handleRejectGroupInvite(invite)} title="Reject">
                <FiUserX /> Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityTab;
