import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiClock } from "react-icons/fi";
import FabCreateGroup from "./FabCreateGroup";
import CreateGroupForm from "./CreateGroupForm";
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

const GroupList = ({ refreshKey }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    const fetchGroups = async () => {
      if (!user) return;
      setLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const groupIds = userData?.groupIds || [];
      if (groupIds.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }
      let allGroups = [];
      const groupsRef = collection(db, "groups");
      for (let i = 0; i < groupIds.length; i += 10) {
        const batch = groupIds.slice(i, i + 10);
        const q = query(groupsRef, where("__name__", "in", batch));
        const querySnapshot = await getDocs(q);
        allGroups = allGroups.concat(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
      allGroups.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return (a.name || "").localeCompare(b.name || "");
      });
      setGroups(allGroups);
      setLoading(false);
    };
    fetchGroups();
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
              onClick={async () => {
                setRouteLoading(true);
                navigate(`/dashboard?group=${group.id}`);
                setTimeout(() => setRouteLoading(false), 600);
              }}
              onMouseOver={(e) => {
                e.currentTarget.classList.add("group-card-hover");
              }}
              onMouseOut={(e) => {
                e.currentTarget.classList.remove("group-card-hover");
              }}
              title={`Click to open group: ${group.name}`}
            >
              <div className="group-card-header">
                <span className="group-card-name">
                  <span className="group-card-icon">
                    {group.emoji || <FiUsers />}
                  </span>
                  {group.name}
                </span>
                <span className="group-card-meta">
                  <span title="Last updated" className="group-card-meta-time">
                    <FiClock className="group-card-meta-clock" />
                    {group.createdAt
                      ? getRelativeTime(
                          new Date(group.createdAt.seconds * 1000)
                        )
                      : "—"}
                  </span>
                  <span title="Members">
                    Members: {group.memberIds.length}
                  </span>
                </span>
              </div>
              <div className="group-card-footer">
                {group.ownerId === user.uid
                  ? "You created this group"
                  : `Joined ${
                      group.createdAt
                        ? getRelativeTime(
                            new Date(group.createdAt.seconds * 1000)
                          )
                        : ""
                    }`}
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
            <CreateGroupForm onGroupCreated={() => setShowCreateModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupList;
