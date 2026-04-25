import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Eye, XCircle } from "lucide-react";
import { format } from "date-fns";

interface QuoteApproval {
  id: number | string;
  clientName?: string | null;
  clientEmail: string | null;
  status?: string | null;
  viewedAt?: string | Date | null;
}

interface ApprovalStatusCardProps {
  quoteApprovals: QuoteApproval[];
  isQuotePhase: boolean;
  primaryContact: { firstName?: string | null; lastName?: string | null } | null | undefined;
}

export default function ApprovalStatusCard({
  quoteApprovals,
  isQuotePhase,
  primaryContact,
}: ApprovalStatusCardProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Approval Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quoteApprovals.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No approval requests sent yet</h3>
            {isQuotePhase && primaryContact && (
              <p className="text-sm text-gray-500">
                Send this quote to {primaryContact.firstName} {primaryContact.lastName} for approval
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {quoteApprovals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{approval.clientName || approval.clientEmail}</p>
                  <p className="text-xs text-gray-500">{approval.clientEmail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      approval.status === "approved"
                        ? "default"
                        : approval.status === "declined"
                          ? "destructive"
                          : "secondary"
                    }
                    className={
                      approval.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : ""
                    }
                  >
                    {approval.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                    {approval.status === "declined" && <XCircle className="w-3 h-3 mr-1" />}
                    {approval.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                    {(approval.status ?? "").charAt(0).toUpperCase() + (approval.status ?? "").slice(1)}
                  </Badge>
                  {approval.viewedAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      Viewed {format(new Date(approval.viewedAt), "MMM d")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
