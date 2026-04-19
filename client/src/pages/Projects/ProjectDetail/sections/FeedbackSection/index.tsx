import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Star,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import ProjectInfoBar from "@/components/layout/ProjectInfoBar";
import { useFeedbackSection } from "./hooks";
import type { FeedbackSectionProps } from "./types";

export default function FeedbackSection(props: FeedbackSectionProps) {
  const {
    portalTokens,
    approvals,
    quoteApprovals,
    companyName,
    primaryContact,
    createPortalTokenMutation,
    copyToClipboard,
  } = useFeedbackSection(props);

  return (
    <div className="space-y-6">
      <ProjectInfoBar companyName={companyName} primaryContact={primaryContact} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5" />
            Feedback
          </h2>
          <p className="text-sm text-gray-500">
            Customer portal, artwork approvals, and feedback
          </p>
        </div>
      </div>

      {/* Customer Portal */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Customer Portal Links
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => createPortalTokenMutation.mutate()}
              disabled={createPortalTokenMutation.isPending}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Generate Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {portalTokens.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No portal links yet</h3>
              <p className="text-sm text-gray-500">Create one to share with your client.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {portalTokens.map((token: any) => {
                const portalUrl = `${window.location.origin}/portal/${token.token}`;
                return (
                  <div key={token.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono truncate">{portalUrl}</p>
                      <p className="text-xs text-gray-500">
                        Created {token.createdAt && format(new Date(token.createdAt), "MMM d, yyyy")}
                        {token.expiresAt && ` · Expires ${format(new Date(token.expiresAt), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(portalUrl)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artwork Approvals */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Artwork Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No artwork approval requests sent yet</h3>
              <p className="text-sm text-gray-500">Send proofs to clients from the Purchase Orders section</p>
            </div>
          ) : (
            <div className="space-y-2">
              {approvals.map((approval: any) => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{approval.clientName || approval.clientEmail}</p>
                    <p className="text-xs text-gray-500">
                      Sent {approval.sentAt && format(new Date(approval.sentAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      approval.status === "approved" ? "default"
                      : approval.status === "declined" ? "destructive"
                      : "secondary"
                    }
                    className={approval.status === "approved" ? "bg-green-100 text-green-700" : ""}
                  >
                    {approval.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                    {approval.status === "declined" && <XCircle className="w-3 h-3 mr-1" />}
                    {approval.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                    {approval.status?.charAt(0).toUpperCase() + approval.status?.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Approvals */}
      {quoteApprovals.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4" />
              Quote Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quoteApprovals.map((qa: any) => (
                <div key={qa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{qa.clientName || qa.clientEmail}</p>
                    {qa.approvalNotes && (
                      <p className="text-xs text-gray-500 mt-1">{qa.approvalNotes}</p>
                    )}
                  </div>
                  <Badge
                    variant={qa.status === "approved" ? "default" : "secondary"}
                    className={qa.status === "approved" ? "bg-green-100 text-green-700" : ""}
                  >
                    {qa.status?.charAt(0).toUpperCase() + qa.status?.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
