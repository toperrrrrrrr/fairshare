// --- FRIENDS LIST COMPONENT ---
import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { FiUserPlus, FiUserCheck } from 'react-icons/fi';
import FriendsListSkeleton from './skeletons/FriendsListSkeleton'; 
import SplashScreen from './SplashScreen'; 
import './FriendsList.css';

const FriendsList = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendUsernames, setFriendUsernames] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]); // incoming
  const [outgoingRequests, setOutgoingRequests] = useState([]); // sent by me
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch friends and their usernames
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
      const data = userDoc.exists() ? userDoc.data() : {};
      setFriends(data.friends || []);
      // Fetch usernames for friends
      if (data.friends && data.friends.length > 0) {
        const friendDocs = await Promise.all(data.friends.map(fid => getDoc(doc(db, 'users', fid))));
        setFriendUsernames(friendDocs.map((fd, idx) => fd.exists() ? fd.data().username : data.friends[idx]));
      } else {
        setFriendUsernames([]);
      }
    });
    return () => unsub();
  }, [user]);

  // Fetch incoming pending friend requests
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'friendRequests'), (snap) => {
      const reqs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(r => r.status === 'pending');
      setPendingRequests(reqs);
    });
    return () => unsub();
  }, [user]);

  // Fetch outgoing friend requests
  useEffect(() => {
    if (!user) return;
    let unsubscribes = [];
    const fetchOutgoing = async () => {
      // Get all users to check for outgoing requests
      const usersSnap = await getDocs(collection(db, 'users'));
      let outgoing = [];
      await Promise.all(usersSnap.docs.map(async (uDoc) => {
        if (uDoc.id === user.uid) return;
        const reqSnap = await getDoc(doc(db, 'users', uDoc.id, 'friendRequests', user.uid));
        if (reqSnap.exists() && reqSnap.data().status === 'pending') {
          outgoing.push({ id: uDoc.id, ...uDoc.data(), reqId: reqSnap.id });
        }
      }));
      setOutgoingRequests(outgoing);
    };
    fetchOutgoing();
    // No real-time for outgoing (unless you want to listen to all users)
    return () => { unsubscribes.forEach(u => u && u()); };
  }, [user]);

  // --- SEARCH ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setError('');
    // Remove leading @ if present
    let searchTerm = search.trim();
    if (searchTerm.startsWith('@')) searchTerm = searchTerm.slice(1);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', '@' + searchTerm.toLowerCase()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setSearchResults([]);
        setError('No user found with that username.');
      } else {
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSearchResults(results);
      }
    } catch (err) {
      setError('Search failed.');
    }
    setLoading(false);
  };

  // --- SEND FRIEND REQUEST ---
  const handleAddFriend = async (friend) => {
    setLoading(true);
    setError('');
    try {
      if (friends.includes(friend.id)) {
        setError('Already friends.');
        setLoading(false);
        return;
      }
      // Fetch current user's username from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const myUsername = userDoc.exists() ? userDoc.data().username : user.email;
      const reqRef = doc(db, 'users', friend.id, 'friendRequests', user.uid);
      await setDoc(reqRef, {
        from: user.uid,
        fromUsername: myUsername,
        to: friend.id,
        toUsername: friend.username,
        status: 'pending',
        createdAt: new Date()
      });
      setSearchResults([]);
      setSearch('');
      setError('Friend request sent!');
    } catch (err) {
      setError('Failed to send friend request.');
    }
    setLoading(false);
  };

  // --- ACCEPT FRIEND REQUEST ---
  const handleAcceptRequest = async (req) => {
    try {
      // Add each other as friends
      await updateDoc(doc(db, 'users', user.uid), { friends: friends.concat(req.from) });
      const otherUserDoc = await getDoc(doc(db, 'users', req.from));
      const otherFriends = otherUserDoc.exists() ? otherUserDoc.data().friends || [] : [];
      await updateDoc(doc(db, 'users', req.from), { friends: [...otherFriends, user.uid] });
      // Update request status
      await updateDoc(doc(db, 'users', user.uid, 'friendRequests', req.from), { status: 'accepted' });
    } catch (err) {
      setError('Failed to accept request.');
    }
  };

  // --- DECLINE FRIEND REQUEST ---
  const handleDeclineRequest = async (req) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'friendRequests', req.from), { status: 'declined' });
    } catch (err) {
      setError('Failed to decline request.');
    }
  };

  // --- REMOVE FRIEND ---
  const handleRemoveFriend = async (fid) => {
    if (!window.confirm('Remove this friend?')) return;
    try {
      const newFriends = friends.filter(f => f !== fid);
      await updateDoc(doc(db, 'users', user.uid), { friends: newFriends });
      // Remove you from their friends
      const otherUserDoc = await getDoc(doc(db, 'users', fid));
      const otherFriends = otherUserDoc.exists() ? otherUserDoc.data().friends || [] : [];
      await updateDoc(doc(db, 'users', fid), { friends: otherFriends.filter(f => f !== user.uid) });
    } catch (err) {
      setError('Failed to remove friend.');
    }
  };

  return (
    <div className="friends-list-section">
      <div className="friends-list-title">Friends</div>
      <form className="friends-search-form" onSubmit={handleSearch}>
        <input
          type="text"
          className="friends-search-input"
          placeholder="Search by username (@username)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="friends-search-btn" type="submit" disabled={loading || !search.trim()}>
          <FiUserPlus />
        </button>
      </form>
      {error && <div className="friends-list-error">{error}</div>}
      {searchResults.length > 0 && (
        <div className="friends-search-results">
          {searchResults.map(result => (
            <div key={result.id} className="friends-search-result-item">
              <span>@{result.username?.replace(/^@+/, '')}</span>
              {friends.includes(result.id) ? (
                <FiUserCheck style={{ color: '#38a169', marginLeft: 12 }} title="Already a friend" />
              ) : (
                <button
                  className="friends-add-btn"
                  onClick={() => handleAddFriend(result)}
                  disabled={loading}
                  title="Send Friend Request"
                >
                  <FiUserPlus />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* --- Pending Requests Section --- */}
      <div className="friends-pending-section">
        <div className="friends-pending-title">Pending Friend Requests</div>
        {pendingRequests.length === 0 && <div className="friends-pending-list-empty">No pending requests.</div>}
        {pendingRequests.length > 0 && (
          <ul className="friends-pending-list">
            {pendingRequests.map(req => (
              <li key={req.from} className="friends-pending-item">
                <span>@{req.fromUsername?.replace(/^@+/, '')}</span>
                <button className="friends-accept-btn" onClick={() => handleAcceptRequest(req)}>Accept</button>
                <button className="friends-decline-btn" onClick={() => handleDeclineRequest(req)}>Decline</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Outgoing Requests Section --- */}
      <div className="friends-outgoing-section">
        <div className="friends-outgoing-title">Outgoing Friend Requests</div>
        {outgoingRequests.length === 0 && <div className="friends-outgoing-list-empty">No outgoing requests.</div>}
        {outgoingRequests.length > 0 && (
          <ul className="friends-outgoing-list">
            {outgoingRequests.map(req => (
              <li key={req.id} className="friends-outgoing-item">
                <span>@{req.username?.replace(/^@+/, '') || req.email}</span>
                <span className="friends-outgoing-status">Pending</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="friends-list">
        <div className="friends-list-label">Your Friends:</div>
        {loading && <FriendsListSkeleton />} 
        {!loading && friendUsernames.length === 0 && <div className="friends-list-empty">No friends yet.</div>}
        <ul>
          {friendUsernames.map((uname, i) => (
            <li key={uname + i} className="friends-list-item">
              <FiUserCheck style={{ color: '#4e54c8', marginRight: 8 }} />
              <span>@{uname?.replace(/^@+/, '')}</span>
              <button className="friends-remove-btn" onClick={() => handleRemoveFriend(friends[i])}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FriendsList;
