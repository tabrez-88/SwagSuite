import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sendSlackMessage } from '@/services/communications/requests';
import type { SlackMessage, ThreadReply } from './types';

export function useSlackSidebar(isMinimized: boolean) {
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
    mutationFn: (content: string) => sendSlackMessage(content),
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

  return {
    newMessage,
    setNewMessage,
    isConnected,
    expandedThreads,
    messagesEndRef,
    messages,
    isLoading,
    sendMessageMutation,
    handleSendMessage,
    handleKeyPress,
    toggleThread,
    useThreadReplies,
    refetchSlack,
  };
}
