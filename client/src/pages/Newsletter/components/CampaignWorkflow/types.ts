export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused";
  type: "regular" | "automation" | "ab_test";
  scheduledAt?: Date;
  sentAt?: Date;
  totalSent: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  listName: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: "signup" | "birthday" | "purchase" | "custom";
  isActive: boolean;
  totalTriggered: number;
  emails: AutomationEmail[];
}

export interface AutomationEmail {
  id: string;
  subject: string;
  delay: { value: number; unit: "minutes" | "hours" | "days" };
  opens: number;
  clicks: number;
}
