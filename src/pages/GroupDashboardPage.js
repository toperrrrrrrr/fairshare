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
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from "react-router-dom";
import './GroupDashboardPage.css';
import '../components/group/GroupDashboardUI.css';
import { FiArrowLeft, FiSettings, FiUsers } from 'react-icons/fi';
import InviteFriendModal from '../components/modals/InviteFriendModal';
import GroupSettingsSidebar from '../components/group/GroupSettingsSidebar';
import AddExpenseModal from '../components/modals/AddExpenseModal';
import DeleteExpenseModal from '../components/modals/DeleteExpenseModal';
import ExpenseCard from '../components/ExpenseCard';
import BalanceSummary from '../components/BalanceSummary';
import { useSwipeable } from 'react-swipeable';
import { calculateBalances } from '../balanceUtils';

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
  const [transactions, setTransactions] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [swipedExpenseId, setSwipedExpenseId] = React.useState(null);
  const [balances, setBalances] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
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

  // --- Move fetchTransactions to top-level so it can be passed as a prop ---
  const fetchTransactions = async () => {
    if (!groupId) return;
    const transactionsRef = collection(db, 'groups', groupId, 'transactions');
    const q = query(transactionsRef);
    const snap = await getDocs(q);
    let transactionList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort: newest first (by createdAt or date)
    transactionList.sort((a, b) => {
      const aTime = (a.date && typeof a.date === 'object' && a.date.seconds) ? a.date.seconds : (a.createdAt && typeof a.createdAt === 'object' && a.createdAt.seconds ? a.createdAt.seconds : new Date(a.date || a.createdAt || 0).getTime()/1000);
      const bTime = (b.date && typeof b.date === 'object' && b.date.seconds) ? b.date.seconds : (b.createdAt && typeof b.createdAt === 'object' && b.createdAt.seconds ? b.createdAt.seconds : new Date(b.date || b.createdAt || 0).getTime()/1000);
      return bTime - aTime;
    });
    setTransactions(transactionList);
  };

  useEffect(() => {
    fetchTransactions();
  }, [groupId, showExpenseForm]);

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setBalances([]);
      setBalancesLoading(false);
      return;
    }
    setBalancesLoading(true);
    const calculated = calculateBalances(transactions);
    setBalances(calculated);
    setBalancesLoading(false);
  }, [transactions]);

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
    // Compute participants: all group members for now (MVP: split equally)
    const participants = members.map(m => m.username || m.email);
    // Save expense to Firestore with required fields
    const transactionsRef = collection(db, 'groups', groupId, 'transactions');
    await addDoc(transactionsRef, {
      desc: expenseData.desc,
      amount: Number(expenseData.amount),
      paidBy: expenseData.paidBy,
      participants,
      splitOption: expenseData.splitOption,
      date: expenseData.date,
      notes: expenseData.notes,
      createdAt: new Date().toISOString(),
      type: 'expense',
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

  const handleConfirmDeleteTransaction = async () => {
    if (!expenseToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'groups', groupId, 'transactions', expenseToDelete.id));
      setDeleteModalOpen(false);
      setExpenseToDelete(null);
      // Refetch transactions from Firestore for consistency
      const transactionsRef = collection(db, 'groups', groupId, 'transactions');
      const q = query(transactionsRef);
      const snap = await getDocs(q);
      let transactionList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort: newest first (by createdAt or date)
      transactionList.sort((a, b) => {
        const aTime = (a.date && typeof a.date === 'object' && a.date.seconds) ? a.date.seconds : (a.createdAt && typeof a.createdAt === 'object' && a.createdAt.seconds ? a.createdAt.seconds : new Date(a.date || a.createdAt || 0).getTime()/1000);
        const bTime = (b.date && typeof b.date === 'object' && b.date.seconds) ? b.date.seconds : (b.createdAt && typeof b.createdAt === 'object' && b.createdAt.seconds ? b.createdAt.seconds : new Date(b.date || b.createdAt || 0).getTime()/1000);
        return bTime - aTime;
      });
      setTransactions(transactionList);
    } catch (err) {
      alert('Failed to delete transaction.');
    } finally {
      setDeleteLoading(false);
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

  // Helper: get user id or email for current user
  const getCurrentUserKey = () => {
    if (!user) return '';
    // Try to match against member username/email/id, fallback to lowercased email
    const memberMatch = members.find(m =>
      m.id === user.uid ||
      m.email === user.email ||
      (m.username && m.username === user.displayName)
    );
    if (memberMatch) {
      return memberMatch.username || memberMatch.email || memberMatch.id;
    }
    // Fallback: use lowercased email or uid
    return (user.email || user.uid).toLowerCase();
  };

  // Helper: get display name for a user key
  const getDisplayName = (key) => {
    const curKey = getCurrentUserKey();
    if (key && curKey && key.toLowerCase() === curKey.toLowerCase()) return 'You';
    const member = members.find(m => (m.username || m.email || m.id).toLowerCase() === (key || '').toLowerCase());
    return member ? (member.username || member.email || member.id) : key;
  };

  // Helper: get user label (for settlements, which use 'from' and 'to' fields)
  function getTransactionPaidBy(exp) {
    if (exp.type === 'settlement') {
      // Settlement: show 'Paid by {from} to {to}'
      return `Paid by ${getDisplayName(exp.from)} to ${getDisplayName(exp.to)}`;
    } else {
      // Expense: show 'Paid by {paidBy}'
      return `Paid by ${getDisplayName(exp.paidBy)}`;
    }
  }

  // Helper: get transaction date (handle Firestore timestamps)
  function getTransactionDate(exp) {
    const dateVal = exp.date || exp.createdAt;
    if (!dateVal) return '';
    if (typeof dateVal === 'object' && dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    const parsed = new Date(dateVal);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

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
                Add Transaction
              </span>
            </button>
          </div>
          <AddExpenseModal open={showExpenseForm} onClose={handleCloseExpenseModal} members={members} onSubmit={handleExpenseSubmit} />
          {/* Transaction List Section */}
          <div className="gdash-section gdash-expenses">
            <div className="gdash-section-title">Transactions</div>
            <div className="gdash-expense-list">
              {transactions.length === 0 ? (
                <div style={{color:'#888',padding:'1.2rem 0'}}>No transactions yet.</div>
              ) : (
                transactions.map(tx => (
                  <ExpenseCard
                    key={tx.id}
                    exp={{ ...tx, paidByLabel: getTransactionPaidBy(tx), dateLabel: getTransactionDate(tx) }}
                    isSwiped={swipedExpenseId === tx.id}
                    setSwipedExpenseId={setSwipedExpenseId}
                    handleEditExpense={handleEditExpense}
                    handleDeleteExpense={handleDeleteExpense}
                  />
                ))
              )}
            </div>
          </div>
          {/* Balance Summary Card */}
          <div className="gdash-section gdash-balance-summary">
            <div className="gdash-section-title">Balance Summary</div>
            <BalanceSummary balances={balances} currentUser={getCurrentUserKey()} getDisplayName={getDisplayName} groupId={groupId} refreshTransactions={fetchTransactions} />
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
        onClose={() => { if (!deleteLoading) { setDeleteModalOpen(false); setExpenseToDelete(null); } }}
        onConfirm={handleConfirmDeleteTransaction}
        expense={expenseToDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default GroupDashboardPage;
