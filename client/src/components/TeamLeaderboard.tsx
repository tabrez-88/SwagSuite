import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data for team leaderboard
const mockTeamData = [
  {
    id: "1",
    name: "Sarah Johnson",
    revenue: 47200,
    orders: 18,
    performance: 100,
    rank: 1,
  },
  {
    id: "2", 
    name: "Mike Chen",
    revenue: 38900,
    orders: 15,
    performance: 82,
    rank: 2,
  },
  {
    id: "3",
    name: "Lisa Rodriguez", 
    revenue: 31500,
    orders: 12,
    performance: 67,
    rank: 3,
  },
];

const getRankBadgeColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-yellow-100 text-yellow-600";
    case 2:
      return "bg-gray-100 text-gray-600";
    case 3:
      return "bg-orange-100 text-orange-600";
    default:
      return "bg-blue-100 text-blue-600";
  }
};

export default function TeamLeaderboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team KPI Leaderboard</CardTitle>
        <p className="text-sm text-gray-500 mt-1">This month's performance</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTeamData.map((member) => (
            <div key={member.id} className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankBadgeColor(member.rank)}`}>
                <span className="font-bold text-sm">{member.rank}</span>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">
                  ${member.revenue.toLocaleString()} • {member.orders} orders
                </p>
              </div>
              <div className="text-right">
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-swag-primary rounded-full transition-all"
                    style={{ width: `${member.performance}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
