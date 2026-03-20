export interface SlackMessage {
  id: string;
  messageId: string;
  userId?: string;
  username?: string;
  content?: string;
  timestamp?: string;
  createdAt: string;
  replyCount?: number;
}

export interface SlackStatus {
  configured: boolean;
  connected: boolean;
  channelId?: string;
}
