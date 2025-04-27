/**
 * Calculate minimal balances between users based on all transactions (expenses + settlements).
 * Each expense is split equally among participants. Settlements reduce balances.
 *
 * @param {Array} transactions - Array of transaction objects. Each should have:
 *   { amount: number, paidBy: string, participants: string[], type: 'expense' | 'settlement', from, to }
 * @returns {Array} Array of balances: { from: string, to: string, amount: number }
 */
export function calculateBalances(transactions) {
  const netBalances = {};

  // Step 1: Compute net balances for each user
  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      const { amount, paidBy, participants } = tx;
      if (!participants || participants.length === 0) return;
      const split = amount / participants.length;
      participants.forEach(user => {
        if (!netBalances[user]) netBalances[user] = 0;
        netBalances[user] -= split;
      });
      if (!netBalances[paidBy]) netBalances[paidBy] = 0;
      netBalances[paidBy] += amount;
    } else if (tx.type === 'settlement') {
      // Settlement: from pays to
      const { from, to, amount } = tx;
      if (!from || !to || !amount) return;
      if (!netBalances[from]) netBalances[from] = 0;
      if (!netBalances[to]) netBalances[to] = 0;
      netBalances[from] += amount;
      netBalances[to] -= amount;
    }
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
// const transactions = [
//   { type: 'expense', amount: 60, paidBy: 'alice', participants: ['alice','bob','carol'] },
//   { type: 'settlement', from: 'bob', to: 'alice', amount: 20 }
// ];
// const balances = calculateBalances(transactions);
// console.log(balances);
