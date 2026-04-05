import { ContactsManager } from "@/components/feature/ContactsManager";
import type { ContactsTabProps } from "./types";

export default function ContactsTab({ companyId, companyName }: ContactsTabProps) {
  return <ContactsManager companyId={companyId} companyName={companyName} />;
}
