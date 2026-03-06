import type { ProjectData } from "@/types/project-types";
import { STAGE_ORDER, type BusinessStage } from "@/lib/businessStages";

export interface SectionLockStatus {
  isLocked: boolean;
  reason: string;
  canUnlock: boolean;
  isOverridden: boolean;
}

export interface LockStatus {
  quote: SectionLockStatus;
  salesOrder: SectionLockStatus;
  invoice: SectionLockStatus;
  shipping: SectionLockStatus;
  pos: SectionLockStatus;
}

const UNLOCKED: SectionLockStatus = {
  isLocked: false,
  reason: "",
  canUnlock: false,
  isOverridden: false,
};

function defaultUnlocked(): LockStatus {
  return {
    quote: { ...UNLOCKED },
    salesOrder: { ...UNLOCKED },
    invoice: { ...UNLOCKED },
    shipping: { ...UNLOCKED },
    pos: { ...UNLOCKED },
  };
}

export function useLockStatus(data: ProjectData): LockStatus {
  const { order, invoice, businessStage } = data;

  if (!order) return defaultUnlocked();

  const stageData = (order as any)?.stageData || {};
  const unlocks = stageData.unlocks || {};
  const currentStageId = businessStage?.stage.id;
  const currentStageIndex = currentStageId
    ? STAGE_ORDER.indexOf(currentStageId)
    : -1;
  const salesOrderStageIndex = STAGE_ORDER.indexOf("sales_order");

  // Quote: locked when project has advanced beyond quote stage
  const quoteNaturallyLocked = currentStageIndex >= salesOrderStageIndex;
  const quoteOverridden = !!unlocks.quote;
  const quoteLocked = quoteNaturallyLocked && !quoteOverridden;

  // Sales Order: locked when salesOrderStatus is "ready_to_invoice"
  const soStatus = (order as any)?.salesOrderStatus;
  const soNaturallyLocked = soStatus === "ready_to_invoice";
  const soOverridden = !!unlocks.salesOrder;
  const soLocked = soNaturallyLocked && !soOverridden;

  // Invoice: locked when invoice status is "paid"
  const invoiceNaturallyLocked = invoice?.status === "paid";
  const invoiceOverridden = !!unlocks.invoice;
  const invoiceLocked = invoiceNaturallyLocked && !invoiceOverridden;

  return {
    quote: {
      isLocked: quoteLocked,
      reason: quoteLocked
        ? "Quote is locked because the project has advanced to Sales Order stage"
        : "",
      canUnlock: quoteNaturallyLocked,
      isOverridden: quoteOverridden,
    },
    salesOrder: {
      isLocked: soLocked,
      reason: soLocked
        ? "Sales Order is locked because it has been sent for invoicing"
        : "",
      canUnlock: soNaturallyLocked,
      isOverridden: soOverridden,
    },
    invoice: {
      isLocked: invoiceLocked,
      reason: invoiceLocked
        ? "Invoice is locked because payment has been received"
        : "",
      canUnlock: invoiceNaturallyLocked,
      isOverridden: invoiceOverridden,
    },
    shipping: {
      isLocked: soLocked,
      reason: soLocked
        ? "Shipping is locked because the Sales Order has been invoiced"
        : "",
      canUnlock: soNaturallyLocked,
      isOverridden: soOverridden,
    },
    pos: {
      isLocked: soLocked,
      reason: soLocked
        ? "Purchase Orders are locked because the Sales Order has been invoiced"
        : "",
      canUnlock: soNaturallyLocked,
      isOverridden: soOverridden,
    },
  };
}
