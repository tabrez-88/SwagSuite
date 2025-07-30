import Layout from "@/components/Layout";
import { EnhancedDashboard } from "@/components/dashboard/EnhancedDashboard";
import { SlackPanel } from "@/components/dashboard/SlackPanel";

export default function Home() {
  return (
    <Layout>
      <div className="flex gap-6 h-full">
        {/* Main Dashboard Content */}
        <div className="flex-1 min-w-0">
          <EnhancedDashboard />
        </div>
        
        {/* Right Sidebar - Slack Panel */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-0">
            <SlackPanel />
          </div>
        </div>
      </div>
    </Layout>
  );
}
