import { useState } from "react";
import {
  useArAging,
  useCommissionReport,
  useShippingMargins,
  useLeadSourceReport,
} from "@/services/reports";
import type { LeadSourceReport } from "@/services/reports";

export type ArAgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export interface ArAgingInvoice {
  invoiceId: string;
  invoiceNumber: string;
  orderId: string | null;
  orderNumber: string | null;
  projectName: string | null;
  companyId: string | null;
  companyName: string | null;
  totalAmount: number;
  dueDate: string | null;
  status: string;
  daysPastDue: number;
  bucket: ArAgingBucket;
}

export interface ArAgingReport {
  buckets: Record<ArAgingBucket, { count: number; total: number }>;
  totalOutstanding: number;
  totalInvoices: number;
  invoices: ArAgingInvoice[];
}

export interface CommissionLineItem {
  orderId: string;
  orderNumber: string;
  projectName: string | null;
  companyName: string | null;
  total: number;
  margin: number;
  grossProfit: number;
  commissionAmount: number;
  paidAt: string | null;
}

export interface RepCommissionReport {
  userId: string;
  name: string;
  email: string | null;
  commissionPercent: number;
  totalRevenue: number;
  totalGrossProfit: number;
  totalCommission: number;
  orderCount: number;
  orders: CommissionLineItem[];
}

export interface CommissionReport {
  from: string;
  to: string;
  reps: RepCommissionReport[];
  grandTotalRevenue: number;
  grandTotalGrossProfit: number;
  grandTotalCommission: number;
}

export interface MarginCategory {
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
}

export interface ShippingMarginReport {
  period: string;
  fromDate: string;
  toDate: string;
  overall: MarginCategory;
  product: MarginCategory;
  shipping: MarginCategory;
  setup: MarginCategory;
  orderCount: number;
}

export function useReports() {
  const [commissionFrom, setCommissionFrom] = useState(() => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return d.toISOString().split("T")[0];
  });
  const [commissionTo, setCommissionTo] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [shippingMarginPeriod, setShippingMarginPeriod] = useState("all");

  const { data: arAging } = useArAging<ArAgingReport>();
  const { data: commissionReport, isLoading: commissionLoading } = useCommissionReport<
    CommissionReport
  >(commissionFrom, commissionTo);
  const { data: shippingMargins, isLoading: shippingMarginsLoading } =
    useShippingMargins<ShippingMarginReport>(shippingMarginPeriod);
  const { data: leadSourceReport, isLoading: leadSourceLoading } = useLeadSourceReport();

  return {
    arAging,
    commissionReport,
    commissionLoading,
    commissionFrom,
    setCommissionFrom,
    commissionTo,
    setCommissionTo,
    shippingMargins,
    shippingMarginsLoading,
    shippingMarginPeriod,
    setShippingMarginPeriod,
    leadSourceReport,
    leadSourceLoading,
  };
}
