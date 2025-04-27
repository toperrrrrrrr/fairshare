import React from 'react';

const ExpenseFormFields = ({ form, errors, touched, members, handleChange, firstInputRef }) => (
  <div style={{display:'flex',gap:'1.1rem',flexWrap:'wrap'}}>
    <div style={{flex:'1 1 180px',minWidth:0}}>
      <label className="gdash-expense-label">
        Paid by
        <select
          className="gdash-expense-input"
          name="paidBy"
          required
          value={form.paidBy}
          onChange={handleChange}
          aria-invalid={!!errors.paidBy}
          aria-describedby="paidby-error"
        >
          <option value="">Select member</option>
          {members.map(m => (
            <option key={m.id} value={m.username || m.email}>
              {(m.username || m.email)?.replace(/^@+/, '')}
            </option>
          ))}
        </select>
        {touched.paidBy && errors.paidBy && <span className="gdash-field-error" id="paidby-error">{errors.paidBy}</span>}
      </label>
    </div>
    <div style={{flex:'1 1 90px',minWidth:0}}>
      <label className="gdash-expense-label">
        Amount
        <input
          className="gdash-expense-input"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={form.amount}
          onChange={handleChange}
          aria-invalid={!!errors.amount}
          aria-describedby="amount-error"
          required
        />
        {touched.amount && errors.amount && <span className="gdash-field-error" id="amount-error">{errors.amount}</span>}
      </label>
    </div>
    <div style={{flex:'2 1 170px',minWidth:0}}>
      <label className="gdash-expense-label">
        Description
        <input
          ref={firstInputRef}
          className="gdash-expense-input"
          name="desc"
          placeholder="e.g. Dinner at Luigi's"
          value={form.desc}
          onChange={handleChange}
          aria-invalid={!!errors.desc}
          aria-describedby="desc-error"
          autoFocus
          maxLength={80}
          required
        />
        {touched.desc && errors.desc && <span className="gdash-field-error" id="desc-error">{errors.desc}</span>}
      </label>
    </div>
  </div>
);

export default ExpenseFormFields;
