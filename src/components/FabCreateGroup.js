import React from 'react';
import { FiPlus } from 'react-icons/fi';
import './FabCreateGroup.css';

const FabCreateGroup = ({ onClick }) => (
  <button className="fab-create-group" onClick={onClick} aria-label="Create Group">
    <FiPlus size={28} />
  </button>
);

export default FabCreateGroup;
