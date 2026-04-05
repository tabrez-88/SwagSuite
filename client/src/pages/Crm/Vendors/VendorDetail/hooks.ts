import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  useVendorProducts,
  useVendorContacts,
} from "@/services/suppliers";
import type { Vendor, VendorContact } from "@/services/suppliers";
import { useTabParam } from "@/hooks/useTabParam";

export function useVendorDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useTabParam("overview");

  const vendorId = params.id;

  const { data: vendor, isLoading, error } = useQuery<Vendor>({
    queryKey: [`/api/suppliers/${vendorId}`],
    enabled: !!vendorId,
  });

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
