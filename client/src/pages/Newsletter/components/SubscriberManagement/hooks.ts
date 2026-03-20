import { useState } from "react";
import { NewsletterList } from "@shared/schema";
import type { SubscriberWithExtras } from "./types";

export function useSubscriberManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [showAddSubscriber, setShowAddSubscriber] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Mock data for development
  const mockSubscribers: SubscriberWithExtras[] = [
    {
      id: "1",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      status: "active",
      source: "website",
      tags: ["vip", "customer"],
      customFields: { company: "ABC Corp", industry: "Tech" },
      subscriptionDate: new Date("2024-12-01"),
      unsubscribeDate: null,
      lastEmailSent: new Date("2025-01-01"),
      engagementScore: 85,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2025-01-01"),
      listNames: ["Main List", "VIP Customers"]
    },
    {
      id: "2",
      email: "jane.smith@example.com",
      firstName: "Jane",
      lastName: "Smith",
      status: "active",
      source: "import",
      tags: ["customer"],
      customFields: { company: "XYZ Inc", industry: "Manufacturing" },
      subscriptionDate: new Date("2024-11-15"),
      unsubscribeDate: null,
      lastEmailSent: new Date("2024-12-28"),
      engagementScore: 72,
      createdAt: new Date("2024-11-15"),
      updatedAt: new Date("2024-12-28"),
      listNames: ["Main List"]
    },
    {
      id: "3",
      email: "bob.wilson@example.com",
      firstName: "Bob",
      lastName: "Wilson",
      status: "unsubscribed",
      source: "form",
      tags: [],
      customFields: {},
      subscriptionDate: new Date("2024-10-20"),
      unsubscribeDate: new Date("2024-12-15"),
      lastEmailSent: new Date("2024-12-10"),
      engagementScore: 45,
      createdAt: new Date("2024-10-20"),
      updatedAt: new Date("2024-12-15"),
      listNames: ["Main List"]
    }
  ];

  const mockLists: NewsletterList[] = [
    {
      id: "1",
      name: "Main List",
      description: "Primary subscriber list for all marketing campaigns",
      subscriberCount: 15420,
      segmentRules: null,
      createdBy: "user-1",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2025-01-01")
    },
    {
      id: "2",
      name: "VIP Customers",
      description: "High-value customers with special offers",
      subscriberCount: 1250,
      segmentRules: { minEngagementScore: 80, tags: ["vip"] },
      createdBy: "user-1",
      createdAt: new Date("2024-06-01"),
      updatedAt: new Date("2024-12-01")
    },
    {
      id: "3",
      name: "New Subscribers",
      description: "Recently joined subscribers for welcome series",
      subscriberCount: 340,
      segmentRules: { daysSubscribed: { max: 30 } },
      createdBy: "user-1",
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2025-01-01")
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "unsubscribed": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "bounced": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSubscribers = mockSubscribers.filter(subscriber => {
    const matchesSearch = !searchTerm ||
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${subscriber.firstName} ${subscriber.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || subscriber.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleSelectSubscriber = (subscriberId: string) => {
    setSelectedSubscribers(prev =>
      prev.includes(subscriberId)
        ? prev.filter(id => id !== subscriberId)
        : [...prev, subscriberId]
    );
  };

  const handleSelectAll = () => {
    setSelectedSubscribers(
      selectedSubscribers.length === filteredSubscribers.length
        ? []
        : filteredSubscribers.map(s => s.id)
    );
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedSubscribers,
    showAddSubscriber,
    setShowAddSubscriber,
    showCreateList,
    setShowCreateList,
    showImportDialog,
    setShowImportDialog,
    mockLists,
    getStatusColor,
    filteredSubscribers,
    handleSelectSubscriber,
    handleSelectAll,
  };
}
