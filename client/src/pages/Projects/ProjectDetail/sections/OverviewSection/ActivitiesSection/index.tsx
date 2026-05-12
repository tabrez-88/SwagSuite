import { format } from "date-fns";
import {
  Activity,
  AtSign,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Settings,
  Shield,
  Trash2,
  Truck,
  Upload,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/UserAvatar";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { FilePreviewModal } from "@/components/modals/FilePreviewModal";
import { getCloudinaryThumbnail, isImageFile } from "@/lib/media-library";
import type { ProjectActivity, TeamMember } from "@/types/project-types";
import { useActivitiesSection } from "./hooks";
import type { ActivitiesSectionProps, PreviewFile } from "./types";

function getMetadataAction(metadata: Record<string, unknown> | null | undefined): string {
  return ((metadata as Record<string, unknown>)?.action as string) || "";
}

/** True when the activity was triggered by a client/vendor (not internal team or system). */
function isClientAction(activity: ProjectActivity): boolean {
  const action = getMetadataAction(activity.metadata);
  return [
    "approval_viewed",
    "quote_approved", "quote_declined",
    "sales_order_approved", "sales_order_declined",
    "presentation_first_view",
  ].includes(action)
    || activity.activityType === "artwork_approved"
    || activity.activityType === "artwork_rejected";
}

function isVendorAction(activity: ProjectActivity): boolean {
  const action = getMetadataAction(activity.metadata);
  return ["po_vendor_confirmed", "po_vendor_declined"].includes(action);
}

function getActivityIcon(activityType: string, metadata?: Record<string, unknown>) {
  const action = getMetadataAction(metadata);

  if (activityType === "artwork_approved") return <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />;
  if (activityType === "artwork_rejected") return <XCircle className="w-3.5 h-3.5 text-orange-700" />;

  if (activityType === "system_action") {
    // Specific approval/decline icons per document type
    if (action === "quote_approved") return <FileText className="w-3.5 h-3.5 text-green-700" />;
    if (action === "quote_declined") return <FileText className="w-3.5 h-3.5 text-red-700" />;
    if (action === "sales_order_approved") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />;
    if (action === "sales_order_declined") return <XCircle className="w-3.5 h-3.5 text-red-700" />;
    if (action === "po_vendor_confirmed") return <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />;
    if (action === "po_vendor_declined") return <XCircle className="w-3.5 h-3.5 text-red-700" />;
    // New tracked actions
    if (action === "product_added") return <Plus className="w-3.5 h-3.5 text-blue-700" />;
    if (action === "product_removed") return <Trash2 className="w-3.5 h-3.5 text-red-700" />;
    if (action === "invoice_created" || action === "deposit_invoice_created") return <DollarSign className="w-3.5 h-3.5 text-emerald-700" />;
    if (action === "document_generated") return <FileText className="w-3.5 h-3.5 text-blue-700" />;
    if (action === "shipment_created") return <Truck className="w-3.5 h-3.5 text-teal-700" />;
    // Generic fallbacks
    if (action.includes("approved") || action.includes("confirmed")) return <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />;
    if (action.includes("declined")) return <XCircle className="w-3.5 h-3.5 text-red-700" />;
    if (action.includes("viewed") || action.includes("first_view")) return <Eye className="w-3.5 h-3.5 text-indigo-700" />;
    if (action.includes("email") || action === "po_sent" || action.includes("reminder")) return <Mail className="w-3.5 h-3.5 text-blue-700" />;
    if (action.includes("payment") || action.includes("invoice") || action.includes("bill")) return <DollarSign className="w-3.5 h-3.5 text-emerald-700" />;
    if (action.includes("shipped") || action.includes("delivered") || action.includes("shipping") || action.includes("tracking")) return <Truck className="w-3.5 h-3.5 text-teal-700" />;
    if (action.includes("assigned")) return <UserPlus className="w-3.5 h-3.5 text-blue-700" />;
    if (action.includes("unlock")) return <Shield className="w-3.5 h-3.5 text-amber-700" />;
    if (action.includes("overdue") || action.includes("expired") || action.includes("delay")) return <Clock className="w-3.5 h-3.5 text-orange-700" />;
    if (action.includes("stage_change")) return <Settings className="w-3.5 h-3.5 text-purple-700" />;
    return <Activity className="w-3.5 h-3.5 text-gray-700" />;
  }

  switch (activityType) {
    case "status_change": return <Settings className="w-3.5 h-3.5 text-purple-700" />;
    case "comment": return <MessageSquare className="w-3.5 h-3.5 text-green-700" />;
    case "product_comment": return <MessageSquare className="w-3.5 h-3.5 text-blue-700" />;
    case "file_upload": return <Upload className="w-3.5 h-3.5 text-purple-700" />;
    case "mention": return <AtSign className="w-3.5 h-3.5 text-yellow-700" />;
    default: return <Activity className="w-3.5 h-3.5 text-gray-600" />;
  }
}

function AttachmentChips({ attachments, onPreview }: {
  attachments: any[];
  onPreview: (file: PreviewFile) => void;
}) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((att: { mediaLibraryId?: string; fileName: string; cloudinaryUrl: string; mimeType?: string }, idx: number) => (
        <div
          key={att.mediaLibraryId || idx}
          role="button"
          tabIndex={0}
          onClick={() => onPreview({
            originalName: att.fileName,
            filePath: att.cloudinaryUrl,
            mimeType: att.mimeType || "application/octet-stream",
            fileName: att.fileName,
          })}
          className="flex items-center gap-2 p-1.5 bg-white border rounded-lg hover:bg-gray-50 max-w-[200px] cursor-pointer"
        >
          {isImageFile(att.mimeType ?? null) ? (
            <img
              src={getCloudinaryThumbnail(att.cloudinaryUrl, 40, 40)}
              className="w-8 h-8 rounded object-cover flex-shrink-0"
              alt={att.fileName}
            />
          ) : (
            <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-xs font-medium truncate">{att.fileName}</span>
        </div>
      ))}
    </div>
  );
}

function getActivityBg(activityType: string, metadata?: Record<string, unknown>) {
  const action = getMetadataAction(metadata);

  if (activityType === "artwork_approved") return "bg-green-100 border-green-300";
  if (activityType === "artwork_rejected") return "bg-orange-100 border-orange-300";

  if (activityType === "system_action") {
    // Specific approval/decline backgrounds per document type
    if (action === "quote_approved") return "bg-green-100 border-green-400";
    if (action === "quote_declined") return "bg-red-100 border-red-300";
    if (action === "sales_order_approved") return "bg-emerald-100 border-emerald-400";
    if (action === "sales_order_declined") return "bg-red-100 border-red-300";
    if (action === "po_vendor_confirmed") return "bg-green-100 border-green-300";
    if (action === "po_vendor_declined") return "bg-red-100 border-red-300";
    // New tracked actions
    if (action === "product_added") return "bg-blue-100 border-blue-300";
    if (action === "product_removed") return "bg-red-100 border-red-300";
    if (action === "invoice_created" || action === "deposit_invoice_created") return "bg-emerald-100 border-emerald-300";
    if (action === "document_generated") return "bg-blue-100 border-blue-300";
    if (action === "shipment_created") return "bg-teal-100 border-teal-300";
    // Generic fallbacks
    if (action.includes("approved") || action.includes("confirmed")) return "bg-green-100 border-green-300";
    if (action.includes("declined")) return "bg-red-100 border-red-300";
    if (action.includes("viewed") || action.includes("first_view")) return "bg-indigo-100 border-indigo-300";
    if (action.includes("email") || action === "po_sent" || action.includes("reminder")) return "bg-blue-100 border-blue-300";
    if (action.includes("payment") || action.includes("invoice") || action.includes("bill")) return "bg-emerald-100 border-emerald-300";
    if (action.includes("shipped") || action.includes("delivered") || action.includes("shipping") || action.includes("tracking")) return "bg-teal-100 border-teal-300";
    if (action.includes("assigned")) return "bg-blue-100 border-blue-300";
    if (action.includes("unlock")) return "bg-amber-100 border-amber-300";
    if (action.includes("overdue") || action.includes("expired") || action.includes("delay")) return "bg-orange-100 border-orange-300";
    if (action.includes("stage_change")) return "bg-purple-100 border-purple-300";
    return "bg-gray-100 border-gray-300";
  }

  switch (activityType) {
    case "status_change": return "bg-purple-100 border-purple-300";
    case "comment": return "bg-green-100 border-green-300";
    case "product_comment": return "bg-blue-100 border-blue-300";
    case "file_upload": return "bg-purple-100 border-purple-300";
    case "mention": return "bg-yellow-100 border-yellow-300";
    default: return "bg-gray-100 border-gray-300";
  }
}

function getActivityLabel(activityType: string, metadata?: Record<string, unknown>): string | null {
  const action = getMetadataAction(metadata);
  if (activityType === "artwork_approved") return "Artwork Approved";
  if (activityType === "artwork_rejected") return "Revision Requested";
  if (activityType === "status_change") {
    const section = (metadata?.section as string) || "";
    return section ? `${section} status` : "Status Change";
  }
  if (activityType === "comment") return "Note";
  if (activityType === "product_comment") return "Product Note";
  if (activityType === "file_upload") return "File Upload";
  if (activityType === "system_action" && action) {
    // Specific labels for approvals/declines
    const labelMap: Record<string, string> = {
      quote_approved: "Quote Approved \u2713",
      quote_declined: "Quote Declined",
      sales_order_approved: "Sales Order Approved \u2713",
      sales_order_declined: "Sales Order Declined",
      product_added: "Product Added",
      product_removed: "Product Removed",
      invoice_created: "Invoice Created",
      deposit_invoice_created: "Deposit Invoice Created",
      document_generated: "Document Generated",
      shipment_created: "Shipment Created",
    };
    if (labelMap[action]) return labelMap[action];
    return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}

export default function ActivitiesSection({ projectId, data }: ActivitiesSectionProps) {
  const hook = useActivitiesSection(projectId, data);

  return (
    <div className="space-y-6">
      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Internal Team Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Textarea
              ref={hook.textareaRef}
              placeholder="Add internal note... Use @ to mention team members"
              value={hook.internalNote}
              onChange={(e) => hook.handleMentionInput(e.target.value)}
              className="min-h-[120px]"
              data-testid="textarea-internal-note"
            />

            {/* Mention Suggestions */}
            {hook.showMentionSuggestions && hook.filteredTeamMembers.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {hook.filteredTeamMembers
                  .slice(0, 5)
                  .map((member: TeamMember) => (
                    <button
                      key={member.id}
                      onClick={() => hook.handleMentionSelect(member)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                      data-testid={`mention-${member.id}`}
                    >
                      <UserAvatar
                        name={`${member.firstName} ${member.lastName}`}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.email}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Pending Attachments */}
          {hook.pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border">
              {hook.pendingAttachments.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="w-16 h-16 rounded border bg-white flex items-center justify-center overflow-hidden">
                    {isImageFile(file.mimeType) ? (
                      <img
                        src={getCloudinaryThumbnail(file.cloudinaryUrl, 100, 100)}
                        className="w-full h-full object-cover"
                        alt={file.originalName}
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => hook.removeAttachment(file.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-[10px] text-gray-500 truncate w-16 text-center mt-0.5">
                    {file.originalName}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => hook.setShowFilePicker(true)}
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Attach Files
            </Button>
            <Button
              onClick={hook.handleSendInternalNote}
              disabled={(!hook.internalNote.trim() && hook.pendingAttachments.length === 0) || hook.createActivityMutation.isPending}
              className="flex-1"
              data-testid="button-send-internal-note"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Internal Note
            </Button>
          </div>

          <FilePickerDialog
            open={hook.showFilePicker}
            onClose={() => hook.setShowFilePicker(false)}
            onSelect={(files) => {
              hook.setPendingAttachments((prev) => [...prev, ...files]);
              hook.setShowFilePicker(false);
            }}
            multiple={true}
            contextProjectId={projectId}
            title="Attach Files to Note"
          />

          {/* Recent Internal Notes */}
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Recent Internal Notes
            </h4>
            <div className="space-y-2">
              {hook.activities.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                  No internal notes yet. Add a note above to start tracking
                  this project.
                </div>
              ) : (
                hook.activities
                  .filter(
                    (activity: ProjectActivity) =>
                      activity.activityType === "comment",
                  )
                  .slice(0, 5)
                  .map((activity: ProjectActivity) => {
                    const userName = activity.user
                      ? `${activity.user.firstName} ${activity.user.lastName}`
                      : "Unknown User";

                    const attachments = ((activity.metadata as Record<string, unknown>)?.attachments as any[]) || [];
                    return (
                      <div
                        key={activity.id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <UserAvatar name={userName} size="sm" />
                          <span className="text-sm font-medium">
                            {userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {activity.content}
                        </p>
                        <AttachmentChips attachments={attachments} onPreview={hook.setPreviewFile} />
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Complete history of all actions on this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hook.isTimelineLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-gray-400" />
              <p>Loading activities...</p>
            </div>
          ) : hook.timelineActivities.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No activity yet</p>
              <p className="text-xs mt-1">
                Actions on this order will appear here
              </p>
            </div>
          ) : (
            <div className="relative ">
              {/* Timeline line */}
              <div className="absolute left-[34px] h-full z-90 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4 max-h-[510px] overflow-y-auto px-2">
                {hook.timelineActivities.map((activity: ProjectActivity) => {
                  const meta = activity.metadata as Record<string, unknown>;
                  const isClient = isClientAction(activity);
                  const isVendor = isVendorAction(activity);

                  let userName: string;
                  let badgeLabel: string | null = null;
                  let badgeClass = "text-[10px] px-1.5 py-0 h-4";
                  if (activity.user) {
                    userName = `${activity.user.firstName} ${activity.user.lastName}`;
                  } else if (isClient) {
                    userName = (meta?.clientName as string) || "Client";
                    badgeLabel = "Client";
                    badgeClass += " bg-blue-100 text-blue-700 border-blue-300";
                  } else if (isVendor) {
                    userName = (meta?.vendorName as string) || "Vendor";
                    badgeLabel = "Vendor";
                    badgeClass += " bg-violet-100 text-violet-700 border-violet-300";
                  } else if (activity.isSystemGenerated) {
                    userName = "System";
                    badgeLabel = "System";
                  } else {
                    userName = "Unknown";
                  }

                  const label = getActivityLabel(activity.activityType, meta);

                  return (
                    <div
                      key={activity.id}
                      className={`relative flex items-center gap-3 p-2 ${isClient || isVendor ? "ring-2 ring-blue-200 rounded-lg p-1.5 " : ""}`}
                    >
                      {/* Icon */}
                      <div
                        className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center ${getActivityBg(activity.activityType, meta)}`}
                      >
                        {getActivityIcon(activity.activityType, meta)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900">
                            {userName}
                          </span>
                          {badgeLabel && (
                            <Badge
                              variant="outline"
                              className={badgeClass}
                            >
                              {badgeLabel}
                            </Badge>
                          )}
                          {label && (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 h-4 ${isClient || isVendor ? "font-semibold" : ""}`}
                            >
                              {label}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                            {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {activity.content}
                        </p>
                        {/* Inline attachments */}
                        <AttachmentChips
                          attachments={((meta)?.attachments as any[]) || []}
                          onPreview={hook.setPreviewFile}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite scroll sentinel */}
              {hook.hasMoreTimeline && (
                <div ref={hook.sentinelRef} className="flex justify-center py-4">
                  {hook.isFetchingMore ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <span className="text-xs text-gray-400">Scroll for more</span>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <FilePreviewModal
        open={!!hook.previewFile}
        onClose={() => hook.setPreviewFile(null)}
        file={hook.previewFile}
      />
    </div>
  );
}
