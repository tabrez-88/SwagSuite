import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { useProjectData } from "../hooks/useProjectData";
import ProjectInfoBar from "@/components/ProjectInfoBar";

interface FeedbackSectionProps {
  orderId: string;
  data: ReturnType<typeof useProjectData>;
}

export default function FeedbackSection({ orderId, data }: FeedbackSectionProps) {
  const { portalTokens, approvals, quoteApprovals, companyName, primaryContact } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPortalTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/portal-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create portal link");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/portal-tokens`] });
      toast({ title: "Portal link created" });
    },
    onError: () => {
      toast({ title: "Failed to create portal link", variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copied to clipboard" });
  };

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
            <p className="text-sm text-gray-500 text-center py-4">
              No portal links generated yet. Create one to share with your client.
            </p>
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
            <p className="text-sm text-gray-500 text-center py-4">
              No artwork approval requests sent yet
            </p>
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
