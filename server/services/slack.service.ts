import { type ChatPostMessageArguments, WebClient } from "@slack/web-api"

// Helper to get Slack client with credentials
function getSlackClient(botToken?: string): WebClient | null {
  const token = botToken || process.env.SLACK_BOT_TOKEN?.trim();
  return token ? new WebClient(token) : null;
}

/**
 * Sends a structured message to a Slack channel using the Slack Web API
 * Prefer using Channel ID to Channel names because they don't change when the
 * channel is renamed.
 * @param message - Structured message to send
 * @param botToken - Optional bot token (will use env var if not provided)
 * @returns Promise resolving to the sent message's timestamp
 */
export async function sendSlackMessage(
  message: ChatPostMessageArguments,
  botToken?: string
): Promise<string | undefined> {
  const slack = getSlackClient(botToken);
  
  if (!slack) {
    console.warn('Slack is not configured. Skipping message send.');
    return undefined;
  }

  try {
    // Send the message
    const response = await slack.chat.postMessage(message);

    // Return the timestamp of the sent message
    return response.ts;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    // Don't throw - just log and return undefined
    return undefined;
  }
}

/**
 * Reads the history of a channel
 * @param channel_id - Channel ID to read message history from
 * @param messageLimit - Number of messages to fetch
 * @param botToken - Optional bot token (will use env var if not provided)
 * @returns Promise resolving to the messages
 */
export async function readSlackHistory(
  channel_id: string,
  messageLimit: number = 100,
  botToken?: string
) {
  const slack = getSlackClient(botToken);
  
  if (!slack) {
    console.warn('Slack is not configured. Cannot read history.');
    return { messages: [] };
  }

  try {
    // Get messages
    return await slack.conversations.history({
      channel: channel_id,
      limit: messageLimit,
    });
  } catch (error) {
    console.error('Error reading Slack history:', error);
    return { messages: [] };
  }
}

/**
 * Gets user information from Slack
 * @param user_id - User ID to fetch information for
 * @param botToken - Optional bot token (will use env var if not provided)
 * @returns Promise resolving to user info
 */
export async function getSlackUserInfo(user_id: string, botToken?: string) {
  const slack = getSlackClient(botToken);
  
  if (!slack) {
    console.warn('Slack is not configured. Cannot get user info.');
    return null;
  }

  try {
    const response = await slack.users.info({
      user: user_id,
    });
    
    if (response.ok && response.user) {
      return {
        id: response.user.id,
        name: response.user.name,
        realName: response.user.real_name,
        displayName: response.user.profile?.display_name || response.user.real_name || response.user.name,
        avatar: response.user.profile?.image_72,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Slack user info:', error);
    return null;
  }
}

/**
 * Gets all replies in a thread
 * @param channel_id - Channel ID where the thread is
 * @param thread_ts - Thread timestamp (parent message timestamp)
 * @param botToken - Optional bot token (will use env var if not provided)
 * @returns Promise resolving to the thread messages
 */
export async function getSlackThreadReplies(channel_id: string, thread_ts: string, botToken?: string) {
  const slack = getSlackClient(botToken);
  
  if (!slack) {
    console.warn('Slack is not configured. Cannot get thread replies.');
    return { messages: [] };
  }

  try {
    const response = await slack.conversations.replies({
      channel: channel_id,
      ts: thread_ts,
    });
    
    if (response.ok && response.messages) {
      // First message is the parent, rest are replies
      const allMessages = response.messages;
      const replies = allMessages.slice(1); // Skip first message (parent)
      
      return { 
        messages: replies
      };
    }
    
    return { messages: [] };
  } catch (error) {
    console.error('Error getting Slack thread replies:', error);
    return { messages: [] };
  }
}