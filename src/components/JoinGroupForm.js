import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, doc, getDocs, query, updateDoc, arrayUnion, where } from "firebase/firestore";
import { useAuth } from '../hooks/useAuth';
import './JoinGroupForm.css';

const JoinGroupForm = ({ onJoined, onClose }) => {
  const [groupCode, setGroupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Search for group by inviteCode
      const groupsRef = collection(db, "groups");
      const q = query(groupsRef, where("inviteCode", "==", groupCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setError("Group not found. Please check the code.");
        setLoading(false);
        return;
      }
      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data();
      if (groupData.memberIds.includes(user.uid)) {
        setError("You are already a member of this group.");
        setLoading(false);
        return;
      }
      // Add user to group and group to user
      await updateDoc(groupDoc.ref, {
        memberIds: arrayUnion(user.uid),
      });
      await updateDoc(doc(db, "users", user.uid), {
        groupIds: arrayUnion(groupDoc.id),
      });
      setLoading(false);
      if (onJoined) onJoined();
      if (onClose) onClose();
    } catch (err) {
      setError("Failed to join group. Try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleJoin} className="form-container">
      <div className="form-title">Join a Group</div>
      <input
        type="text"
        className="form-input"
        placeholder="Enter group code"
        value={groupCode}
        onChange={(e) => setGroupCode(e.target.value)}
        disabled={loading}
        required
      />
      <button
        className="form-btn"
        type="submit"
        disabled={loading || !groupCode.trim()}
      >
        {loading ? "Joining..." : "Join Group"}
      </button>
      {error && <div className="form-error">{error}</div>}
    </form>
  );
};

export default JoinGroupForm;
