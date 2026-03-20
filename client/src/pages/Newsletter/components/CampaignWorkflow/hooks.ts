import { useState, createElement } from "react";
import { CheckCircle, Clock, Zap, Edit, Pause, AlertCircle } from "lucide-react";
import type { Campaign, Automation } from "./types";

export function useCampaignWorkflow() {
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateAutomation, setShowCreateAutomation] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Mock data
  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "Weekly Product Update",
      subject: "New Promotional Products Available",
      status: "sent",
      type: "regular",
      sentAt: new Date("2025-01-02T10:00:00Z"),
      totalSent: 14500,
      opens: 3625,
      clicks: 465,
      openRate: 25.0,
      clickRate: 3.2,
      listName: "Main List"
    },
    {
      id: "2",
      name: "Holiday Sale Campaign",
      subject: "\u{1F389} 50% Off All Custom Apparel",
      status: "scheduled",
      type: "regular",
      scheduledAt: new Date("2025-01-10T09:00:00Z"),
      totalSent: 0,
      opens: 0,
      clicks: 0,
      openRate: 0,
      clickRate: 0,
      listName: "VIP Customers"
    },
    {
      id: "3",
      name: "A/B Test: Subject Lines",
      subject: "Which subject performs better?",
      status: "sending",
      type: "ab_test",
      totalSent: 5000,
      opens: 1200,
      clicks: 180,
      openRate: 24.0,
      clickRate: 3.6,
      listName: "Main List"
    }
  ];

  const automations: Automation[] = [
    {
      id: "1",
      name: "Welcome Series",
      description: "Onboard new subscribers with a 5-email welcome sequence",
      trigger: "signup",
      isActive: true,
      totalTriggered: 1250,
      emails: [
        { id: "1", subject: "Welcome to SwagSuite!", delay: { value: 0, unit: "minutes" }, opens: 1200, clicks: 180 },
        { id: "2", subject: "Getting Started Guide", delay: { value: 2, unit: "days" }, opens: 980, clicks: 145 },
        { id: "3", subject: "Popular Products", delay: { value: 5, unit: "days" }, opens: 850, clicks: 125 }
      ]
    },
    {
      id: "2",
      name: "Birthday Campaign",
      description: "Send birthday greetings with special offers",
      trigger: "birthday",
      isActive: true,
      totalTriggered: 340,
      emails: [
        { id: "1", subject: "\u{1F382} Happy Birthday! Special Gift Inside", delay: { value: 0, unit: "hours" }, opens: 280, clicks: 95 }
      ]
    },
    {
      id: "3",
      name: "Win-Back Series",
      description: "Re-engage inactive subscribers",
      trigger: "custom",
      isActive: false,
      totalTriggered: 0,
      emails: [
        { id: "1", subject: "We miss you! Come back for 20% off", delay: { value: 30, unit: "days" }, opens: 0, clicks: 0 },
        { id: "2", subject: "Last chance - 30% off before we say goodbye", delay: { value: 7, unit: "days" }, opens: 0, clicks: 0 }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "scheduled": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "sending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "draft": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "paused": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return createElement(CheckCircle, { className: "w-4 h-4" });
      case "scheduled": return createElement(Clock, { className: "w-4 h-4" });
      case "sending": return createElement(Zap, { className: "w-4 h-4" });
      case "draft": return createElement(Edit, { className: "w-4 h-4" });
      case "paused": return createElement(Pause, { className: "w-4 h-4" });
      default: return createElement(AlertCircle, { className: "w-4 h-4" });
    }
  };

  return {
    showCreateCampaign,
    setShowCreateCampaign,
    showCreateAutomation,
    setShowCreateAutomation,
    selectedDate,
    setSelectedDate,
    campaigns,
    automations,
    getStatusColor,
    getStatusIcon,
  };
}
