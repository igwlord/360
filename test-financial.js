
import { calculateBudget, calculateExecuted, calculateAvailable } from './src/utils/financialUtils.js';
import assert from 'assert';

console.log('Running Financial Utils Tests...');

// Mock Data
const transactions = [
    { id: 1, type: 'initial', amount: 1000 },
    { id: 2, type: 'expense', amount: 200 },
    { id: 3, type: 'income', amount: 500 },
    { id: 4, type: 'expense', amount: 100 }
];

// Test 1: Calculate Budget
try {
    const budget = calculateBudget(transactions);
    assert.strictEqual(budget, 1500, 'Budget should be 1000 + 500 = 1500');
    console.log('✅ calculateBudget passed');
} catch (e) {
    console.error('❌ calculateBudget failed', e);
    process.exit(1);
}

// Test 2: Calculate Executed
try {
    const executed = calculateExecuted(transactions);
    assert.strictEqual(executed, 300, 'Executed should be 200 + 100 = 300');
    console.log('✅ calculateExecuted passed');
} catch (e) {
    console.error('❌ calculateExecuted failed', e);
    process.exit(1);
}

// Test 3: Calculate Available
try {
    const available = calculateAvailable(transactions);
    assert.strictEqual(available, 1200, 'Available should be 1500 - 300 = 1200');
    console.log('✅ calculateAvailable passed');
} catch (e) {
    console.error('❌ calculateAvailable failed', e);
    process.exit(1);
}

// Test 4: Empty Array
try {
    assert.strictEqual(calculateBudget([]), 0, 'Empty budget should be 0');
    assert.strictEqual(calculateExecuted([]), 0, 'Empty executed should be 0');
    console.log('✅ Empty array handling passed');
} catch (e) {
    console.error('❌ Empty array handling failed', e);
    process.exit(1);
}

console.log('🎉 All Financial Tests Passed!');
