// --- FRIENDS LIST COMPONENT ---
import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, doc, getDoc, getDocs, setDoc, query, where } from 'firebase/firestore';
import { FiUserPlus, FiUserCheck } from 'react-icons/fi';
import FriendsListSkeleton from './skeletons/FriendsListSkeleton'; 
import SplashScreen from './SplashScreen'; 

const FriendsList = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendUsernames, setFriendUsernames] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch friends and their usernames
  useEffect(() => {
    if (!user) return;
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        setFriends(data.friends || []);
        // Fetch usernames for friends
        if (data.friends && data.friends.length > 0) {
          const friendDocs = await Promise.all(data.friends.map(fid => getDoc(doc(db, 'users', fid))));
          setFriendUsernames(friendDocs.map((fd, idx) => fd.exists() ? fd.data().username : data.friends[idx]));
        } else {
          setFriendUsernames([]);
        }
      } catch (err) {
        setError('Failed to load friends.');
      }
      setLoading(false);
    };
    fetchFriends();
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
      <div className="friends-list">
        <div className="friends-list-label">Your Friends:</div>
        {loading && <FriendsListSkeleton />} 
        {!loading && friendUsernames.length === 0 && <div className="friends-list-empty">No friends yet.</div>}
        <ul>
          {friendUsernames.map((uname, i) => (
            <li key={uname + i} className="friends-list-item">
              <FiUserCheck style={{ color: '#4e54c8', marginRight: 8 }} />
              <span>@{uname?.replace(/^@+/, '')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FriendsList;
