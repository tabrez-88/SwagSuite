import { NewsletterSubscriber } from "@shared/schema";

export interface SubscriberWithExtras extends NewsletterSubscriber {
  listNames?: string[];
}
