import React from 'react';
import ExpenseFormFields from './ExpenseFormFields';

export default {
  title: 'Modals/ExpenseFormFields',
  component: ExpenseFormFields,
};

const members = [
  { id: '1', username: 'alice' },
  { id: '2', username: 'bob' },
];

const baseProps = {
  form: { desc: '', amount: '', paidBy: 'alice' },
  errors: {},
  touched: {},
  members,
  handleChange: () => {},
  firstInputRef: null,
};

export const Default = () => <ExpenseFormFields {...baseProps} />;
export const WithErrors = () => <ExpenseFormFields {...baseProps} errors={{desc:'Required',amount:'Invalid',paidBy:'Select'}} touched={{desc:true,amount:true,paidBy:true}} />;
