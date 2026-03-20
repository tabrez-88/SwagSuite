import { type LucideIcon } from "lucide-react";

export interface IntegrationSettings {
  ssActivewearAccount: string;
  ssActivewearApiKey: string;
  sanmarCustomerId: string;
  sanmarUsername: string;
  sanmarPassword: string;
  hubspotApiKey: string;
  slackBotToken: string;
  slackChannelId: string;
  sageAcctId: string;
  sageLoginId: string;
  sageApiKey: string;
  geoapifyApiKey: string;
  quickbooksConnected: boolean;
  stripeConnected: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  taxjarApiKey: string;
  shipmateConnected: boolean;
}

export interface ShowFields {
  ssActivewearApiKey: boolean;
  sanmarPassword: boolean;
  slackBotToken: boolean;
  hubspotApiKey: boolean;
  sageApiKey: boolean;
  geoapifyApiKey: boolean;
  stripeSecretKey: boolean;
  taxjarApiKey: boolean;
}

export interface IntegrationField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

export interface CustomIntegrationType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: string;
  fields: IntegrationField[];
}

export interface ConfiguredIntegration {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: string;
  config: Record<string, string>;
  connectedAt: string;
}
