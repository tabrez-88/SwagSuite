import { EnhancedDashboard } from "./components/EnhancedDashboard";

export default function Home() {
  return (
    <div className="flex gap-6 h-full p-6">
      <div className="flex-1 min-w-0">
        <EnhancedDashboard />
      </div>
    </div>
  );
}
