export interface SlackMessage {
  id: string;
  channelId: string;
  messageId: string;
  userId?: string;
  username?: string;
  content?: string;
  attachments?: any[];
  threadTs?: string;
  isReply?: boolean;
  replyCount?: number;
  timestamp?: string;
  createdAt: string;
  botId?: string;
}

export interface ThreadReply {
  id: string;
  messageId: string;
  userId?: string;
  username?: string;
  content?: string;
  timestamp?: string;
  createdAt: string;
  botId?: string;
}

export interface SlackSidebarProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}
