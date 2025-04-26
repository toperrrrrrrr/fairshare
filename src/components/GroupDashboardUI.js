import React, { useState } from "react";
import { FiUsers, FiLogOut, FiPlus, FiUser, FiDollarSign } from "react-icons/fi";
import "./GroupDashboardUI.css";

const mockMembers = [
  { id: 1, username: "@hehe", owner: false },
  { id: 2, usxername: "@toperrr", owner: true },
];
const mockExpenses = [
  { id: 1, desc: "Dinner", paidBy: "@hehe", amount: 40, date: "2025-04-24" },
  { id: 2, desc: "Groceries", paidBy: "@toperrr", amount: 30, date: "2025-04-22" },
];
const mockBalances = [
  { id: 1, text: "You owe @toperrr $20" },
  { id: 2, text: "@hehe owes you $10" },
];

export default function GroupDashboardUI() {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  return (
    <div className="gdash-root">
      <div className="gdash-header">
        <button className="gdash-back">←</button>
        <div className="gdash-header-main">
          <h2 className="gdash-title">yep</h2>
          <div className="gdash-member-count">2 members</div>
        </div>
        <div className="gdash-invite">Code: <span className="gdash-code">F7UZ9G4</span></div>
      </div>
      <div className="gdash-main">
        <div className="gdash-maincol">
          <div className="gdash-section gdash-expenses">
            <div className="gdash-section-title">
              Expenses
              <button className="gdash-add-expense" onClick={() => setShowExpenseForm(v => !v)}><FiPlus /></button>
            </div>
            {/* Expense Form */}
            {showExpenseForm && (
              <form className="gdash-expense-form">
                <input
                  className="gdash-expense-input"
                  type="text"
                  placeholder="Description"
                  name="desc"
                  required
                />
                <input
                  className="gdash-expense-input"
                  type="number"
                  placeholder="Amount"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  required
                />
                <select className="gdash-expense-input" name="paidBy" required>
                  <option value="">Paid by...</option>
                  {mockMembers.map(m => (
                    <option key={m.id} value={m.username}>{m.username.replace(/^@+/, "")}</option>
                  ))}
                </select>
                <select className="gdash-expense-input" name="splitBetween" multiple>
                  {mockMembers.map(m => (
                    <option key={m.id} value={m.username}>{m.username.replace(/^@+/, "")}</option>
                  ))}
                </select>
                <button className="gdash-expense-submit" type="submit">Add Expense</button>
              </form>
            )}
            {/* End Expense Form */}
            {mockExpenses.map(exp => (
              <div className="gdash-expense-card" key={exp.id}>
                <div className="gdash-expense-desc">{exp.desc}</div>
                <div className="gdash-expense-meta">
                  <span><FiUser /> {exp.paidBy}</span>
                  <span className="gdash-expense-amt"><FiDollarSign /> ${exp.amount}</span>
                  <span className="gdash-expense-date">{exp.date}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="gdash-section gdash-balance">
            <div className="gdash-section-title">Balance Summary</div>
            {mockBalances.map(bal => (
              <div className="gdash-balance-row" key={bal.id}>{bal.text}</div>
            ))}
          </div>
        </div>
        <div className="gdash-sidebar">
          <div className="gdash-section gdash-members">
            <div className="gdash-section-title">Members</div>
            <ul className="gdash-members-list">
              {mockMembers.map(m => (
                <li key={m.id} className="gdash-member-item">
                  <FiUsers className="gdash-member-ico" />
                  <span className="gdash-member-name">{m.username}</span>
                  {m.owner && <span className="gdash-owner">(owner)</span>}
                </li>
              ))}
            </ul>
          </div>
          <button className="gdash-leave"><FiLogOut /> Leave Group</button>
        </div>
      </div>
    </div>
  );
}
