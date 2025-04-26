import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import '../components/GroupDashboardUI.css';
import { FiArrowLeft, FiSettings, FiUsers } from 'react-icons/fi';
import InviteFriendModal from '../components/InviteFriendModal';
import GroupSettingsSidebar from '../components/GroupSettingsSidebar';
import AddExpenseModal from '../components/AddExpenseModal';
import DeleteExpenseModal from '../components/DeleteExpenseModal';

const GroupDashboardPage = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
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
            const membersList = batchResults.flatMap((res) =>
              res.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
            );
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

  useEffect(() => {
    if (!groupId) return;
    const fetchExpenses = async () => {
      const expensesRef = collection(db, 'groups', groupId, 'expenses');
      const q = query(expensesRef);
      const snap = await getDocs(q);
      const expenseList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expenseList);
    };
    fetchExpenses();
  }, [groupId, showExpenseForm]); // refetch when modal closes

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

  // Add this handler for renaming group
  const handleRenameGroup = async (newName) => {
    if (!groupId) return;
    try {
      await updateDoc(doc(db, "groups", groupId), { name: newName });
      setGroup((g) => ({ ...g, name: newName }));
    } catch (err) {
      throw new Error("Failed to rename group.");
    }
  };

  const handleOpenExpenseModal = () => setShowExpenseForm(true);
  const handleCloseExpenseModal = () => setShowExpenseForm(false);
  const handleExpenseSubmit = async (expenseData) => {
    // Save expense to Firestore
    const expensesRef = collection(db, 'groups', groupId, 'expenses');
    await addDoc(expensesRef, {
      ...expenseData,
      amount: Number(expenseData.amount),
      createdAt: new Date().toISOString(),
    });
    handleCloseExpenseModal();
  };

  const handleEditExpense = (exp) => {
    console.log("Edit expense:", exp);
  };

  const handleDeleteExpense = (exp) => {
    setExpenseToDelete(exp);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteDoc(doc(db, 'groups', groupId, 'expenses', expenseToDelete.id));
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      // Refetch expenses from Firestore for consistency
      const expensesRef = collection(db, 'groups', groupId, 'expenses');
      const q = query(expensesRef);
      const snap = await getDocs(q);
      const expenseList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expenseList);
    } catch (err) {
      alert('Failed to delete expense.');
    }
  };

  // Add blurred background when modal is open
  useEffect(() => {
    const root = document.getElementById('gdash-root') || document.querySelector('.gdash-root');
    if (!root) return;
    const modal = document.querySelector('.modal-add-expense-overlay');
    if (showExpenseForm) {
      // Only blur the direct dashboard content, not the modal
      root.classList.add('gdash-blur-bg');
      if (modal) modal.style.zIndex = 2100;
    } else {
      root.classList.remove('gdash-blur-bg');
      if (modal) modal.style.zIndex = 2000;
    }
    return () => {
      root.classList.remove('gdash-blur-bg');
      if (modal) modal.style.zIndex = 2000;
    };
  }, [showExpenseForm]);

  if (loading) return <div style={{ padding: 24 }}>Loading group...</div>;
  if (error)
    return <div style={{ padding: 24, color: "#e53e3e" }}>{error}</div>;
  if (!group) return null;

  return (
    <div className="gdash-root">
      {/* Header Section */}
      <header className="gdash-header gdash-header-has-settings">
        <button className="gdash-back" onClick={() => navigate('/dashboard')} title="Back to Groups">
          <FiArrowLeft />
        </button>
        <div className="gdash-header-content">
          <span className="gdash-title">{group.name}</span>
          <span className="gdash-member-count">
            <FiUsers style={{ marginRight: 3, verticalAlign: 'middle' }} />
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="gdash-settings gdash-settings-absolute" title="Group Settings" onClick={() => setShowSidebar(true)}>
          <FiSettings />
        </button>
      </header>
      {/* Main Grid Layout */}
      <main className="gdash-main">
        {/* LEFT: Group Info, Members, Actions */}
        <aside className="gdash-sidebar">
          {/* ...sidebar content removed, now in drawer... */}
        </aside>
        {/* RIGHT: Expenses, Balance, Add Expense */}
        <section className="gdash-maincol">
          {/* Add New Expense Button */}
          <div className="gdash-section gdash-add-expense">
            <button className="gdash-add-expense-btn" onClick={handleOpenExpenseModal}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Expense
              </span>
            </button>
          </div>
          <AddExpenseModal open={showExpenseForm} onClose={handleCloseExpenseModal} members={members} onSubmit={handleExpenseSubmit} />
          {/* Expense List Section */}
          <div className="gdash-section gdash-expenses">
            <div className="gdash-section-title">Expenses</div>
            <div className="gdash-expense-list">
              {expenses.length === 0 ? (
                <div style={{color:'#888',padding:'1.2rem 0'}}>No expenses yet.</div>
              ) : (
                expenses.map(exp => (
                  <div key={exp.id} className="gdash-expense-card">
                    <div className="gdash-expense-desc">{exp.desc}</div>
                    <div className="gdash-expense-meta">
                      <span>₱{exp.amount}</span>
                      <span>Paid by {exp.paidBy}</span>
                      <span style={{fontSize:'0.97em',color:'#888'}}>{exp.date ? new Date(exp.date).toLocaleDateString() : (exp.createdAt ? new Date(exp.createdAt).toLocaleString() : '')}</span>
                      <button className="gdash-expense-edit-btn" title="Edit expense" style={{background:'none',border:'none',marginLeft:8,cursor:'pointer',color:'#4e54c8'}} onClick={()=>handleEditExpense(exp)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                      </button>
                      <button className="gdash-expense-delete-btn" title="Delete expense" style={{background:'none',border:'none',marginLeft:4,cursor:'pointer',color:'#e53e3e'}} onClick={()=>handleDeleteExpense(exp)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                    {exp.notes && (
                      <div className="gdash-expense-notes" style={{marginTop:4, fontSize:'0.98em', color:'#555', background:'#f4f5fb', borderRadius:6, padding:'6px 10px'}}>
                        <b>Notes:</b> {exp.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Balance Summary Card */}
          <div className="gdash-section gdash-balance-summary">
            <div className="gdash-section-title">Balance Summary</div>
            {/* TODO: Map balances here. For now, show empty state. */}
            <div className="gdash-empty-state">
              No balances yet.
            </div>
          </div>
        </section>
      </main>
      <GroupSettingsSidebar
        open={showSidebar}
        onClose={() => setShowSidebar(false)}
        members={members}
        group={group}
        user={user}
        onInvite={() => setShowInviteModal(true)}
        onLeaveGroup={handleLeaveOrDelete}
        actionLoading={actionLoading}
        onRenameGroup={handleRenameGroup}
      />
      {showInviteModal && (
        <InviteFriendModal groupId={group.id} onClose={() => setShowInviteModal(false)} />
      )}
      <DeleteExpenseModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setExpenseToDelete(null); }}
        onConfirm={handleConfirmDeleteExpense}
        expense={expenseToDelete}
      />
    </div>
  );
};

export default GroupDashboardPage;
