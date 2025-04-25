import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiClock } from "react-icons/fi";
import FabCreateGroup from "./FabCreateGroup";
import CreateGroupForm from "./CreateGroupForm";
import JoinGroupForm from "./JoinGroupForm";
import "./GroupList.css";

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
  const [routeLoading, setRouteLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
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
    let unsubscribeGroups = null;
    let unsubscribed = false;

    const fetchAndListen = async () => {
      // Listen to user document for groupIds changes in real time
      unsubscribeGroups = onSnapshot(
        doc(db, "users", user.uid),
        async (userDoc) => {
          const userData = userDoc.exists() ? userDoc.data() : null;
          const groupIds = userData?.groupIds || [];
          if (groupIds.length === 0) {
            setGroups([]);
            setLoading(false);
            return;
          }
          const groupsRef = collection(db, "groups");
          // Listen for real-time updates to the user's groups
          const batches = [];
          let allGroups = [];
          let batchUnsubs = [];
          for (let i = 0; i < groupIds.length; i += 10) {
            const batch = groupIds.slice(i, i + 10);
            const unsub = onSnapshot(
              query(groupsRef, where("__name__", "in", batch)),
              (querySnapshot) => {
                if (unsubscribed) return;
                const newGroups = querySnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                allGroups = [
                  ...allGroups.filter((g) => !batch.includes(g.id)),
                  ...newGroups,
                ];
                setGroups(
                  [...allGroups].sort((a, b) => {
                    if (a.createdAt && b.createdAt) {
                      return b.createdAt.seconds - a.createdAt.seconds;
                    }
                    return (a.name || "").localeCompare(b.name || "");
                  })
                );
                setLoading(false);
              }
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
          {routeLoading && (
            <div className="group-list-loader">
              <span className="loader"></span>
            </div>
          )}
          {loading && (
            <div className="group-list-loading">Loading groups...</div>
          )}
          {!loading && groups.length === 0 && (
            <div className="group-list-empty">
              You’re not in any groups yet. Create one or join an existing
              group.
            </div>
          )}
        </div>
      </div>
      <FabCreateGroup onClick={() => setShowCreateModal(true)} />
      <button className="fab-join-group" onClick={() => setShowJoinModal(true)}>
        Join Group
      </button>
      {showCreateModal && (
        <div
          className="modal-create-group-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="modal-create-group-content"
            onClick={(e) => e.stopPropagation()}
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
              }}
              onClick={() => setShowCreateModal(false)}
            >
              &times;
            </span>
            <CreateGroupForm
              onGroupCreated={(newGroup) => {
                setShowCreateModal(false);
                if (newGroup && !groups.some((g) => g.id === newGroup.id)) {
                  setGroups((prev) => [
                    {
                      ...newGroup,
                      createdAt: { seconds: Math.floor(Date.now() / 1000) },
                    },
                    ...prev,
                  ]);
                }
              }}
            />
          </div>
        </div>
      )}
      {showJoinModal && (
        <div
          className="modal-join-group-overlay"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="modal-join-group-content"
            onClick={(e) => e.stopPropagation()}
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
              }}
              onClick={() => setShowJoinModal(false)}
            >
              &times;
            </span>
            <JoinGroupForm
              onJoined={() => {
                setShowJoinModal(false);
              }}
              onClose={() => setShowJoinModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupList;
