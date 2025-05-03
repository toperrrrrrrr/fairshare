import React from 'react';
import { FiPlus, FiUsers } from 'react-icons/fi';
import './FabStack.css';

const FabStack = ({ onCreateGroup, onJoinGroup }) => (
  <div className="fab-stack">
    <button className="fab-btn fab-create" onClick={onCreateGroup} aria-label="Create Group">
      <FiPlus size={28} />
      <span className="fab-label">Create</span>
    </button>
    <button className="fab-btn fab-join" onClick={onJoinGroup} aria-label="Join Group">
      <FiUsers size={26} />
      <span className="fab-label">Join</span>
    </button>
  </div>
);

export default FabStack;
