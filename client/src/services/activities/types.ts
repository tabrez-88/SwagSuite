export interface ActivityAttachment {
  fileName: string;
  mimeType: string;
  cloudinaryUrl: string;
  thumbnailUrl?: string;
}

export interface PostActivityInput {
  activityType: string;
  content: string;
  metadata?: {
    section?: string;
    action?: string;
    attachments?: ActivityAttachment[];
    [key: string]: unknown;
  };
}
