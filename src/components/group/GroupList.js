import React, { useEffect, useState } from "react";
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiClock } from "react-icons/fi";
import CreateGroupForm from '../CreateGroupForm';
import JoinGroupForm from '../JoinGroupForm';
import InviteFriendModal from '../modals/InviteFriendModal';
import GroupListSkeleton from '../skeletons/GroupListSkeleton';
import SplashScreen from '../SplashScreen';
import '../../components/styles/GroupList.css';

function getRelativeTime(date) {
  if (!date) return "";
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const intervals = [
    { label: "y", secs: 31536000 },
    { label: "mo", secs: 2592000 },
    { label: "d", secs: 86400 },
    { label: "h", secs: 3600 },
    { label: "m", secs: 60 },
  ];
  for (const { label, secs } of intervals) {
    const v = Math.floor(seconds / secs);
    if (v > 0) return `${v}${label} ago`;
  }
  return "just now";
}

// Utility: Generate a pastel color from a string (e.g., group id or name)
function getPastelColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // H: 0-360, S: 60-80%, L: 75-85% (pastel)
  const h = hash % 360;
  const s = 70 + (hash % 10); // 70-79
  const l = 80 + (hash % 6); // 80-85
  return `hsl(${h}, ${s}%, ${l}%)`;
}

const GroupList = ({ refreshKey }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteGroupId, setInviteGroupId] = useState(null);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 700
  );
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 700);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    console.log('[GroupList] useEffect triggered. user:', user);
    let unsubscribeGroups = null;
    let unsubscribed = false;

    const fetchAndListen = async () => {
      // Listen to user document for groupIds changes in real time
      unsubscribeGroups = onSnapshot(
        doc(db, "users", user.uid),
        async (userDoc) => {
          const userData = userDoc.exists() ? userDoc.data() : null;
          const groupIds = userData?.groupIds || [];
          console.log('[GroupList] User doc snapshot:', userData, 'groupIds:', groupIds);
          if (groupIds.length === 0) {
            setGroups([]);
            setLoading(false);
            return;
          }
          const groupsRef = collection(db, "groups");
          // Listen for real-time updates to the user's groups
          let allGroups = [];
          let batchUnsubs = [];
          for (let i = 0; i < groupIds.length; i += 10) {
            const batch = groupIds.slice(i, i + 10);
            // Capture batch in closure to avoid referencing loop variable
            const unsub = onSnapshot(
              query(groupsRef, where("__name__", "in", batch)),
              ((batchCopy) => (querySnapshot) => {
                if (unsubscribed) return;
                const newGroups = querySnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                console.log('[GroupList] Groups batch received:', newGroups);
                allGroups = [
                  ...allGroups.filter((g) => !batchCopy.includes(g.id)),
                  ...newGroups,
                ];
                setGroups([...allGroups]);
                setLoading(false); // Ensure loading is set to false after first group data is loaded
              })(batch)
            );
            batchUnsubs.push(unsub);
          }
          // Clean up previous listeners if any
          unsubscribeGroups = () => {
            batchUnsubs.forEach((unsub) => unsub());
            unsubscribed = true;
          };
        }
      );
    };
    fetchAndListen();
    return () => {
      if (unsubscribeGroups) unsubscribeGroups();
    };
  }, [user, refreshKey]);

  return (
    <div className={`group-list-root${isMobile ? " mobile" : ""}`}>
      <div className="group-list-section">
        <div className="group-list-title">Your Groups</div>
        <div className="group-list-scrollable">
          {groups.map((group) => (
            <div
              key={group.id}
              className="group-card"
              onClick={() => navigate(`/group/${group.id}`)}
              style={{
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(78,84,200,0.07)',
                marginBottom: '1.5rem',
                border: '1.5px solid #ecefff',
                borderRadius: '1.1rem',
                transition: 'box-shadow 0.16s',
                padding: '1.1rem 1.5rem 1.2rem 1.3rem',
                background: '#fff',
                minHeight: 90,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div className="group-card-header" style={{alignItems: 'center', display: 'flex', gap: 12, marginBottom: 6}}>
                <div style={{display: 'flex', alignItems: 'center', flex: 1, minWidth: 0}}>
                  <div
                    className="group-card-icon"
                    style={{
                      background: getPastelColor(group.id),
                      width: 44,
                      height: 44,
                      fontSize: '1.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      boxShadow: '0 1px 5px rgba(78,84,200,0.07)'
                    }}
                  >
                    <FiUsers />
                  </div>
                  <div style={{flex: 1, minWidth: 0, marginLeft: 14}}>
                    <div className="group-card-name" style={{fontWeight: 700, fontSize: '1.18rem', color: '#2d3748', marginBottom: 0, letterSpacing: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{group.name}</div>
                  </div>
                </div>
              </div>
              <div className="group-card-meta" style={{marginTop: 0, fontSize: '1.04rem', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px 2px 2px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                  <span style={{color: '#5a4e9e', fontWeight: 700, fontSize: '1.12rem', display: 'flex', alignItems: 'center'}}>
                    <FiUsers style={{marginRight: 4, fontSize: '1.17em'}} /> {group.memberIds.length}
                  </span>
                  <span className="group-card-meta-time" style={{display: 'flex', alignItems: 'center', color: '#8f94fb', fontWeight: 500, fontSize: '1.01rem'}}>
                    <FiClock className="group-card-meta-clock" style={{marginRight: 3}} />
                    {group.createdAt
                      ? getRelativeTime(new Date(group.createdAt.seconds * 1000))
                      : "—"}
                  </span>
                </div>
                {group.inviteCode && (
                  <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                    <span style={{color: '#4e54c8', fontWeight: 700, marginRight: 3, fontSize: '1.01rem'}}>Code:</span>
                    <span style={{fontFamily: 'monospace', background: '#f3f0ff', padding: '3px 12px', borderRadius: 8, fontSize: '1.07rem', letterSpacing: 1, color: '#4e54c8', border: '1.5px solid #ecefff', boxShadow: '0 1px 6px rgba(78,84,200,0.06)'}}>{group.inviteCode}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <GroupListSkeleton />
          )}
          {!loading && groups.length === 0 && (
            <div className="group-list-empty">
              You’re not in any groups yet. Create one or join an existing
              group.
            </div>
          )}
        </div>
      </div>
      <div className="fab-stack">
        <button
          className="group-list-fab fab-create-group"
          aria-label="Create Group"
          onClick={e => { e.stopPropagation(); setShowCreateModal(true); }}
        >
          <span aria-hidden="true" className="fab-icon">+</span>
        </button>
        <button
          className="group-list-fab fab-join-group"
          aria-label="Join Group"
          onClick={e => { e.stopPropagation(); setShowJoinModal(true); }}
        >
          <svg className="fab-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
      </div>
      {showCreateModal && (
        <div
          className="modal-create-group-overlay"
          style={{zIndex: 2000}}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-create-group-content"
            style={{zIndex: 2001}}
            onClick={e => e.stopPropagation()}
          >
            <span
              style={{
                position: "absolute",
                top: 10,
                right: 18,
                fontSize: 26,
                cursor: "pointer",
                color: "#8f94fb",
                fontWeight: 700,
                zIndex: 2002
              }}
              onClick={() => setShowCreateModal(false)}
            >
              &times;
            </span>
            <CreateGroupForm onClose={() => setShowCreateModal(false)} />
          </div>
        </div>
      )}
      {showJoinModal && (
        <div
          className="modal-join-group-overlay"
          style={{zIndex: 2000}}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="modal-join-group-content"
            style={{zIndex: 2001}}
            onClick={e => e.stopPropagation()}
          >
            <span
              style={{
                position: "absolute",
                top: 10,
                right: 18,
                fontSize: 26,
                cursor: "pointer",
                color: "#8f94fb",
                fontWeight: 700,
                zIndex: 2002
              }}
              onClick={() => setShowJoinModal(false)}
            >
              &times;
            </span>
            <JoinGroupForm onClose={() => setShowJoinModal(false)} />
          </div>
        </div>
      )}
      {showInviteModal && inviteGroupId && (
        <InviteFriendModal groupId={inviteGroupId} onClose={() => { setShowInviteModal(false); setInviteGroupId(null); }} />
      )}
    </div>
  );
};

export default GroupList;
