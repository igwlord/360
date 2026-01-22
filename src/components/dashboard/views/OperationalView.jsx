
import React from 'react';
import SmartAlerts from '../widgets/SmartAlerts';
import ProjectTimeline from '../widgets/ProjectTimeline';
import QuickActions from '../widgets/QuickActions';

const OperationalView = ({ campaigns, calendarEvents, filteredCampaigns, dashboardConfig, handleAddQuickTask }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Column 1: Alerts (Critical) */}
            <div className="lg:col-span-1 h-full">
                <div className="h-full min-h-[300px]">
                    <SmartAlerts campaigns={campaigns} events={calendarEvents} />
                </div>
            </div>

            {/* Column 2 & 3: Timeline (Activity) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                {dashboardConfig.showRecentActivity && (
                    <div className="flex-1 min-h-[250px]">
                        <ProjectTimeline campaigns={filteredCampaigns} showRecentActivity={true} />
                    </div>
                )}
            </div>

            {/* Column 4: Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
                <QuickActions onAddQuickTask={handleAddQuickTask}/>
            </div>
        </div>
    );
};

export default OperationalView;
