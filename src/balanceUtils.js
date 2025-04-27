/**
 * Calculate minimal balances between users based on all expenses.
 * Each expense is split equally among participants.
 *
 * @param {Array} expenses - Array of expense objects. Each should have:
 *   { amount: number, paidBy: string, participants: string[] }
 * @returns {Array} Array of balances: { from: string, to: string, amount: number }
 *
 * Example expense:
 *   { amount: 60, paidBy: 'alice', participants: ['alice','bob','carol'] }
 *
 * Example output:
 *   [ { from: 'bob', to: 'alice', amount: 20 }, { from: 'carol', to: 'alice', amount: 20 } ]
 */
export function calculateBalances(expenses) {
  const netBalances = {};

  // Step 1: Compute net balances for each user
  expenses.forEach(exp => {
    const { amount, paidBy, participants } = exp;
    if (!participants || participants.length === 0) return;
    const split = amount / participants.length;

    participants.forEach(user => {
      if (!netBalances[user]) netBalances[user] = 0;
      netBalances[user] -= split;
    });
    if (!netBalances[paidBy]) netBalances[paidBy] = 0;
    netBalances[paidBy] += amount;
  });

  // Step 2: Settle debts (greedy, minimal transactions)
  const debtors = [];
  const creditors = [];
  Object.entries(netBalances).forEach(([user, balance]) => {
    if (Math.abs(balance) < 0.01) return; // Ignore near-zero
    if (balance < 0) debtors.push({ user, amount: -balance });
    else creditors.push({ user, amount: balance });
  });

  const result = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const settled = Math.min(d.amount, c.amount);
    result.push({ from: d.user, to: c.user, amount: Math.round(settled * 100) / 100 });
    d.amount -= settled;
    c.amount -= settled;
    if (d.amount < 0.01) i++;
    if (c.amount < 0.01) j++;
  }

  return result;
}

// Example usage:
// const expenses = [
//   { amount: 60, paidBy: 'alice', participants: ['alice','bob','carol'] },
//   { amount: 30, paidBy: 'bob', participants: ['alice','bob'] }
// ];
// const balances = calculateBalances(expenses);
// console.log(balances);
