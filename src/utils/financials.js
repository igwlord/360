export const calculateFinancials = (project, allProjects = []) => {
    const transactions = project.transactions || [];

    // 1. Base Metrics (Own Data)
    const initialBudget = transactions.filter(t => t.type === 'initial' || t.type === 'adjustment').reduce((acc, t) => acc + (t.amount || 0), 0);
    const ownRevenue = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
    const ownCost = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);

    // 2. Child Aggregation (Recursive? or 1-level for now)
    // We only go 1 level deep for now as per Phase 2 requirements (Parent Campaign -> Event/Exhibition)
    const children = allProjects.filter(p => p.parent_id === project.id);
    
    // Sum children's EXECUTION (Cost)
    // A child's budget typically comes from the parent, so their 'cost' decreases parent's 'available'
    const childrenCost = children.reduce((acc, child) => {
        const childTrans = child.transactions || [];
        const childExpense = childTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
        return acc + childExpense;
    }, 0);

    // 3. Consolidated Metrics
    const totalCost = ownCost + childrenCost;
    
    // "Total Budget" logic:
    // User current logic: Initial + Income = Total Project Power
    // Refined logic: Initial Budget is the limit. Revenue is result.
    // For "Available" calculation:
    // Available = (Initial Budget + Revenue [Reinvested]) - Total Cost
    const totalBudgetPool = initialBudget + ownRevenue;
    const available = totalBudgetPool - totalCost;

    // 4. ROAS (Return on Ad Spend)
    // Revenue / Cost
    // If Cost is 0, ROAS is 0 (or infinite, but 0 safest for UI)
    const roas = totalCost > 0 ? (ownRevenue / totalCost).toFixed(2) : 0;
    const roi = totalCost > 0 ? ((ownRevenue - totalCost) / totalCost * 100).toFixed(1) : 0;

    // 5. Progress
    // Execution Progress = Total Cost / Total Budget Pool
    const progress = totalBudgetPool > 0 ? Math.min((totalCost / totalBudgetPool) * 100, 100) : 0;

    return {
        initialBudget,
        revenue: ownRevenue,
        ownCost,
        childrenCost,
        totalCost,
        available,
        roas,
        roi,
        progress,
        hasChildren: children.length > 0
    };
};
