import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, arrayRemove, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import '../components/GroupList.css'; // Import the CSS for dashboard utility classes

const GroupDashboardPage = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (groupDoc.exists()) {
          const groupData = { id: groupDoc.id, ...groupDoc.data() };
          setGroup(groupData);
          // Fetch member info
          if (groupData.memberIds && groupData.memberIds.length > 0) {
            const usersRef = collection(db, "users");
            // Firestore doesn't support 'in' queries with too many elements, so batch if needed
            const batches = [];
            for (let i = 0; i < groupData.memberIds.length; i += 10) {
              const batchIds = groupData.memberIds.slice(i, i + 10);
              const q = query(usersRef, where("__name__", "in", batchIds));
              batches.push(getDocs(q));
            }
            const batchResults = await Promise.all(batches);
            const membersList = batchResults.flatMap(res => res.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })));
            setMembers(membersList);
          } else {
            setMembers([]);
          }
        } else {
          setError("Group not found.");
        }
      } catch (err) {
        setError("Error loading group.");
      }
      setLoading(false);
    };
    fetchGroup();
  }, [groupId]);

  const handleLeaveOrDelete = async () => {
    if (!group || !user) return;
    setActionLoading(true);
    try {
      if (group.memberIds.length > 1) {
        // Leave group: remove user from group and group from user
        await updateDoc(doc(db, "groups", groupId), {
          memberIds: arrayRemove(user.uid),
        });
        await updateDoc(doc(db, "users", user.uid), {
          groupIds: arrayRemove(groupId),
        });
        navigate("/dashboard");
      } else {
        // Only one member: delete group and remove from user
        await deleteDoc(doc(db, "groups", groupId));
        await updateDoc(doc(db, "users", user.uid), {
          groupIds: arrayRemove(groupId),
        });
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Failed to leave/delete group.");
    }
    setActionLoading(false);
  };

  if (loading) return <div style={{padding: 24}}>Loading group...</div>;
  if (error) return <div style={{padding: 24, color: '#e53e3e'}}>{error}</div>;
  if (!group) return null;

  return (
    <div>
      <div className="group-dashboard-header">
        {/* Future: Back button here */}
        <h2>{group.name}</h2>
        {group.inviteCode && (
          <div>
            Code: <span>{group.inviteCode}</span>
          </div>
        )}
      </div>
      <div className="group-dashboard-main">
        {/* Main Column */}
        <div>
          {/* Expenses Section Placeholder */}
          <div className="group-dashboard-card">
            <div>
              Expenses <button>+ Add</button>
            </div>
            <div>No expenses yet.</div>
          </div>
          {/* Balance Summary Placeholder */}
          <div className="group-dashboard-card">
            <div>Balance Summary</div>
            <div>No balances yet.</div>
          </div>
        </div>
        {/* Sidebar */}
        <div>
          <div className="group-dashboard-card">
            <div>Members</div>
            <ul className="group-dashboard-members-list">
              {members.map(m => (
                <li key={m.id}>
                  <span>{m.username ? m.username : (m.name || m.email || m.id)}</span>
                  {m.id === group.ownerId && <span>(owner)</span>}
                </li>
              ))}
            </ul>
          </div>
          <button
            className="group-dashboard-leave"
            onClick={handleLeaveOrDelete}
            disabled={actionLoading}
            style={{
              opacity: actionLoading ? 0.7 : 1,
            }}
          >
            {group.memberIds.length > 1 ? (actionLoading ? 'Leaving...' : 'Leave Group') : (actionLoading ? 'Deleting...' : 'Delete Group')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDashboardPage;
