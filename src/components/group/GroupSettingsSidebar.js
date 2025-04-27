import React, { useState } from "react";
import "./GroupDashboardUI.css";
import { FiX } from "react-icons/fi";

const GroupSettingsSidebar = ({ open, onClose, members, group, user, onInvite, onLeaveGroup, actionLoading, onRenameGroup }) => {
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState(group.name);
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState(null);

  const handleRename = async () => {
    setRenameLoading(true);
    setRenameError(null);
    try {
      await onRenameGroup(renameValue);
    } catch (error) {
      setRenameError(error.message);
    } finally {
      setRenameLoading(false);
    }
  };

  return (
    <>
      <div className={`gdash-sidebar-overlay${open ? " open" : ""}`} onClick={onClose} tabIndex={-1} aria-label="Close settings sidebar" />
      <aside className={`gdash-settings-sidebar${open ? " open" : ""}`} role="dialog" aria-modal="true">
        {/* Mobile header */}
        <div className="gdash-sidebar-header">
          <span className="gdash-sidebar-header-title">Group Settings</span>
          <button className="gdash-sidebar-close" onClick={onClose} title="Close settings" aria-label="Close settings">
            <FiX size={22} />
          </button>
        </div>
        {/* Members scrollable section */}
        <div className="gdash-sidebar-members">
          <div className="gdash-section-title">Group Members</div>
          <ul className="gdash-members-list">
            {members.map((m) => (
              <li key={m.id} className={`gdash-member-item${user && m.id === user.uid ? " gdash-me" : ""}`}> 
                <span className="gdash-member-avatar">
                  {m.username ? m.username[0]?.toUpperCase() : m.name ? m.name[0]?.toUpperCase() : m.email ? m.email[0]?.toUpperCase() : "?"}
                </span>
                <span className="gdash-member-name">{(m.username || m.name || m.email || m.id).replace(/^@+/, "")}</span>
                {m.id === group.ownerId && <span className="gdash-owner">owner</span>}
                {user && m.id === user.uid && <span className="gdash-you">you</span>}
              </li>
            ))}
          </ul>
        </div>
        {/* Fixed actions at bottom */}
        <div className="gdash-sidebar-actions">
          <button className="gdash-invite-btn" onClick={onInvite}>
            + Invite Member
          </button>
          {/* --- Rename Group Setting --- */}
          <button className="gdash-rename-btn" onClick={() => setShowRename(true)}>
            Rename Group
          </button>
          {showRename && (
            <div className="gdash-rename-group-modal">
              <input
                className="gdash-rename-input"
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                placeholder="New group name"
                maxLength={32}
                autoFocus
              />
              <button className="gdash-rename-save" onClick={handleRename} disabled={renameLoading || !renameValue.trim()}>
                {renameLoading ? "Saving..." : "Save"}
              </button>
              <button className="gdash-rename-cancel" onClick={() => setShowRename(false)} disabled={renameLoading}>
                Cancel
              </button>
              {renameError && <div className="gdash-rename-error">{renameError}</div>}
            </div>
          )}
          <button className="gdash-leave-btn" onClick={onLeaveGroup} disabled={actionLoading}>
            {group.memberIds.length > 1
              ? actionLoading
                ? "Leaving..."
                : "Leave Group"
              : actionLoading
              ? "Deleting..."
              : "Delete Group"}
          </button>
        </div>
      </aside>
    </>
  );
};

export default GroupSettingsSidebar;
