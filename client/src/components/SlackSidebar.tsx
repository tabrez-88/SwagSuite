import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Send, 
  Minimize2, 
  Maximize2, 
  Users, 
  Clock,
  RefreshCw,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SlackMessage {
  id: string;
  channelId: string;
  messageId: string;
  userId?: string;
  content?: string;
  attachments?: any[];
  threadTs?: string;
  createdAt: string;
}

interface SlackSidebarProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export function SlackSidebar({ isMinimized, onToggleMinimize }: SlackSidebarProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch Slack messages
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/slack/messages'],
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: !isMinimized, // Only fetch when not minimized
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/slack/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/slack/messages'] });
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isMinimized) {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <Button
          onClick={onToggleMinimize}
          className="bg-[#4A154B] hover:bg-[#4A154B]/90 text-white rounded-full w-12 h-12 p-0 shadow-lg"
          title="Open Slack"
        >
          <MessageSquare size={20} />
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
            onClick={() => refetch()}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            disabled={isLoading}
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

          {messages.map((message: SlackMessage) => (
            <div key={message.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#4A154B] rounded-full flex items-center justify-center">
                    <Users size={12} className="text-white" />
                  </div>
                  <span className="font-medium text-sm">Team Member</span>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={10} className="mr-1" />
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 ml-8">
                {message.content || 'Message content'}
              </p>
              {message.attachments && message.attachments.length > 0 && (
                <div className="ml-8 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {message.attachments.length} attachment(s)
                  </Badge>
                </div>
              )}
            </div>
          ))}
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