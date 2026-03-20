import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { DocumentsTabProps, DocumentEmailData } from "./types";

// Build a fingerprint string for items + order-level fields to detect changes
function buildItemsHash(items: any[], type: 'quote' | 'po', order?: any): string {
  const sorted = [...items].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
  const itemsData = sorted.map(i => ({
    id: i.id,
    qty: i.quantity,
    price: type === 'quote' ? i.unitPrice : (i.cost || i.unitPrice),
  }));
  const orderFields = order ? (type === 'quote'
    ? { notes: order.notes || '', additionalInfo: order.additionalInformation || '', ihd: order.inHandsDate || '', eventDate: order.eventDate || '' }
    : { notes: order.notes || '', supplierNotes: order.supplierNotes || '', supplierIhd: order.supplierInHandsDate || '' }
  ) : {};
  return JSON.stringify({ items: itemsData, ...orderFields });
}

export function useDocumentsTab({
  orderId,
  order,
  orderItems,
  orderVendors,
  companyName,
  primaryContact,
  getEditedItem,
  onSendEmail,
}: Omit<DocumentsTabProps, 'calculateItemTotals' | 'allArtworkItems'>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const quoteRef = useRef<HTMLDivElement>(null);
  const poRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoGenerateTriggered, setAutoGenerateTriggered] = useState(false);
  const [isDeleteDocDialogOpen, setIsDeleteDocDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [syncingDocIds, setSyncingDocIds] = useState<Set<string>>(new Set());
  const isSyncingRef = useRef(false);

  // Fetch generated documents
  const { data: documents = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/documents`],
    enabled: !!orderId,
  });

  // Fetch quote approvals for this order
  const { data: quoteApprovals = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/quote-approvals`],
    enabled: !!orderId,
  });

  // Create quote approval mutation
  const createQuoteApprovalMutation = useMutation({
    mutationFn: async (data: {
      clientEmail: string;
      clientName: string;
      documentId?: string;
      pdfPath?: string;
      quoteTotal?: string;
    }) => {
      const response = await fetch(`/api/orders/${orderId}/quote-approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create quote approval');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/orders/${orderId}/quote-approvals`]
      });
    },
  });

  // Generate PDF and upload
  const generateDocumentMutation = useMutation({
    mutationFn: async ({
      elementRef,
      documentType,
      documentNumber,
      vendorId,
      vendorName,
      itemsHash,
    }: {
      elementRef: HTMLDivElement | null;
      documentType: string;
      documentNumber: string;
      vendorId?: string;
      vendorName?: string;
      itemsHash?: string;
    }) => {
      if (!elementRef) throw new Error('Element not found');

      setIsGenerating(true);

      // Temporarily make element visible for capture
      const originalVisibility = elementRef.style.visibility;
      elementRef.style.visibility = 'visible';

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 200));

      // Create canvas from HTML element
      const canvas = await html2canvas(elementRef, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: false,
      });

      // Restore visibility
      elementRef.style.visibility = originalVisibility;

      // Validate canvas dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture document - canvas is empty');
      }

      // Create PDF - scale content to fit A4 page
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Scale down if content is taller than page
      if (imgHeight > pageHeight) {
        const scaleFactor = pageHeight / imgHeight;
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = pageHeight;
        const xOffset = (pageWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      // Convert PDF to Blob for upload
      const pdfBlob = pdf.output('blob');

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `${documentType}-${documentNumber}.pdf`);
      formData.append('documentType', documentType);
      formData.append('documentNumber', documentNumber);
      formData.append('vendorId', vendorId || '');
      formData.append('vendorName', vendorName || '');
      formData.append('status', 'draft');

      // Add metadata with items hash for change detection
      const metadata = {
        orderNumber: order?.orderNumber,
        itemCount: orderItems.length,
        generatedAt: new Date().toISOString(),
        itemsHash: itemsHash || '',
      };
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(`/api/orders/${orderId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/documents`] });
      setIsGenerating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Delete document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/documents`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Build current item hashes for change detection (includes order-level fields)
  const currentHashes = useMemo(() => {
    const quoteHash = buildItemsHash(orderItems, 'quote', order);
    const vendorHashes: Record<string, string> = {};
    for (const vendor of orderVendors) {
      const vendorItems = orderItems.filter((i: any) => i.supplierId === vendor.id);
      vendorHashes[vendor.id] = buildItemsHash(vendorItems, 'po', order);
    }
    return { quoteHash, vendorHashes };
  }, [orderItems, orderVendors, order]);

  // Detect which documents are stale and which vendors need new POs
  const { staleDocIds, staleDraftDocIds, newVendorIds } = useMemo(() => {
    const stale = new Set<string>();
    const staleDraft = new Set<string>();
    const newVendors: string[] = [];

    for (const doc of documents) {
      const storedHash = doc.metadata?.itemsHash;
      if (!storedHash) continue;

      if (doc.documentType === 'quote') {
        if (storedHash !== currentHashes.quoteHash) {
          stale.add(doc.id);
          if (doc.status === 'draft') staleDraft.add(doc.id);
        }
      } else if (doc.documentType === 'purchase_order' && doc.vendorId) {
        const currentVendorHash = currentHashes.vendorHashes[doc.vendorId];
        if (currentVendorHash && storedHash !== currentVendorHash) {
          stale.add(doc.id);
          if (doc.status === 'draft') staleDraft.add(doc.id);
        }
      }
    }

    // Detect new vendors that don't have a PO yet
    for (const vendor of orderVendors) {
      const hasDoc = documents.some(
        (d: any) => d.documentType === 'purchase_order' && d.vendorId === vendor.id
      );
      if (!hasDoc) newVendors.push(vendor.id);
    }

    return { staleDocIds: stale, staleDraftDocIds: staleDraft, newVendorIds: newVendors };
  }, [documents, currentHashes, orderVendors]);

  // Generate a single document (quote or PO for a specific vendor)
  const generateSingleDocument = useCallback(async (
    type: 'quote' | 'purchase_order',
    vendorId?: string
  ) => {
    if (type === 'quote') {
      if (!quoteRef.current) return;
      const hash = currentHashes.quoteHash;
      await generateDocumentMutation.mutateAsync({
        elementRef: quoteRef.current,
        documentType: 'quote',
        documentNumber: order?.orderNumber || 'DRAFT',
        itemsHash: hash,
      });
    } else if (vendorId) {
      const vendor = orderVendors.find((v: any) => v.id === vendorId);
      if (!vendor || !poRefs.current[vendorId]) return;
      const poNumber = `${order?.orderNumber}-${vendor.id.substring(0, 4).toUpperCase()}`;
      const hash = currentHashes.vendorHashes[vendorId];
      await generateDocumentMutation.mutateAsync({
        elementRef: poRefs.current[vendorId],
        documentType: 'purchase_order',
        documentNumber: poNumber,
        vendorId: vendor.id,
        vendorName: vendor.name,
        itemsHash: hash,
      });
    }
  }, [currentHashes, order, orderVendors, generateDocumentMutation]);

  // Initial auto-generate: only when no documents exist yet
  useEffect(() => {
    if (!autoGenerateTriggered && orderItems.length > 0 && documents.length === 0 && !isGenerating) {
      const timer = setTimeout(() => {
        handleAutoGenerate();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [orderItems.length, documents.length, autoGenerateTriggered, isGenerating]);

  // Smart sync: auto-regenerate stale draft docs and generate POs for new vendors
  useEffect(() => {
    if (isGenerating || documents.length === 0 || isSyncingRef.current) return;

    const docsToSync = Array.from(staleDraftDocIds);
    const vendorsToGenerate = Array.from(newVendorIds);

    if (docsToSync.length === 0 && vendorsToGenerate.length === 0) return;

    const syncTimeout = setTimeout(async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      setSyncingDocIds(new Set([...docsToSync, ...vendorsToGenerate]));

      try {
        // Regenerate stale draft documents
        for (const docId of docsToSync) {
          const doc = documents.find((d: any) => d.id === docId);
          if (!doc) continue;

          await deleteDocumentMutation.mutateAsync(docId);
          await new Promise(resolve => setTimeout(resolve, 300));

          if (doc.documentType === 'quote') {
            await generateSingleDocument('quote');
          } else if (doc.documentType === 'purchase_order' && doc.vendorId) {
            await generateSingleDocument('purchase_order', doc.vendorId);
          }
        }

        // Generate POs for new vendors
        for (const vendorId of vendorsToGenerate) {
          await new Promise(resolve => setTimeout(resolve, 300));
          await generateSingleDocument('purchase_order', vendorId);
        }

        if (docsToSync.length > 0 || vendorsToGenerate.length > 0) {
          toast({
            title: "Documents Synced",
            description: `Updated ${docsToSync.length} document(s)${vendorsToGenerate.length > 0 ? `, generated ${vendorsToGenerate.length} new PO(s)` : ''}`,
          });
        }
      } finally {
        setSyncingDocIds(new Set());
        isSyncingRef.current = false;
      }
    }, 1500);

    return () => clearTimeout(syncTimeout);
  }, [staleDraftDocIds.size, newVendorIds.length]);

  const handleAutoGenerate = async () => {
    if (isGenerating || autoGenerateTriggered) return;
    setAutoGenerateTriggered(true);

    // Generate Quote first
    if (quoteRef.current) {
      await generateDocumentMutation.mutateAsync({
        elementRef: quoteRef.current,
        documentType: 'quote',
        documentNumber: order?.orderNumber || 'DRAFT',
        itemsHash: currentHashes.quoteHash,
      });
    }

    // Generate POs for each vendor
    for (const vendor of orderVendors) {
      const poNumber = `${order?.orderNumber}-${vendor.id.substring(0, 4).toUpperCase()}`;
      if (poRefs.current[vendor.id]) {
        await generateDocumentMutation.mutateAsync({
          elementRef: poRefs.current[vendor.id],
          documentType: 'purchase_order',
          documentNumber: poNumber,
          vendorId: vendor.id,
          vendorName: vendor.name,
          itemsHash: currentHashes.vendorHashes[vendor.id],
        });
      }
    }

    toast({
      title: "Documents Generated",
      description: `Generated Quote and ${orderVendors.length} Purchase Order(s)`,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle email click - auto-fill and switch to communication tab
  const handleEmailClick = async (doc: any) => {
    if (!onSendEmail) return;

    const isQuote = doc.documentType === 'quote';

    if (isQuote) {
      let approvalUrl = '';
      const existingApproval = quoteApprovals.find((a: any) => a.status === 'pending');

      if (existingApproval) {
        approvalUrl = `${window.location.origin}/client-approval/${existingApproval.approvalToken}`;
      } else {
        try {
          const clientName = primaryContact
            ? `${primaryContact.firstName} ${primaryContact.lastName}`
            : companyName;
          const result = await createQuoteApprovalMutation.mutateAsync({
            clientEmail: primaryContact?.email || '',
            clientName: clientName || '',
            documentId: doc.id,
            pdfPath: doc.fileUrl,
            quoteTotal: order?.total,
          });
          if (result?.approvalToken) {
            approvalUrl = `${window.location.origin}/client-approval/${result.approvalToken}`;
          }
        } catch (err) {
          console.error('Failed to create quote approval:', err);
        }
      }

      onSendEmail({
        type: 'client',
        document: doc,
        to: primaryContact?.email || "",
        toName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName,
        subject: `Quote #${doc.documentNumber} - ${companyName || 'Your Order'} - Action Required`,
        updateStatusOnSend: (order?.quoteStatus === 'draft' || order?.quoteStatus === 'sent' || order?.presentationStatus === 'open' || order?.presentationStatus === 'client_review') ? 'pending_approval' : undefined,
        body: `Dear ${primaryContact?.firstName || 'Customer'},

Please find attached the quote for your order #${order?.orderNumber}.

Quote Details:
- Quote Number: ${doc.documentNumber}
- Date: ${format(new Date(), 'MMMM dd, yyyy')}
${order?.inHandsDate ? `- In-Hands Date: ${format(new Date(order.inHandsDate), 'MMMM dd, yyyy')}` : ''}
${(order as any)?.eventDate ? `- Event Date: ${format(new Date((order as any).eventDate), 'MMMM dd, yyyy')}` : ''}
${approvalUrl ? `\n✅ Review & Approve Quote: ${approvalUrl}\nClick the link above to review your quote and approve or request changes.\n` : ''}
Please let us know if you have any questions.

Thank you for your business!

Best regards,
SwagSuite Team`,
      });
    } else {
      const vendor = orderVendors.find((v: any) => v.id === doc.vendorId);

      onSendEmail({
        type: 'vendor',
        document: doc,
        to: vendor?.email || "",
        toName: vendor?.name || doc.vendorName || "",
        subject: `Purchase Order #${doc.documentNumber} - ${vendor?.name || 'Order Request'}`,
        body: `Hello ${vendor?.contactPerson || vendor?.name || 'Team'},

Please find attached Purchase Order #${doc.documentNumber}.

PO Details:
- PO Number: ${doc.documentNumber}
- Date: ${format(new Date(), 'MMMM dd, yyyy')}
${(order as any)?.supplierInHandsDate ? `- Required Ship Date: ${format(new Date((order as any).supplierInHandsDate), 'MMMM dd, yyyy')}` : ''}
${(order as any)?.supplierNotes ? `\nSupplier Notes:\n${(order as any).supplierNotes}\n` : ''}
Please confirm receipt of this order and provide the following:
1. Order acknowledgment
2. Expected production timeline
3. Tracking information when shipped

Thank you for your partnership!

Best regards,
SwagSuite Team`,
        vendorId: doc.vendorId,
      });
    }
  };

  const handleApprovalLinkClick = async (doc: any) => {
    const existingApproval = quoteApprovals.find((a: any) => a.status === 'pending');
    if (existingApproval) {
      const approvalUrl = `${window.location.origin}/client-approval/${existingApproval.approvalToken}`;
      navigator.clipboard.writeText(approvalUrl);
      toast({
        title: "Approval Link Copied",
        description: "The existing approval link has been copied to clipboard.",
      });
      return;
    }

    try {
      const result = await createQuoteApprovalMutation.mutateAsync({
        clientEmail: primaryContact?.email || '',
        clientName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName,
        documentId: doc.id,
        pdfPath: doc.fileUrl,
        quoteTotal: order?.total,
      });

      const approvalUrl = `${window.location.origin}/client-approval/${result.approvalToken}`;
      navigator.clipboard.writeText(approvalUrl);
      toast({
        title: "Approval Link Generated",
        description: "The approval link has been copied to clipboard. You can preview or share it with your client.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate approval link",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDoc = (doc: any) => {
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      let fileName = doc.fileName || `${doc.documentType}-${doc.documentNumber}`;
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName = fileName.replace(/\.[^/.]+$/, '') + '.pdf';
      }
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: "Error",
        description: "PDF file not available",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocClick = (doc: any) => {
    setDocToDelete(doc);
    setIsDeleteDocDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (docToDelete) {
      deleteDocumentMutation.mutate(docToDelete.id);
    }
    setDocToDelete(null);
    setIsDeleteDocDialogOpen(false);
  };

  return {
    quoteRef,
    poRefs,
    previewDocument,
    setPreviewDocument,
    isGenerating,
    isDeleteDocDialogOpen,
    setIsDeleteDocDialogOpen,
    docToDelete,
    setDocToDelete,
    syncingDocIds,
    documents,
    quoteApprovals,
    createQuoteApprovalMutation,
    deleteDocumentMutation,
    staleDocIds,
    handleAutoGenerate,
    formatFileSize,
    handleEmailClick,
    handleApprovalLinkClick,
    handleDownloadDoc,
    handleDeleteDocClick,
    handleConfirmDelete,
  };
}
