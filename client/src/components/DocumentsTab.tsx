import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  Package,
  RefreshCw,
  ShoppingCart,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DocumentEditor } from "./DocumentEditor";

interface DocumentEmailData {
  type: 'client' | 'vendor';
  document: any;
  to: string;
  toName: string;
  subject: string;
  body: string;
  vendorId?: string;
}

interface DocumentsTabProps {
  orderId: string;
  order: any;
  orderItems: any[];
  orderVendors: any[];
  companyName: string;
  primaryContact: any;
  getEditedItem: (id: string, item: any) => any;
  calculateItemTotals: (item: any) => any;
  onSendEmail?: (data: DocumentEmailData) => void;
}

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

export function DocumentsTab({
  orderId,
  order,
  orderItems,
  orderVendors,
  companyName,
  primaryContact,
  getEditedItem,
  calculateItemTotals,
  onSendEmail,
}: DocumentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const quoteRef = useRef<HTMLDivElement>(null);
  const poRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoGenerateTriggered, setAutoGenerateTriggered] = useState(false);
  const [syncingDocIds, setSyncingDocIds] = useState<Set<string>>(new Set());

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

      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
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
      if (!storedHash) continue; // Old docs without hash — skip (don't auto-regenerate)

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
    if (isGenerating || documents.length === 0) return;

    const docsToSync = Array.from(staleDraftDocIds);
    const vendorsToGenerate = Array.from(newVendorIds);

    if (docsToSync.length === 0 && vendorsToGenerate.length === 0) return;

    const syncTimeout = setTimeout(async () => {
      // Mark syncing docs
      setSyncingDocIds(new Set([...docsToSync, ...vendorsToGenerate]));

      try {
        // Regenerate stale draft documents
        for (const docId of docsToSync) {
          const doc = documents.find((d: any) => d.id === docId);
          if (!doc) continue;

          // Delete old document
          await deleteDocumentMutation.mutateAsync(docId);

          // Wait for refs to be ready after delete
          await new Promise(resolve => setTimeout(resolve, 300));

          // Regenerate
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
  const handleEmailClick = (doc: any) => {
    if (!onSendEmail) return;

    const isQuote = doc.documentType === 'quote';

    if (isQuote) {
      // Check for existing pending quote approval
      const existingApproval = quoteApprovals.find((a: any) => a.status === 'pending');
      let approvalUrl = '';

      if (existingApproval) {
        approvalUrl = `${window.location.origin}/quote-approval/${existingApproval.approvalToken}`;
      }

      onSendEmail({
        type: 'client',
        document: doc,
        to: primaryContact?.email || "",
        toName: primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : companyName,
        subject: `Quote #${doc.documentNumber} - ${companyName || 'Your Order'} - Action Required`,
        body: `Dear ${primaryContact?.firstName || 'Customer'},

Please find attached the quote for your order #${order?.orderNumber}.

Quote Details:
- Quote Number: ${doc.documentNumber}
- Date: ${format(new Date(), 'MMMM dd, yyyy')}
${order?.inHandsDate ? `- In-Hands Date: ${format(new Date(order.inHandsDate), 'MMMM dd, yyyy')}` : ''}
${(order as any)?.eventDate ? `- Event Date: ${format(new Date((order as any).eventDate), 'MMMM dd, yyyy')}` : ''}

📎 View Quote PDF: ${doc.fileUrl || '[Document Link]'}
${approvalUrl ? `\n✅ APPROVE OR REQUEST CHANGES: ${approvalUrl}\nClick the link above to review and approve this quote online.\n` : '\n[Approval link will be generated when you send this email]\n'}
Please review and let us know if you have any questions or would like to proceed with this order.

Thank you for your business!

Best regards,
SwagSuite Team`,
      });
    } else {
      // Pre-fill for vendor (Purchase Order)
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
You can view and download the PO using the link below:
${doc.fileUrl || '[Document Link]'}

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

  return (
    <div className="space-y-6">
      {/* Auto-generate / syncing status */}
      {(isGenerating || syncingDocIds.size > 0) && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <p className="font-medium text-blue-900">
              {syncingDocIds.size > 0 ? 'Syncing Documents...' : 'Generating Documents...'}
            </p>
            <p className="text-sm text-blue-700">
              {syncingDocIds.size > 0
                ? 'Updating documents to reflect latest changes'
                : 'Creating Quote and Purchase Orders automatically'}
            </p>
          </div>
        </div>
      )}

      {/* Generated Documents List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Generated Documents
            </CardTitle>
            <CardDescription>
              Documents are auto-generated and synced when order items change
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 && !isGenerating ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              {orderItems.length === 0 ? (
                <>
                  <p>No order items yet</p>
                  <p className="text-sm">Add products to this order to generate documents</p>
                </>
              ) : (
                <>
                  <p>Documents will be generated automatically...</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleAutoGenerate}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Now
                  </Button>
                </>
              )}
            </div>
          ) : documents.length === 0 && isGenerating ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 text-blue-400 animate-spin" />
              <p>Generating documents...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => {
                const isStale = staleDocIds.has(doc.id);
                const isProtected = doc.status === 'approved' || doc.status === 'sent';
                const isSyncing = syncingDocIds.has(doc.id);

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isSyncing ? 'bg-blue-50 border-blue-200' :
                      isStale && isProtected ? 'bg-amber-50 border-amber-200' :
                      'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${
                        isSyncing ? 'bg-blue-100' :
                        doc.documentType === 'quote' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {isSyncing ? (
                          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : doc.documentType === 'quote' ? (
                          <FileText className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {doc.documentType === 'quote' ? 'Quote' : 'Purchase Order'} #{doc.documentNumber}
                        </p>
                        {doc.vendorName && (
                          <p className="text-sm text-gray-600">Vendor: {doc.vendorName}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                          </span>
                          {doc.fileSize && (
                            <span className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              doc.status === 'approved' ? 'border-green-500 text-green-600 bg-green-50' :
                              doc.status === 'sent' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                              doc.status === 'paid' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' :
                              doc.status === 'cancelled' ? 'border-red-500 text-red-600 bg-red-50' :
                              'border-gray-400 text-gray-500'
                            }`}
                          >
                            {doc.status}
                          </Badge>
                          {/* Warning badge for stale protected documents */}
                          {isStale && isProtected && (
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-500 text-amber-600 bg-amber-50 flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Items changed since {doc.status}
                            </Badge>
                          )}
                          {isSyncing && (
                            <Badge
                              variant="outline"
                              className="text-xs border-blue-500 text-blue-600 bg-blue-50"
                            >
                              Syncing...
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Generate Approval Link for Quotes */}
                      {doc.documentType === 'quote' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Check for existing pending approval
                            const existingApproval = quoteApprovals.find((a: any) => a.status === 'pending');
                            if (existingApproval) {
                              const approvalUrl = `${window.location.origin}/quote-approval/${existingApproval.approvalToken}`;
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

                              const approvalUrl = `${window.location.origin}/quote-approval/${result.approvalToken}`;
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
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          disabled={createQuoteApprovalMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {quoteApprovals.find((a: any) => a.status === 'pending') ? 'Copy Approval Link' : 'Get Approval Link'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmailClick(doc)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        {doc.documentType === 'quote' ? 'Email Client' : 'Email Vendor'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDocument(doc)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Download using Cloudinary URL
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
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden off-screen quote template for PDF generation */}
      <div ref={quoteRef} style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden' }}>
            <div className="p-8 bg-white" style={{ width: '794px', minHeight: '1123px' }}>
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
                <div>
                  <h1 className="text-4xl font-bold text-blue-600 mb-2">QUOTE</h1>
                  <p className="text-sm text-gray-700">Quote #{order?.orderNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-700">Date: {order?.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}</p>
                  {order?.inHandsDate && (
                    <p className="text-sm text-gray-700">In-Hands Date: {format(new Date(order.inHandsDate), 'MMMM dd, yyyy')}</p>
                  )}
                  {(order as any)?.eventDate && (
                    <p className="text-sm text-gray-700">Event Date: {format(new Date((order as any).eventDate), 'MMMM dd, yyyy')}</p>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold mb-1">SwagSuite</h2>
                  <p className="text-sm text-gray-600">Your Promotional Products Partner</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-800 mb-2">BILL TO:</h3>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold">{companyName || 'N/A'}</p>
                  {primaryContact && (
                    <p>{primaryContact.firstName} {primaryContact.lastName}</p>
                  )}
                  {primaryContact?.email && <p>{primaryContact.email}</p>}
                  {primaryContact?.phone && <p>{primaryContact.phone}</p>}
                </div>
              </div>

              {(order as any)?.shippingAddress && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">SHIP TO:</h3>
                  <div className="text-sm text-gray-700">
                    {(order as any).shippingContactName && <p className="font-semibold">{(order as any).shippingContactName}</p>}
                    {(order as any).shippingCompanyName && <p>{(order as any).shippingCompanyName}</p>}
                    <p>{(order as any).shippingAddress}</p>
                    {(order as any).shippingAddress2 && <p>{(order as any).shippingAddress2}</p>}
                    <p>{(order as any).shippingCity}, {(order as any).shippingState} {(order as any).shippingZip}</p>
                  </div>
                </div>
              )}

              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 text-sm font-bold">Item</th>
                    <th className="text-center py-2 text-sm font-bold">Quantity</th>
                    <th className="text-right py-2 text-sm font-bold">Unit Price</th>
                    <th className="text-right py-2 text-sm font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item: any) => {
                    const editedItem = getEditedItem(item.id, item);
                    const unitPrice = parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                    const quantity = editedItem.quantity || item.quantity || 0;
                    const itemTotal = unitPrice * quantity;

                    return (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-2 text-sm">
                          <div className="font-medium">{item.productName}</div>
                          {item.productSku && <div className="text-xs text-gray-500">SKU: {item.productSku}</div>}
                          {(item.color || item.size) && (
                            <div className="text-xs text-gray-500">
                              {item.color && <span>Color: {item.color}</span>}
                              {item.color && item.size && <span> | </span>}
                              {item.size && <span>Size: {item.size}</span>}
                            </div>
                          )}
                        </td>
                        <td className="py-2 text-center text-sm">{quantity}</td>
                        <td className="py-2 text-right text-sm">${unitPrice.toFixed(2)}</td>
                        <td className="py-2 text-right text-sm font-medium">${itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end mb-6">
                <div className="w-64">
                  <div className="flex justify-between py-1 text-sm">
                    <span>Subtotal:</span>
                    <span>${orderItems.reduce((sum: number, item: any) => {
                      const editedItem = getEditedItem(item.id, item);
                      const unitPrice = parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                      const quantity = editedItem.quantity || item.quantity || 0;
                      return sum + (unitPrice * quantity);
                    }, 0).toFixed(2)}</span>
                  </div>
                  {order?.shippingCost && parseFloat(order.shippingCost) > 0 && (
                    <div className="flex justify-between py-1 text-sm">
                      <span>Shipping:</span>
                      <span>${parseFloat(order.shippingCost).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300 mt-2">
                    <span>Total:</span>
                    <span>${(() => {
                      const subtotal = orderItems.reduce((sum: number, item: any) => {
                        const editedItem = getEditedItem(item.id, item);
                        const unitPrice = parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                        const quantity = editedItem.quantity || item.quantity || 0;
                        return sum + (unitPrice * quantity);
                      }, 0);
                      const shipping = parseFloat(order?.shippingCost) || 0;
                      return (subtotal + shipping).toFixed(2);
                    })()}</span>
                  </div>
                </div>
              </div>

              {(order?.notes || (order as any)?.additionalInformation) && (
                <div className="mb-6 pt-4 border-t">
                  {order?.notes && (
                    <>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">NOTES:</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{order.notes}</p>
                    </>
                  )}
                  {(order as any)?.additionalInformation && (
                    <>
                      <h3 className="text-sm font-bold text-gray-800 mb-2">ADDITIONAL INFORMATION:</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{(order as any).additionalInformation}</p>
                    </>
                  )}
                </div>
              )}

              <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                <p>Thank you for your business!</p>
                <p className="mt-1">This quote is valid for 30 days from the date issued.</p>
              </div>
            </div>
          </div>

      {/* Hidden PO templates for PDF generation */}
      {orderVendors.map((vendor: any) => {
        const poNumber = `${order?.orderNumber}-${vendor.id.substring(0, 4).toUpperCase()}`;

        return (
          <Card key={vendor.id} style={{ position: 'absolute', left: '-9999px', top: 0, visibility: 'hidden' }}>
            <CardContent>
              <div ref={(el) => { poRefs.current[vendor.id] = el; }}>
                <div className="p-8 bg-white" style={{ width: '794px', minHeight: '1123px' }}>
                  <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
                    <div>
                      <h1 className="text-4xl font-bold text-green-600 mb-2">PURCHASE ORDER</h1>
                      <p className="text-sm text-gray-700">PO #{poNumber}</p>
                      <p className="text-sm text-gray-700">Date: {order?.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : 'N/A'}</p>
                      {(order as any)?.supplierInHandsDate && (
                        <p className="text-sm font-bold text-red-600">Required by: {format(new Date((order as any).supplierInHandsDate), 'MMMM dd, yyyy')}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold mb-1">SwagSuite</h2>
                      <p className="text-sm text-gray-600">Purchaser</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">VENDOR:</h3>
                    <div className="text-sm text-gray-700">
                      <p className="font-bold text-lg">{vendor.name}</p>
                      {vendor.email && <p>Email: {vendor.email}</p>}
                      {vendor.phone && <p>Phone: {vendor.phone}</p>}
                    </div>
                  </div>

                  {(order as any)?.shippingAddress && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-800 mb-2">SHIP TO:</h3>
                      <div className="text-sm text-gray-700">
                        {(order as any).shippingContactName && <p className="font-semibold">{(order as any).shippingContactName}</p>}
                        {(order as any).shippingCompanyName && <p>{(order as any).shippingCompanyName}</p>}
                        <p>{(order as any).shippingAddress}</p>
                        {(order as any).shippingAddress2 && <p>{(order as any).shippingAddress2}</p>}
                        <p>{(order as any).shippingCity}, {(order as any).shippingState} {(order as any).shippingZip}</p>
                      </div>
                    </div>
                  )}

                  <table className="w-full mb-6">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2 text-sm font-bold">Item</th>
                        <th className="text-center py-2 text-sm font-bold">Quantity</th>
                        <th className="text-right py-2 text-sm font-bold">Unit Cost</th>
                        <th className="text-right py-2 text-sm font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.products.map((product: any) => {
                        const item = orderItems.find((i: any) => i.id === product.id);
                        if (!item) return null;
                        const editedItem = getEditedItem(item.id, item);
                        const cost = parseFloat(editedItem.cost) || parseFloat(item.cost) || parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                        const quantity = editedItem.quantity || item.quantity || 0;
                        const itemTotal = cost * quantity;
                        return (
                          <tr key={product.id} className="border-b border-gray-200">
                            <td className="py-2 text-sm">
                              <div className="font-medium">{product.productName}</div>
                              {product.productSku && <div className="text-xs text-gray-500">SKU: {product.productSku}</div>}
                              {(product.color || product.size) && (
                                <div className="text-xs text-gray-500">
                                  {product.color && <span>Color: {product.color}</span>}
                                  {product.color && product.size && <span> | </span>}
                                  {product.size && <span>Size: {product.size}</span>}
                                </div>
                              )}
                            </td>
                            <td className="py-2 text-center text-sm">{quantity}</td>
                            <td className="py-2 text-right text-sm">${cost.toFixed(2)}</td>
                            <td className="py-2 text-right text-sm font-medium">${itemTotal.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="flex justify-end mb-6">
                    <div className="w-64">
                      <div className="flex justify-between py-2 text-lg font-bold border-t-2 border-gray-300">
                        <span>Total Cost:</span>
                        <span>${vendor.products.reduce((sum: number, product: any) => {
                          const item = orderItems.find((i: any) => i.id === product.id);
                          if (!item) return sum;
                          const editedItem = getEditedItem(item.id, item);
                          const cost = parseFloat(editedItem.cost) || parseFloat(item.cost) || parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0;
                          const quantity = editedItem.quantity || item.quantity || 0;
                          return sum + (cost * quantity);
                        }, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 pt-4 border-t">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">SPECIAL INSTRUCTIONS:</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      {(order as any)?.supplierInHandsDate && (
                        <p className="font-bold text-red-600">⚠️ RUSH ORDER - Must ship by {format(new Date((order as any).supplierInHandsDate), 'MMMM dd, yyyy')}</p>
                      )}
                      {(order as any)?.supplierNotes && (
                        <p className="whitespace-pre-wrap">{(order as any).supplierNotes}</p>
                      )}
                      {order?.notes && <p className="whitespace-pre-wrap">{order.notes}</p>}
                      <p>Please confirm receipt of this PO and provide production timeline.</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                    <p>Please confirm receipt and provide tracking information when shipped.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Document Editor */}
      {previewDocument && (
        <DocumentEditor
          document={previewDocument}
          order={order}
          orderItems={orderItems}
          companyName={companyName}
          primaryContact={primaryContact}
          getEditedItem={getEditedItem}
          onClose={() => setPreviewDocument(null)}
        />
      )}

    </div>
  );
}
