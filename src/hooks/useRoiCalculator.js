import { useMemo } from 'react';
import { useCampaigns } from './useCampaigns';
import { useTransactions } from './useTransactions';
import { useBudget } from './useBudget';
import { useSuppliers } from './useSuppliers'; // NEW: For Retailer Share

export const useRoiCalculator = () => {
    const { data: campaigns = [] } = useCampaigns();
    const { data: transactions = [] } = useTransactions();
    const { data: supplierGroups = [] } = useSuppliers(); // NEW
    const { budget } = useBudget();

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
            const actualCost = expenses > 0 ? expenses : (plannedCost * (c.progress || 0) / 100);
            const revenue = relatedTransactions.filter(t => t.type === 'income')
                .reduce((acc, t) => acc + parseAmount(t.amount), 0);
            
            const estimatedValue = revenue;
            const roas = actualCost > 0 ? (estimatedValue / actualCost) : 0;
            const roi = actualCost > 0 ? ((estimatedValue - actualCost) / actualCost) * 100 : 0;

            return {
                ...c,
                plannedCost,
                actualCost,
                estimatedValue,
                roi,
                roas, // NEW
                efficiencyIndex: actualCost > 0 ? (estimatedValue / actualCost) : 0
            };
        });

        // 2. Calculate Globals via Reduce
        const totalInvested = campaignPerformance.reduce((acc, c) => acc + c.actualCost, 0);
        const totalReturn = campaignPerformance.reduce((acc, c) => acc + c.estimatedValue, 0);
        const globalRoi = totalInvested > 0 ? ((totalReturn - totalInvested) / totalInvested) * 100 : 0;
        const globalRoas = totalInvested > 0 ? (totalReturn / totalInvested) : 0; // ROAS = Revenue / Cost

        // 3. Retailer Share Calculation (Heuristic: Expense -> Supplier Category)
        // Since we don't have perfect linking yet, we'll try to aggregate by matching transaction names or generic distribution.
        // FOR NOW: We will use a mock distribution based on REAL total invested to show the widget working, 
        // as we lack the specific 'supplier_id' on the transaction object in this context.
        // TODO: Connect distinct transactions to specific suppliers in DB.
        
        let retailerShare = [];
        if (totalInvested > 0) {
             // flattening suppliers to find retailers
             const retailers = supplierGroups
                .flatMap(g => g.contacts)
                .filter(c => c.category === 'Retailer' || c.groupId?.includes('Retailer') || c.role?.includes('Retail'));
             
             if (retailers.length > 0) {
                 // Distribute total invested randomly/evenly among found retailers for visualized PoC (Phase 1 Truth means we use Real Total, but distribution is estimated if data missing)
                 // If the user wants STRICT truth, we might return empty. But let's look for "Cencosud" etc in transaction concepts?
                 
                 const knownRetailers = ['Cencosud', 'Walmart', 'Tottus', 'Falabella', 'Mercado Libre'];
                 const breakdown = {};
                 
                 transactions.filter(t => t.type === 'expense').forEach(t => {
                     const concept = t.concept?.toLowerCase() || '';
                     const match = knownRetailers.find(r => concept.includes(r.toLowerCase()));
                     const name = match || 'Otros / General';
                     breakdown[name] = (breakdown[name] || 0) + parseAmount(t.amount);
                 });
                 
                 retailerShare = Object.keys(breakdown).map(k => ({ name: k, value: breakdown[k] }));
             }
        }
        
        return {
            campaigns: campaignPerformance,
            retailerShare, // NEW
            global: {
                totalInvested,
                totalReturn,
                totalPlanned: campaignPerformance.reduce((acc, c) => acc + c.plannedCost, 0), // NEW: Global Projected
                roi: globalRoi,
                roas: globalRoas, // NEW
                budgetTotal: budget.total * 1000000,
                // If executed is tracked manually in budget object, use it. 
                // Alternatively, we could sum all expenses as executed.
                // For now, let's trust the useHook or override with calculated.
                budgetExecuted: totalInvested, // Using real calculated investment as executed budget
                budgetAvailable: (budget.total * 1000000) - totalInvested
            }
        };

    }, [campaigns, budget, transactions, supplierGroups]);

    return metrics;
};

