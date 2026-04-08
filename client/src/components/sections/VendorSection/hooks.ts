import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { EmailComposerRef } from "@/components/email/EmailComposer";
import type { EmailContact, EmailFormData } from "@/components/email/types";
import type { ProjectData } from "@/types/project-types";

export function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export function useVendorSection(projectId: string, data: ProjectData) {
  const { order, orderVendors, vendorCommunications, orderItems } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const composerRef = useRef<EmailComposerRef>(null);

  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // Set first vendor as default
  useEffect(() => {
    if (orderVendors.length > 0 && !selectedVendor) {
      setSelectedVendor(orderVendors[0]);
    }
  }, [orderVendors, selectedVendor]);

  // Fetch vendor contacts
  const { data: vendorContacts = [] } = useQuery<any[]>({
    queryKey: [`/api/contacts`, { supplierId: selectedVendor?.id }],
    queryFn: async () => {
      if (!selectedVendor?.id) return [];
      const response = await fetch(`/api/contacts?supplierId=${selectedVendor.id}`, { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedVendor?.id,
  });

  const vendorContactsList: EmailContact[] = vendorContacts.map((c: any) => ({
    id: String(c.id),
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    email: c.email,
    isPrimary: c.isPrimary,
    title: c.title,
    receiveOrderEmails: c.receiveOrderEmails,
  }));

  const vendorPrimaryContact = vendorContacts.find((c: any) => c.isPrimary) || vendorContacts[0];

  // Reset composer when vendor changes
  useEffect(() => {
    if (selectedVendor) {
      const toName = vendorPrimaryContact
        ? `${vendorPrimaryContact.firstName || ""} ${vendorPrimaryContact.lastName || ""}`.trim() || selectedVendor.name
        : selectedVendor.name || "";
      composerRef.current?.reset({
        to: vendorPrimaryContact?.email || "",
        toName,
      });
    }
  }, [selectedVendor, vendorPrimaryContact]);

  const sendVendorEmailMutation = useMutation({
    mutationFn: async (formData: EmailFormData & { adHocEmails: string[] }) => {
      const userAttachments = formData.attachments?.length
        ? formData.attachments.map((att) => ({ fileUrl: att.cloudinaryUrl, fileName: att.fileName }))
        : undefined;

      const response = await fetch(`/api/projects/${order?.id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          communicationType: "vendor_email",
          direction: "sent",
          fromEmail: formData.from,
          fromName: formData.fromName,
          recipientEmail: formData.to,
          recipientName: formData.toName,
          subject: formData.subject,
          body: formData.body,
          cc: formData.cc || undefined,
          bcc: formData.bcc || undefined,
          metadata: { vendorId: selectedVendor?.id, vendorName: selectedVendor?.name },
          additionalAttachments: userAttachments,
        }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to send email");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/projects/${projectId}/communications`, { type: "vendor_email" }],
      });
      toast({ title: "Email sent", description: "Vendor email has been sent successfully." });
      composerRef.current?.reset({
        to: vendorPrimaryContact?.email || "",
        toName: vendorPrimaryContact
          ? `${vendorPrimaryContact.firstName || ""} ${vendorPrimaryContact.lastName || ""}`.trim()
          : selectedVendor?.name || "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Email templates
  const applyTemplate = (template: string) => {
    const orderNum = (order as any)?.orderNumber || "";
    const toName = vendorPrimaryContact
      ? `${vendorPrimaryContact.firstName || ""} ${vendorPrimaryContact.lastName || ""}`.trim() || selectedVendor?.name
      : selectedVendor?.name || "there";
    switch (template) {
      case "production":
        composerRef.current?.setField("subject", `Production Start Request - Order #${orderNum}`);
        composerRef.current?.setField("body", `<p>Hi ${toName},</p><p>We would like to start production on Order #${orderNum}. Please confirm the production timeline and expected ship date.</p><p>Thank you.</p>`);
        break;
      case "status":
        composerRef.current?.setField("subject", `Status Check - Order #${orderNum}`);
        composerRef.current?.setField("body", `<p>Hi ${toName},</p><p>Could you please provide an update on the status of Order #${orderNum}?</p><p>Thank you.</p>`);
        break;
      case "artwork":
        composerRef.current?.setField("subject", `Artwork - Order #${orderNum}`);
        composerRef.current?.setField("body", `<p>Hi ${toName},</p><p>Please find the artwork for Order #${orderNum} attached. Let us know if you need any revisions.</p><p>Thank you.</p>`);
        break;
      case "rush":
        composerRef.current?.setField("subject", `RUSH Request - Order #${orderNum}`);
        composerRef.current?.setField("body", `<p>Hi ${toName},</p><p>We need to rush Order #${orderNum}. Please confirm if you can accommodate expedited production and shipping.</p><p>Thank you.</p>`);
        break;
    }
  };

  // Get vendor products
  const vendorProducts = selectedVendor
    ? orderItems.filter((item: any) => item.supplierId === selectedVendor.id)
    : [];

  return {
    order,
    orderVendors,
    vendorCommunications,
    selectedVendor,
    setSelectedVendor,
    vendorContactsList,
    vendorPrimaryContact,
    composerRef,
    sendVendorEmailMutation,
    applyTemplate,
    vendorProducts,
  };
}
