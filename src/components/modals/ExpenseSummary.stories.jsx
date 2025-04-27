import React from 'react';
import ExpenseSummary from './ExpenseSummary';

export default {
  title: 'Modals/ExpenseSummary',
  component: ExpenseSummary,
};

const members = [
  { id: '1', username: 'alice', email: 'alice@email.com' },
  { id: '2', username: 'bob', email: 'bob@email.com' },
];
const paidByMember = members[0];

export const Default = () => (
  <ExpenseSummary
    form={{ desc: 'Dinner', amount: '100', paidBy: 'alice', splitOption: 'split-equally', date: '2025-04-27', notes: 'Test note' }}
    paidByMember={paidByMember}
    members={members}
  />
);
