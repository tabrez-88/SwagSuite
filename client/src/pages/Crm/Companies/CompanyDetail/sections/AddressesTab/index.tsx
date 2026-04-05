import { CompanyAddressesManager } from "@/components/feature/CompanyAddressesManager";
import type { AddressesTabProps } from "./types";

export default function AddressesTab({ companyId, companyName }: AddressesTabProps) {
  return <CompanyAddressesManager companyId={companyId} companyName={companyName} />;
}
