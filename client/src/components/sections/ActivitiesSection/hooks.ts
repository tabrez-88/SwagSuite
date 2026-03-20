import { useState, useRef } from "react";
import { usePostActivity } from "@/services/activities";
import { type MediaLibraryItem } from "@/lib/media-library";
import type { TeamMember, ProjectData } from "@/types/project-types";
import type { PreviewFile } from "./types";

const defaultTeamMembers: TeamMember[] = [
  { id: "user1", firstName: "Sarah", lastName: "Johnson", email: "sarah@swag.com" },
  { id: "user2", firstName: "Mike", lastName: "Chen", email: "mike@swag.com" },
  { id: "user3", firstName: "Alex", lastName: "Rodriguez", email: "alex@swag.com" },
  { id: "user4", firstName: "Emily", lastName: "Davis", email: "emily@swag.com" },
];

export function useActivitiesSection(orderId: string, data: ProjectData) {
  const { activities, teamMembers } = data;

  const [internalNote, setInternalNote] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MediaLibraryItem[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createActivityMutation = usePostActivity(orderId);

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
    }, {
      onSuccess: () => {
        setInternalNote("");
        setPendingAttachments([]);
      },
    });
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    activities,
    internalNote,
    showMentionSuggestions,
    filteredTeamMembers,
    pendingAttachments,
    setPendingAttachments,
    showFilePicker,
    setShowFilePicker,
    previewFile,
    setPreviewFile,
    textareaRef,
    createActivityMutation,
    handleMentionInput,
    handleMentionSelect,
    handleSendInternalNote,
    removeAttachment,
  };
}
