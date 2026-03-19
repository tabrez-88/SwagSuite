import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Hash,
  MessageSquare,
  Minimize2,
  RefreshCw,
  Send,
  User,
  Users
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SlackMessage {
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

interface ThreadReply {
  id: string;
  messageId: string;
  userId?: string;
  username?: string;
  content?: string;
  timestamp?: string;
  createdAt: string;
  botId?: string;
}

interface SlackSidebarProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export function SlackSidebar({ isMinimized, onToggleMinimize }: SlackSidebarProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch Slack messages from channel history (live sync) 
  const { data: slackResponse, isLoading: isLoadingSlack, refetch: refetchSlack } = useQuery<{ messages: SlackMessage[] }>({
    queryKey: ['/api/slack/sync-messages'],
    refetchInterval: 10000, // Refresh every 10 seconds to get new replies from Slack
    enabled: !isMinimized,
  });

  // Use Slack channel messages (live data from Slack)
  const messages = slackResponse?.messages || [];
  const isLoading = isLoadingSlack;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/slack/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      // Refetch after a short delay to ensure message is in Slack
      setTimeout(() => {
        refetchSlack();
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error);
      alert(error.message || 'Failed to send message to Slack');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleThread = (threadTs: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadTs)) {
        newSet.delete(threadTs);
      } else {
        newSet.add(threadTs);
      }
      return newSet;
    });
  };

  // Fetch thread replies when expanded
  const useThreadReplies = (threadTs: string | undefined, enabled: boolean) => {
    return useQuery<{ replies: ThreadReply[] }>({
      queryKey: [`/api/slack/thread/${threadTs}`],
      enabled: enabled && !!threadTs,
      staleTime: 30000, // Cache for 30 seconds
    });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isMinimized) {
    return (
      <div className="fixed right-6 bottom-0 transform -translate-y-1/2 z-50">
        <Button
          onClick={onToggleMinimize}
          className="bg-[#4A154B] hover:bg-[#4A154B]/90 text-white rounded-full w-12 h-12 p-0 shadow-lg"
          title="Open Slack"
        >
          <MessageSquare size={28} />
        </Button>
        {messages.length > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
            {Math.min(messages.length, 99)}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="bg-[#4A154B] text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Hash size={16} />
          <span className="font-medium">SwagSuite Chat</span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchSlack()}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            disabled={isLoading}
            title="Refresh messages"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <Minimize2 size={14} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-gray-400" size={20} />
              <span className="ml-2 text-gray-500">Loading messages...</span>
            </div>
          )}

          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          )}

          {messages.map((message: SlackMessage) => {
            const isFromBot = message.botId || message.username === 'SwagSuite';
            const displayName = message.username || (isFromBot ? 'SwagSuite' : 'Team Member');
            const messageTime = message.timestamp
              ? new Date(message.timestamp)
              : new Date(message.createdAt);
            const hasThread = (message.replyCount ?? 0) > 0 && !message.isReply;
            const isThreadExpanded = expandedThreads.has(message.messageId);

            return (
              <div key={message.id}>
                <div
                  className={`rounded-lg p-3 ${isFromBot
                    ? 'bg-blue-50 dark:bg-blue-900/20 ml-4'
                    : 'bg-gray-50 dark:bg-gray-800 mr-4'
                    }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isFromBot ? 'bg-blue-500' : 'bg-[#7b287c]'
                        }`}>
                        <User size={12} className="text-white" />
                      </div>
                      <span className="font-medium text-sm">{displayName}</span>
                      {message.isReply && (
                        <Badge variant="outline" className="text-xs">
                          Reply
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={10} className="mr-1" />
                      {formatDistanceToNow(messageTime, { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-8 whitespace-pre-wrap">
                    {message.content || 'Message content'}
                  </p>
                  {hasThread && (
                    <div className="ml-8 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleThread(message.messageId)}
                        className="h-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        {isThreadExpanded ? (
                          <ChevronDown size={14} className="mr-1" />
                        ) : (
                          <ChevronRight size={14} className="mr-1" />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                        </Badge>
                      </Button>
                    </div>
                  )}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="ml-8 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {message.attachments.length} attachment(s)
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Thread Replies */}
                {hasThread && isThreadExpanded && (
                  <ThreadReplies
                    threadTs={message.messageId}
                    useThreadReplies={useThreadReplies}
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 min-h-[40px] max-h-24 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="bg-[#4A154B] hover:bg-[#4A154B]/90 text-white px-3"
          >
            {sendMessageMutation.isPending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// Thread Replies Component
function ThreadReplies({
  threadTs,
  useThreadReplies
}: {
  threadTs: string;
  useThreadReplies: (threadTs: string | undefined, enabled: boolean) => any;
}) {
  const { data: threadData, isLoading } = useThreadReplies(threadTs, true);
  const replies = threadData?.replies || [];

  if (isLoading) {
    return (
      <div className="ml-12 mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded">
        <div className="flex items-center text-xs text-gray-500">
          <RefreshCw size={12} className="animate-spin mr-1" />
          Loading replies...
        </div>
      </div>
    );
  }

  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="ml-12 mt-2 space-y-2 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
      {replies.map((reply: ThreadReply) => {
        const isFromBot = reply.botId || reply.username === 'SwagSuite';
        const displayName = reply.username || (isFromBot ? 'SwagSuite' : 'Team Member');
        const replyTime = reply.timestamp
          ? new Date(reply.timestamp)
          : new Date(reply.createdAt);

        return (
          <div
            key={reply.id}
            className={`rounded p-2 text-sm ${isFromBot
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-gray-100 dark:bg-gray-800'
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isFromBot ? 'bg-blue-500' : 'bg-[#4A154B]'
                  }`}>
                  <Users size={8} className="text-white" />
                </div>
                <span className="font-medium text-xs">{displayName}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock size={8} className="mr-1" />
                {formatDistanceToNow(replyTime, { addSuffix: true })}
              </div>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 ml-5 whitespace-pre-wrap">
              {reply.content || 'Reply content'}
            </p>
          </div>
        );
      })}
    </div>
  );
}