import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);

  // Access control: Only SU or ADMIN can access
  const accessLevel = user?.accessLevel || user?.role || '';
  const isAdmin = accessLevel === 'SU' || accessLevel === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchData() {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const groupsSnap = await getDocs(collection(db, 'groups'));
        setGroups(groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        // Fetch feedbacks only if current user is SU
        if (user && (user.accessLevel === 'SU' || user.role === 'SU')) {
          const feedbackSnap = await getDocs(collection(db, 'feedback'));
          setFeedbacks(feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setShowFeedback(true);
        } else {
          setShowFeedback(false);
        }
      } catch (err) {
        setError('Failed to fetch data.');
      }
      setLoading(false);
    }
    fetchData();
  }, [user, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="admin-dashboard-root">
        <h1>Admin Dashboard</h1>
        <div className="admin-error" style={{marginTop: '2rem', color: '#e53e3e', fontWeight: 600}}>
          Access denied. You do not have permission to view this page.
        </div>
      </div>
    );
  }

  async function handleUserSelect(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    setSelectedUser({ id: userDoc.id, ...userDoc.data() });
  }

  async function handleGroupSelect(groupId) {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    setSelectedGroup({ id: groupDoc.id, ...groupDoc.data() });
  }

  async function handleUserDelete(userId) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    await deleteDoc(doc(db, 'users', userId));
    setUsers(users.filter(u => u.id !== userId));
    setSelectedUser(null);
  }

  async function handleGroupDelete(groupId) {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    await deleteDoc(doc(db, 'groups', groupId));
    setGroups(groups.filter(g => g.id !== groupId));
    setSelectedGroup(null);
  }

  async function handleAccessLevelChange(userId, newLevel) {
    await updateDoc(doc(db, 'users', userId), { accessLevel: newLevel });
    setUsers(users => users.map(u => u.id === userId ? { ...u, accessLevel: newLevel } : u));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser({ ...selectedUser, accessLevel: newLevel });
    }
  }

  return (
    <div className="admin-dashboard-root">
      <h1>Admin Dashboard</h1>
      {error && <div className="admin-error">{error}</div>}
      {showFeedback && (
        <div className="admin-feedback-section">
          <h2>Feedback</h2>
          {feedbacks.length === 0 ? (
            <div className="admin-feedback-empty">No feedback submitted yet.</div>
          ) : (
            <ul className="admin-feedback-list">
              {feedbacks.map(fb => (
                <li key={fb.id} className="admin-feedback-item">
                  <div className="admin-feedback-message">{fb.message}</div>
                  <div className="admin-feedback-meta">
                    <span>User: {fb.username || fb.userId}</span>
                    <span style={{marginLeft: 8, color: '#888', fontSize: '0.97rem'}}>{fb.createdAt && fb.createdAt.toDate ? fb.createdAt.toDate().toLocaleString() : ''}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {loading ? <div>Loading...</div> : (
        <div className="admin-main-cols">
          <div className="admin-list-col">
            <h2>Users</h2>
            <ul className="admin-user-list">
              {users.map(user => (
                <li key={user.id} onClick={() => handleUserSelect(user.id)} className={selectedUser && selectedUser.id === user.id ? 'selected' : ''}>
                  {user.username || user.email || user.id}
                </li>
              ))}
            </ul>
            <h2>Groups</h2>
            <ul className="admin-group-list">
              {groups.map(group => (
                <li key={group.id} onClick={() => handleGroupSelect(group.id)} className={selectedGroup && selectedGroup.id === group.id ? 'selected' : ''}>
                  {group.name || group.id}
                </li>
              ))}
            </ul>
          </div>
          <div className="admin-detail-col">
            {selectedUser && (
              <div className="admin-detail-card">
                <h3>User Details</h3>
                <div><b>ID:</b> {selectedUser.id}</div>
                <div><b>Email:</b> {selectedUser.email}</div>
                <div><b>Username:</b> {selectedUser.username}</div>
                <div><b>Groups:</b> {(selectedUser.groupIds || []).join(', ')}</div>
                <div style={{margin: '0.8rem 0'}}>
                  <b>Access Level:</b>
                  <select
                    value={selectedUser.accessLevel || ''}
                    onChange={e => handleAccessLevelChange(selectedUser.id, e.target.value)}
                    className="admin-accesslevel-select"
                    style={{marginLeft: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: '0.5rem'}}
                  >
                    <option value="">---</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SU">SU</option>
                  </select>
                </div>
                <button onClick={() => handleUserDelete(selectedUser.id)} className="admin-delete-btn">Delete User</button>
              </div>
            )}
            {selectedGroup && (
              <div className="admin-detail-card">
                <h3>Group Details</h3>
                <div><b>ID:</b> {selectedGroup.id}</div>
                <div><b>Name:</b> {selectedGroup.name}</div>
                <div><b>Members:</b> {(selectedGroup.memberIds || []).join(', ')}</div>
                <button onClick={() => handleGroupDelete(selectedGroup.id)} className="admin-delete-btn">Delete Group</button>
              </div>
            )}
            {!selectedUser && !selectedGroup && <div>Select a user or group to view details.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
