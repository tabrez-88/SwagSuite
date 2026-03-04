import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity,
  AtSign,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
  Settings,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import FilePickerDialog from "@/components/FilePickerDialog";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { type MediaLibraryItem, getCloudinaryThumbnail, isImageFile } from "@/lib/media-library";
import type {
  useOrderDetailData,
  ProjectActivity,
  TeamMember,
} from "../hooks/useOrderDetailData";

interface ActivitiesSectionProps {
  orderId: string;
  data: ReturnType<typeof useOrderDetailData>;
}

const defaultTeamMembers: TeamMember[] = [
  { id: "user1", firstName: "Sarah", lastName: "Johnson", email: "sarah@swag.com" },
  { id: "user2", firstName: "Mike", lastName: "Chen", email: "mike@swag.com" },
  { id: "user3", firstName: "Alex", lastName: "Rodriguez", email: "alex@swag.com" },
  { id: "user4", firstName: "Emily", lastName: "Davis", email: "emily@swag.com" },
];

function getActivityIcon(activityType: string) {
  switch (activityType) {
    case "status_change":
      return <Settings className="w-3.5 h-3.5 text-blue-700" />;
    case "comment":
      return <MessageSquare className="w-3.5 h-3.5 text-green-700" />;
    case "file_upload":
      return <Upload className="w-3.5 h-3.5 text-purple-700" />;
    case "mention":
      return <AtSign className="w-3.5 h-3.5 text-yellow-700" />;
    case "system_action":
      return <Activity className="w-3.5 h-3.5 text-gray-700" />;
    default:
      return <Activity className="w-3.5 h-3.5 text-gray-600" />;
  }
}

function AttachmentChips({ attachments, onPreview }: {
  attachments: any[];
  onPreview: (file: { originalName: string; filePath: string; mimeType: string; fileName: string }) => void;
}) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((att: any, idx: number) => (
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
          {isImageFile(att.mimeType) ? (
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

function getActivityBg(activityType: string) {
  switch (activityType) {
    case "status_change":
      return "bg-blue-100 border-blue-300";
    case "comment":
      return "bg-green-100 border-green-300";
    case "file_upload":
      return "bg-purple-100 border-purple-300";
    case "mention":
      return "bg-yellow-100 border-yellow-300";
    case "system_action":
      return "bg-gray-100 border-gray-300";
    default:
      return "bg-gray-100 border-gray-300";
  }
}

export default function ActivitiesSection({ orderId, data }: ActivitiesSectionProps) {
  const { activities, teamMembers } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [internalNote, setInternalNote] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MediaLibraryItem[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ originalName: string; filePath: string; mimeType: string; fileName: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createActivityMutation = useMutation({
    mutationFn: async (mutationData: {
      activityType: string;
      content: string;
      mentionedUsers?: string[];
      attachments?: { fileName: string; mimeType: string | null; cloudinaryUrl: string; thumbnailUrl: string | null }[];
    }) => {
      const response = await fetch(`/api/projects/${orderId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mutationData),
      });
      if (!response.ok) throw new Error("Failed to create activity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${orderId}/activities`],
      });
      toast({
        title: "Note sent",
        description: "Internal note has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send internal note.",
        variant: "destructive",
      });
    },
  });

  const resolvedTeamMembers = teamMembers.length > 0 ? teamMembers : defaultTeamMembers;

  const handleMentionInput = (value: string) => {
    setInternalNote(value);
    const atIndex = value.lastIndexOf("@");
    if (atIndex !== -1 && atIndex === value.length - 1) {
      setShowMentionSuggestions(true);
      setMentionQuery("");
    } else if (atIndex !== -1) {
      const query = value.slice(atIndex + 1);
      if (query.includes(" ")) {
        setShowMentionSuggestions(false);
      } else {
        setMentionQuery(query);
        setShowMentionSuggestions(true);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleMentionSelect = (member: TeamMember) => {
    const atIndex = internalNote.lastIndexOf("@");
    const beforeMention = internalNote.slice(0, atIndex);
    const afterMention = internalNote.slice(atIndex + mentionQuery.length + 1);
    setInternalNote(
      `${beforeMention}@${member.firstName} ${member.lastName}${afterMention}`,
    );
    setShowMentionSuggestions(false);
    textareaRef.current?.focus();
  };

  const filteredTeamMembers = resolvedTeamMembers.filter((member: TeamMember) =>
    `${member.firstName} ${member.lastName}`
      .toLowerCase()
      .includes(mentionQuery.toLowerCase()),
  );

  const handleSendInternalNote = () => {
    if (!internalNote.trim() && pendingAttachments.length === 0) return;

    const mentionedUserIds: string[] = [];
    resolvedTeamMembers.forEach((member) => {
      const fullName = `${member.firstName} ${member.lastName}`;
      if (internalNote.includes(`@${fullName}`)) {
        mentionedUserIds.push(member.id);
      }
    });

    createActivityMutation.mutate({
      activityType: "comment",
      content: internalNote || (pendingAttachments.length > 0 ? "Shared files" : ""),
      mentionedUsers: mentionedUserIds,
      attachments: pendingAttachments.length > 0 ? pendingAttachments.map((f) => ({
        fileName: f.originalName,
        mimeType: f.mimeType,
        cloudinaryUrl: f.cloudinaryUrl,
        thumbnailUrl: f.thumbnailUrl,
      })) : undefined,
    });
    setInternalNote("");
    setPendingAttachments([]);
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((f) => f.id !== id));
  };

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
              ref={textareaRef}
              placeholder="Add internal note... Use @ to mention team members"
              value={internalNote}
              onChange={(e) => handleMentionInput(e.target.value)}
              className="min-h-[120px]"
              data-testid="textarea-internal-note"
            />

            {/* Mention Suggestions */}
            {showMentionSuggestions && filteredTeamMembers.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {filteredTeamMembers
                  .slice(0, 5)
                  .map((member: TeamMember) => (
                    <button
                      key={member.id}
                      onClick={() => handleMentionSelect(member)}
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
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border">
              {pendingAttachments.map((file) => (
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
                    onClick={() => removeAttachment(file.id)}
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
              onClick={() => setShowFilePicker(true)}
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Attach Files
            </Button>
            <Button
              onClick={handleSendInternalNote}
              disabled={(!internalNote.trim() && pendingAttachments.length === 0) || createActivityMutation.isPending}
              className="flex-1"
              data-testid="button-send-internal-note"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Internal Note
            </Button>
          </div>

          <FilePickerDialog
            open={showFilePicker}
            onClose={() => setShowFilePicker(false)}
            onSelect={(files) => {
              setPendingAttachments((prev) => [...prev, ...files]);
              setShowFilePicker(false);
            }}
            multiple={true}
            contextOrderId={orderId}
            title="Attach Files to Note"
          />

          {/* Recent Internal Notes */}
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Recent Internal Notes
            </h4>
            <div className="space-y-2">
              {activities.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                  No internal notes yet. Add a note above to start tracking
                  this project.
                </div>
              ) : (
                activities
                  .filter(
                    (activity: ProjectActivity) =>
                      activity.activityType === "comment",
                  )
                  .slice(0, 5)
                  .map((activity: ProjectActivity) => {
                    const userName = activity.user
                      ? `${activity.user.firstName} ${activity.user.lastName}`
                      : "Unknown User";

                    const attachments = (activity.metadata as any)?.attachments || [];
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
                        <AttachmentChips attachments={attachments} onPreview={setPreviewFile} />
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
          {activities.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No activity yet</p>
              <p className="text-xs mt-1">
                Actions on this order will appear here
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {activities.map((activity: ProjectActivity) => {
                  const userName = activity.user
                    ? `${activity.user.firstName} ${activity.user.lastName}`
                    : activity.isSystemGenerated
                      ? "System"
                      : "Unknown";

                  return (
                    <div
                      key={activity.id}
                      className="relative flex gap-3 pl-0"
                    >
                      {/* Icon */}
                      <div
                        className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center ${getActivityBg(activity.activityType)}`}
                      >
                        {getActivityIcon(activity.activityType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900">
                            {userName}
                          </span>
                          {activity.isSystemGenerated && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              System
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
                          attachments={(activity.metadata as any)?.attachments || []}
                          onPreview={setPreviewFile}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <FilePreviewModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}
