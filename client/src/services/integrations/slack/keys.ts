export const slackKeys = {
  all: ["slack"] as const,
  channels: ["/api/integrations/slack/channels"] as const,
  messages: ["/api/integrations/slack/messages"] as const,
  settings: ["/api/integrations/slack/settings"] as const,
  syncMessages: ["/api/slack/sync-messages"] as const,
};
