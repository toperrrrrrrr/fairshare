import React, { useEffect, useState, useRef } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, doc, getDocs, updateDoc, arrayUnion, deleteDoc, getDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FiUserPlus, FiUserX } from 'react-icons/fi';
import './ActivityTab.css';
import { markActivityRead, markActivityUnread, isActivityRead } from '../services/activityService';

const ActivityTab = () => {
  const { user } = useAuth();
  const [groupInvites, setGroupInvites] = useState([]);
  const [transactionNotifs, setTransactionNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [readNotifIds, setReadNotifIds] = useState(new Set());

  // Track listeners to clean up
  const transactionListenersRef = useRef([]);

  // Fetch incoming group invites
  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setLoading(true);
      try {
        // Group invites
        const invitesSnap = await getDocs(collection(db, 'users', user.uid, 'groupInvites'));
        setGroupInvites(invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'group' })));
      } catch (err) {
        setError('Failed to load group invites.');
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

  // Listen for new transactions in all groups the user is in
  useEffect(() => {
    if (!user) return;
    let unsubUserDoc = null;
    let unsubTransactions = [];
    let isUnmounted = false;

    const listenToTransactions = async () => {
      // Listen to user's groupIds
      unsubUserDoc = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
        const userData = userDoc.exists() ? userDoc.data() : null;
        const groupIds = userData?.groupIds || [];
        // Remove previous listeners
        unsubTransactions.forEach(unsub => unsub());
        unsubTransactions = [];
        let allTrans = [];
        for (const groupId of groupIds) {
          const transRef = collection(db, 'groups', groupId, 'transactions');
          const q = query(transRef, orderBy('createdAt', 'desc'));
          const unsub = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs
              .filter(doc => doc.data().from !== user.uid) // Not created by self
              .map(doc => ({
                id: doc.id,
                ...doc.data(),
                groupId,
                type: 'transaction',
              }));
            allTrans = [
              ...allTrans.filter(t => t.groupId !== groupId),
              ...notifs
            ];
            // Sort by createdAt desc
            allTrans.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            // Fetch group names and user info for all transactions (if not already attached)
            const fetchGroupNamesAndUsers = async () => {
              const groupNamesCache = {};
              const userCache = {};
              const updatedTrans = await Promise.all(allTrans.map(async notif => {
                let groupName = notif.groupName;
                if (!groupName) {
                  if (groupNamesCache[notif.groupId]) {
                    groupName = groupNamesCache[notif.groupId];
                  } else {
                    try {
                      const groupDoc = await getDoc(doc(db, 'groups', notif.groupId));
                      groupName = groupDoc.exists() ? groupDoc.data().name : notif.groupId;
                      groupNamesCache[notif.groupId] = groupName;
                    } catch {
                      groupName = notif.groupId;
                    }
                  }
                }
                // Determine who performed the transaction
                let fromUsername = notif.fromUsername;
                let fromName = notif.fromName;
                if (notif.paidBy) {
                  // Expense entry: use paidBy value directly
                  fromUsername = notif.paidBy;
                  fromName = notif.paidBy;
                } else {
                  // Settlement entry: fetch user info by ID
                  const actorId = notif.from;
                  if ((!fromUsername || !fromName) && actorId) {
                    if (userCache[actorId]) {
                      fromUsername = userCache[actorId].username;
                      fromName = userCache[actorId].name;
                    } else {
                      try {
                        const userDoc = await getDoc(doc(db, 'users', actorId));
                        if (userDoc.exists()) {
                          fromUsername = userDoc.data().username || '';
                          fromName = userDoc.data().name || '';
                          userCache[actorId] = { username: fromUsername, name: fromName };
                        }
                      } catch {
                        // fallback: leave as is
                      }
                    }
                  }
                }
                return { ...notif, groupName, fromUsername, fromName };
              }));
              if (!isUnmounted) setTransactionNotifs([...updatedTrans]);
            };
            fetchGroupNamesAndUsers();
          });
          unsubTransactions.push(unsub);
        }
      });
    };
    listenToTransactions();
    return () => {
      isUnmounted = true;
      if (unsubUserDoc) unsubUserDoc();
      unsubTransactions.forEach(unsub => unsub());
    };
  }, [user]);

  // Listen for read notification ids
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'activityRead'),
      (snapshot) => {
        const ids = new Set(snapshot.docs.map(doc => doc.id));
        setReadNotifIds(ids);
      }
    );
    return () => unsub();
  }, [user]);

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

  // Delete notification
  const handleDeleteNotification = async (notif) => {
    setLoading(true);
    setError('');
    try {
      // Remove from user's activityRead collection if present
      await deleteDoc(doc(db, 'users', user.uid, 'activityRead', notif.id));
      // Remove the transaction/notification itself
      if (notif.type === 'settlement' || notif.type === 'transaction') {
        await deleteDoc(doc(db, 'groups', notif.groupId, 'transactions', notif.id));
      }
      setTransactionNotifs(transactionNotifs.filter(n => n.id !== notif.id));
    } catch (err) {
      setError('Failed to delete notification.');
    }
    setLoading(false);
  };

  return (
    <div className="activity-tab-section">
      <div className="activity-tab-title">Activity</div>
      {loading && <div>Loading...</div>}
      {error && <div className="activity-tab-error">{error}</div>}
      {groupInvites.length === 0 && transactionNotifs.length === 0 && !loading && (
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
          <div className="activity-empty-desc">You have no group invites or transactions.<br/>Invite friends or join a group to get started!</div>
        </div>
      )}
      <ul className="activity-requests-list">
        {/* Only Group Invites */}
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
        {/* Transaction Notifications */}
        {transactionNotifs
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .map(notif => {
            // If this is a settlement, render as settlement
            if (notif.type === 'settlement') {
              return (
                <li key={notif.id} className={
                  'activity-requests-item' +
                  (readNotifIds.has(notif.id) ? ' activity-read' : ' activity-unread')
                }
                style={{marginBottom: 16, background: readNotifIds.has(notif.id) ? '#f2f2f7' : '#f7fafd', borderRadius: 10, padding: 12, boxShadow: '0 1px 4px rgba(78,84,200,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', opacity: readNotifIds.has(notif.id) ? 0.7 : 1 }}
                onClick={async () => { if (!readNotifIds.has(notif.id)) await markActivityRead(user.uid, notif.id); }}
              >
                <span style={{fontSize: '1.05rem', fontWeight: 500, color: '#4e54c8', marginBottom: 3}}>
                  Settlement in <strong>{notif.groupName || notif.groupId || ''}</strong>
                </span>
                <span style={{fontSize: '0.98rem', color: '#666', marginBottom: 6}}>
                  by <b>{notif.fromUsername
                    ? (notif.fromUsername.startsWith('@') ? notif.fromUsername : `@${notif.fromUsername}`)
                    : (notif.fromName || notif.from || 'Someone')}</b>
                </span>
                <span style={{fontSize: '0.97rem', color: '#444', marginBottom: 4}}>
                  Payment: ₱{notif.amount} {notif.note && <span style={{color:'#8f94fb'}}>• {notif.note}</span>}
                </span>
                <span style={{fontSize: '0.93rem', color: '#888'}}>
                  {notif.createdAt && notif.createdAt.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : ''}
                </span>
                {!readNotifIds.has(notif.id) && (
                  <button
                    className="activity-mark-read-btn"
                    style={{marginTop: 7, alignSelf: 'flex-end', background: '#4e54c8', color: '#fff', border: 'none', borderRadius: 7, padding: '2px 13px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer'}}
                    onClick={async (e) => { e.stopPropagation(); await markActivityRead(user.uid, notif.id); }}
                  >
                    Mark as Read
                  </button>
                )}
                {readNotifIds.has(notif.id) && (
                  <button
                    className="activity-mark-unread-btn"
                    style={{marginTop: 7, alignSelf: 'flex-end', background: '#ecefff', color: '#4e54c8', border: 'none', borderRadius: 7, padding: '2px 13px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer'}}
                    onClick={async (e) => { e.stopPropagation(); await markActivityUnread(user.uid, notif.id); }}
                  >
                    Mark as Unread
                  </button>
                )}
                <button
                  className="activity-delete-btn"
                  style={{marginTop: 7, alignSelf: 'flex-end', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 7, padding: '2px 13px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer'}}
                  onClick={async (e) => { e.stopPropagation(); await handleDeleteNotification(notif); }}
                >
                  Delete
                </button>
              </li>
              );
            }
            // Otherwise, render as expense
            return (
              <li key={notif.id} className={
                  'activity-requests-item' +
                  (readNotifIds.has(notif.id) ? ' activity-read' : ' activity-unread')
                }
                style={{marginBottom: 16, background: readNotifIds.has(notif.id) ? '#f2f2f7' : '#f7fafd', borderRadius: 10, padding: 12, boxShadow: '0 1px 4px rgba(78,84,200,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', opacity: readNotifIds.has(notif.id) ? 0.7 : 1 }}
                onClick={async () => { if (!readNotifIds.has(notif.id)) await markActivityRead(user.uid, notif.id); }}
              >
                <span style={{fontSize: '1.05rem', fontWeight: 500, color: '#4e54c8', marginBottom: 3}}>
                  Transaction Added in <strong>{notif.groupName || notif.groupId || ''}</strong>
                  {notif.fromUsername || notif.fromName ? (
                    <span style={{fontWeight: 400, color: '#7d81b3'}}> by <b>{notif.fromUsername && notif.fromUsername.trim() !== ''
                      ? (notif.fromUsername.startsWith('@') ? notif.fromUsername : `@${notif.fromUsername}`)
                      : notif.fromName || 'Someone'}</b></span>
                  ) : (
                    <span style={{fontWeight: 400, color: '#7d81b3'}}> by <b>Someone</b></span>
                  )}
                </span>
                <span style={{fontSize: '0.97rem', color: '#444', marginBottom: 4}}>
                  Amount: ₱{notif.amount} {notif.note && <span style={{color:'#8f94fb'}}>• {notif.note}</span>}
                </span>
                <span style={{fontSize: '0.93rem', color: '#888'}}>
                  {notif.createdAt && notif.createdAt.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : ''}
                </span>
                {!readNotifIds.has(notif.id) && (
                  <button
                    className="activity-mark-read-btn"
                    style={{marginTop: 7, alignSelf: 'flex-end', background: '#4e54c8', color: '#fff', border: 'none', borderRadius: 7, padding: '2px 13px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer'}}
                    onClick={async (e) => { e.stopPropagation(); await markActivityRead(user.uid, notif.id); }}
                  >
                    Mark as Read
                  </button>
                )}
                {readNotifIds.has(notif.id) && (
                  <button
                    className="activity-mark-unread-btn"
                    style={{marginTop: 7, alignSelf: 'flex-end', background: '#ecefff', color: '#4e54c8', border: 'none', borderRadius: 7, padding: '2px 13px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer'}}
                    onClick={async (e) => { e.stopPropagation(); await markActivityUnread(user.uid, notif.id); }}
                  >
                    Mark as Unread
                  </button>
                )}
                <button
                  className="activity-delete-btn"
                  style={{marginTop: 7, alignSelf: 'flex-end', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 7, padding: '2px 13px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer'}}
                  onClick={async (e) => { e.stopPropagation(); await handleDeleteNotification(notif); }}
                >
                  Delete
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
};

export default ActivityTab;
