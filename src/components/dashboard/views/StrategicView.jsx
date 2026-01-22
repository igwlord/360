
import React from 'react';
import FinancialPulse from '../widgets/FinancialPulse';
import RetailerShareWidget from '../RetailerShareWidget';
import BurnRateWidget from '../widgets/BurnRateWidget';
import ObjectivesWidget from '../ObjectivesWidget';

const StrategicView = ({ metrics, isRoiExpanded, setIsRoiExpanded, dashboardConfig }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
             {/* ZONE 1: FINANCIAL HEALTH (The "Big Picture") */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <FinancialPulse 
                        metrics={metrics} 
                        isExpanded={isRoiExpanded} 
                        setIsExpanded={setIsRoiExpanded} 
                    />
                </div>
                
                {/* Market Share / Intelligence */}
                <div className="flex flex-col gap-4">
                        <RetailerShareWidget data={metrics.retailerShare} />
                        <BurnRateWidget value={12400} />
                </div>
            </div>

            {/* Objectives Section */}
            {dashboardConfig.showObjectives && (
                 <div className="grid grid-cols-1">
                    <ObjectivesWidget />
                 </div>
            )}
        </div>
    );
};

export default StrategicView;
