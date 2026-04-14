import { useParams, useLocation } from "@/lib/wouter-compat";
import {
  useSupplier,
  useVendorProducts,
  useVendorContacts,
} from "@/services/suppliers";
import type { VendorContact } from "@/services/suppliers";
import { useTabParam } from "@/hooks/useTabParam";

export function useVendorDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useTabParam("overview");

  const vendorId = params.id;

  const { data: vendor, isLoading, error } = useSupplier(vendorId);

  const { data: vendorProducts, isLoading: isLoadingProducts } = useVendorProducts(
    vendorId,
    !!vendorId,
  );

  const { data: vendorContacts = [], isLoading: isLoadingContacts } = useVendorContacts(
    vendorId,
    !!vendorId,
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return {
    vendor,
    vendorId,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    vendorProducts,
    isLoadingProducts,
    vendorContacts,
    isLoadingContacts,
    getInitials,
    setLocation,
  };
}
