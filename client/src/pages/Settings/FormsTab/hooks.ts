import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { FormFields } from "./types";

export function useFormsTab() {
  const { toast } = useToast();

  const [formFields, setFormFields] = useState<FormFields>({
    salesOrders: [
      { id: "customer", label: "Customer", type: "text", required: true, enabled: true },
      { id: "orderDate", label: "Order Date", type: "date", required: true, enabled: true },
      { id: "dueDate", label: "Due Date", type: "date", required: true, enabled: true },
      { id: "total", label: "Total Amount", type: "number", required: true, enabled: true },
      { id: "notes", label: "Notes", type: "textarea", required: false, enabled: true },
      { id: "priority", label: "Priority", type: "select", required: false, enabled: false },
      { id: "salesRep", label: "Sales Rep", type: "text", required: false, enabled: true },
    ],
    purchaseOrders: [
      { id: "supplier", label: "Supplier", type: "text", required: true, enabled: true },
      { id: "orderDate", label: "Order Date", type: "date", required: true, enabled: true },
      { id: "expectedDate", label: "Expected Delivery", type: "date", required: true, enabled: true },
      { id: "total", label: "Total Amount", type: "number", required: true, enabled: true },
      { id: "terms", label: "Payment Terms", type: "text", required: false, enabled: true },
      { id: "shipping", label: "Shipping Method", type: "select", required: false, enabled: false },
    ],
  });

  const toggleFormField = (formType: keyof FormFields, fieldId: string) => {
    setFormFields((prev) => ({
      ...prev,
      [formType]: prev[formType].map((field) =>
        field.id === fieldId ? { ...field, enabled: !field.enabled } : field,
      ),
    }));
  };

  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Form Fields settings have been saved successfully.",
    });
  };

  return {
    formFields,
    toggleFormField,
    saveSettings,
  };
}
