import { Transaction } from '../types/database.types';

/**
 * Calculates the total budget from a list of transactions.
 * Income/Initial types add to budget.
 */
export const calculateBudget = (transactions: Transaction[] = []): number => {
    return transactions.reduce((acc, t) => {
        if (t.type === 'initial' || t.type === 'income') {
            return acc + (Number(t.amount) || 0);
        }
        return acc;
    }, 0);
};

/**
 * Calculates the total executed (spent) amount.
 */
export const calculateExecuted = (transactions: Transaction[] = []): number => {
    return transactions.reduce((acc, t) => {
        if (t.type === 'expense') {
            return acc + (Number(t.amount) || 0);
        }
        return acc;
    }, 0);
};

/**
 * Calculates available balance.
 */
export const calculateAvailable = (transactions: Transaction[] = []): number => {
    const budget = calculateBudget(transactions);
    const executed = calculateExecuted(transactions);
    return budget - executed;
};
