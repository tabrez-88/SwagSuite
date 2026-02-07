import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
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
import { useEffect, useRef, useState } from "react";
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
      vendorName 
    }: { 
      elementRef: HTMLDivElement | null; 
      documentType: string; 
      documentNumber: string; 
      vendorId?: string; 
      vendorName?: string; 
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
        // Scale to fit height, may leave some width margin
        const scaleFactor = pageHeight / imgHeight;
        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = pageHeight;
        const xOffset = (pageWidth - scaledWidth) / 2; // Center horizontally
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

      // Add metadata (without pdfData)
      const metadata = {
        orderNumber: order?.orderNumber,
        itemCount: orderItems.length,
        generatedAt: new Date().toISOString(),
      };
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch(`/api/orders/${orderId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData, // Send as FormData (no Content-Type header, browser sets it automatically)
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

  // Auto-generate documents on first load when order items exist
  useEffect(() => {
    if (!autoGenerateTriggered && orderItems.length > 0 && documents.length === 0 && !isGenerating) {
      // Small delay to ensure refs are ready
      const timer = setTimeout(() => {
        handleAutoGenerate();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [orderItems.length, documents.length, autoGenerateTriggered, isGenerating]);

  const handleAutoGenerate = async () => {
    if (isGenerating || autoGenerateTriggered) return;
    setAutoGenerateTriggered(true);
    
    // Generate Quote first
    if (quoteRef.current) {
      await generateDocumentMutation.mutateAsync({
        elementRef: quoteRef.current,
        documentType: 'quote',
        documentNumber: order?.orderNumber || 'DRAFT',
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
        });
      }
    }

    toast({
      title: "Documents Generated",
      description: `Generated Quote and ${orderVendors.length} Purchase Order(s)`,
    });
  };

  const handleRegenerateAll = async () => {
    // Delete all existing documents first
    for (const doc of documents) {
      await deleteDocumentMutation.mutateAsync(doc.id);
    }
    
    setAutoGenerateTriggered(false);
    
    // Regenerate
    setTimeout(() => {
      handleAutoGenerate();
    }, 500);
  };

  const handleGenerateQuote = () => {
    generateDocumentMutation.mutate({
      elementRef: quoteRef.current,
      documentType: 'quote',
      documentNumber: order?.orderNumber || 'DRAFT',
    });
  };

  const handleGeneratePO = (vendor: any) => {
    const poNumber = `${order?.orderNumber}-${vendor.id.substring(0, 4).toUpperCase()}`;
    generateDocumentMutation.mutate({
      elementRef: poRefs.current[vendor.id],
      documentType: 'purchase_order',
      documentNumber: poNumber,
      vendorId: vendor.id,
      vendorName: vendor.name,
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
      {/* Auto-generate status */}
      {isGenerating && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <p className="font-medium text-blue-900">Generating Documents...</p>
            <p className="text-sm text-blue-700">Creating Quote and Purchase Orders automatically</p>
          </div>
        </div>
      )}

      {/* Generated Documents List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Generated Documents
            </CardTitle>
            <CardDescription>
              Documents are auto-generated when you open this tab
            </CardDescription>
          </div>
          {documents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateAll}
              disabled={isGenerating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate All
            </Button>
          )}
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
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded">
                      {doc.documentType === 'quote' ? (
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
                      <div className="flex items-center gap-3 mt-1">
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
                          // Ensure filename always ends with .pdf
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Quote
          </CardTitle>
          <CardDescription>
            Create a professional quote document for your client
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Off-screen element for PDF generation */}
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
                    console.log('Calculating totals for item:', item.id, editedItem); 
                    // Same approach as PO: use parseFloat on editedItem first, then item
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

              {order?.notes && (
                <div className="mb-6 pt-4 border-t">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">NOTES:</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}

              <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                <p>Thank you for your business!</p>
                <p className="mt-1">This quote is valid for 30 days from the date issued.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                        // Use cost first, fallback to unitPrice if cost is not available
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
                      {order?.notes && <p>{order.notes}</p>}
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
