import { useMemo } from 'react';
import { useData } from '../context/DataContext';

export const useRoiCalculator = () => {
    const { campaigns, budget, transactions } = useData();

    // Helper to parse currency strings "$ 1.000" -> 1000
    const parseAmount = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(val.toString().replace(/[^0-9.-]+/g, '')) || 0;
    };

    const metrics = useMemo(() => {
        // 1. Calculate Per-Campaign Metrics
        const campaignPerformance = campaigns.map(c => {
            // Filter transactions for this campaign
            // Match by ID (Best) or Name (Legacy Fallback)
            const relatedTransactions = transactions?.filter(t => 
                (t.project_id && String(t.project_id) === String(c.id)) || 
                (t.concept && t.concept.includes(c.name))
            ) || [];

            const expenses = relatedTransactions.filter(t => t.type === 'expense')
                .reduce((acc, t) => acc + parseAmount(t.amount), 0);
            
            const plannedCost = parseAmount(c.cost);
            // Actual Cost is sum of expenses, or fallback to manual 'cost' field if no expenses tracked yet
            const actualCost = expenses > 0 ? expenses : (plannedCost * (c.progress || 0) / 100);

            // Revenue comes ONLY from Income transactions.
            const revenue = relatedTransactions.filter(t => t.type === 'income')
                .reduce((acc, t) => acc + parseAmount(t.amount), 0);
            
            const estimatedValue = revenue;
            const roi = actualCost > 0 ? ((estimatedValue - actualCost) / actualCost) * 100 : 0;

            return {
                ...c,
                plannedCost,
                actualCost,
                estimatedValue,
                roi,
                efficiencyIndex: actualCost > 0 ? (estimatedValue / actualCost) : 0
            };
        });

        // 2. Calculate Globals via Reduce
        const totalInvested = campaignPerformance.reduce((acc, c) => acc + c.actualCost, 0);
        const totalReturn = campaignPerformance.reduce((acc, c) => acc + c.estimatedValue, 0);
        const globalRoi = totalInvested > 0 ? ((totalReturn - totalInvested) / totalInvested) * 100 : 0;

        return {
            campaigns: campaignPerformance,
            global: {
                totalInvested,
                totalReturn,
                roi: globalRoi,
                budgetTotal: budget.total * 1000000,
                budgetExecuted: budget.executed * 1000000,
                budgetAvailable: (budget.total - budget.executed) * 1000000
            }
        };

    }, [campaigns, budget, transactions]);

    return metrics;
};
