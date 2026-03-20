import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { preloadAndConvertImages } from "@/lib/imageUtils";
import type { DocumentEditorProps, EditableFields } from "./types";
import { formatAddress, toDateInputValue, formatDateDisplay } from "./types";

export function useDocumentEditor({
  document: doc,
  order,
  orderItems,
  companyName,
  primaryContact,
  onClose,
  getEditedItem,
}: Omit<DocumentEditorProps, 'allArtworkItems'>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const docType = doc.documentType as string;
  const isClientFacing = docType === 'quote' || docType === 'sales_order';
  const isSalesOrder = docType === 'sales_order';
  const isPurchaseOrder = docType === 'purchase_order';

  // Initialize editable fields from document/order data
  const [fields, setFields] = useState<EditableFields>(() => {
    const relevantItems = isClientFacing
      ? orderItems
      : orderItems.filter((item: any) => item.supplierId === doc.vendorId);

    const items = relevantItems.map((item: any) => {
      const editedItem = getEditedItem(item.id, item);
      const unitPrice = isClientFacing
        ? (parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0)
        : (parseFloat(editedItem.cost) || parseFloat(item.cost) || parseFloat(editedItem.unitPrice) || parseFloat(item.unitPrice) || 0);
      const quantity = editedItem.quantity || item.quantity || 1;

      return {
        id: item.id,
        name: item.product?.name || item.productName || 'Unknown Product',
        sku: item.product?.sku || item.productSku || '',
        color: editedItem.color || '',
        size: editedItem.size || '',
        quantity: quantity,
        unitPrice: unitPrice,
        total: unitPrice * quantity,
        imageUrl: item.productImageUrl || item.imageUrl || '',
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    return {
      documentTitle: isSalesOrder ? 'SALES ORDER' : isPurchaseOrder ? 'PURCHASE ORDER' : 'QUOTE',
      documentNumber: doc.documentNumber || order?.orderNumber || 'N/A',
      documentDate: order?.createdAt ? format(new Date(order.createdAt), 'MMMM dd, yyyy') : format(new Date(), 'MMMM dd, yyyy'),
      documentDateRaw: toDateInputValue(order?.createdAt || new Date()),
      inHandsDate: isClientFacing
        ? (order?.inHandsDate ? format(new Date(order.inHandsDate), 'MMMM dd, yyyy') : '')
        : (() => {
            const vendorIHD = doc.metadata?.supplierIHD || (order as any)?.supplierInHandsDate;
            return vendorIHD ? format(new Date(vendorIHD), 'MMMM dd, yyyy') : '';
          })(),
      inHandsDateRaw: isClientFacing
        ? toDateInputValue(order?.inHandsDate)
        : toDateInputValue(doc.metadata?.supplierIHD || (order as any)?.supplierInHandsDate),
      eventDate: (order as any)?.eventDate ? format(new Date((order as any).eventDate), 'MMMM dd, yyyy') : '',
      eventDateRaw: toDateInputValue((order as any)?.eventDate),
      supplierNotes: (order as any)?.supplierNotes || '',
      additionalInformation: (order as any)?.additionalInformation || '',

      companyTitle: 'SwagSuite',
      companySubtitle: 'Your Promotional Products Partner',

      billToName: companyName || 'N/A',
      billToContact: primaryContact ? `${primaryContact.firstName || ''} ${primaryContact.lastName || ''}`.trim() : '',
      billToEmail: primaryContact?.email || '',
      billToPhone: primaryContact?.phone || '',

      shipToAddress: formatAddress((order as any)?.shippingAddress),

      vendorName: doc.vendorName || '',
      vendorAddress: '',
      vendorEmail: '',

      specialInstructions: isClientFacing
        ? (order?.notes || '')
        : [order?.notes, (order as any)?.supplierNotes].filter(Boolean).join('\n\n') || '',
      footerNote: isPurchaseOrder
        ? 'Please confirm receipt of this PO and provide production timeline.'
        : isSalesOrder
        ? 'Thank you for your business! This sales order confirms the agreed-upon terms.'
        : 'Thank you for your business! This quote is valid for 30 days.',

      items,

      subtotal,
      discount: 0,
      tax: 0,
      grandTotal: subtotal,
    };
  });

  // Recalculate totals when items change
  useEffect(() => {
    const subtotal = fields.items.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = subtotal - fields.discount + fields.tax;
    setFields(prev => ({ ...prev, subtotal, grandTotal }));
  }, [fields.items, fields.discount, fields.tax]);

  const updateField = (key: keyof EditableFields, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const updateItem = (index: number, key: keyof EditableFields['items'][0], value: any) => {
    setFields(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [key]: value,
        total: key === 'quantity' ? value * newItems[index].unitPrice
             : key === 'unitPrice' ? newItems[index].quantity * value
             : newItems[index].total
      };
      return { ...prev, items: newItems };
    });
  };

  // Save document mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsSaving(true);

      if (!previewRef.current) throw new Error('Preview not found');

      // Convert cross-origin images to base64 for capture
      const restoreImages = await preloadAndConvertImages(previewRef.current);
      await new Promise((r) => setTimeout(r, 300));

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(previewRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          foreignObjectRendering: false,
        });
      } finally {
        restoreImages();
      }

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

      if (imgHeight <= pageHeight) {
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        const pxPerMm = canvas.width / pageWidth;
        const pageHeightPx = Math.floor(pageHeight * pxPerMm);
        const totalPages = Math.ceil(canvas.height / pageHeightPx);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const sourceY = page * pageHeightPx;
          const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);
          if (sourceHeight <= 0) break;

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (!ctx) continue;
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          const sliceHeightMm = (sourceHeight * pageWidth) / canvas.width;
          pdf.addImage(pageImgData, 'PNG', 0, 0, pageWidth, sliceHeightMm);
        }
      }

      const pdfBlob = pdf.output('blob');

      // Upload new PDF
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `${doc.documentType}-${fields.documentNumber}.pdf`);
      formData.append('documentType', doc.documentType);
      formData.append('documentNumber', fields.documentNumber);
      formData.append('vendorId', doc.vendorId || '');
      formData.append('vendorName', fields.vendorName || '');
      formData.append('status', 'draft');
      formData.append('metadata', JSON.stringify({
        ...doc.metadata,
        orderNumber: order?.orderNumber,
        itemCount: fields.items.length,
        generatedAt: new Date().toISOString(),
        editedFields: fields,
        ...(isPurchaseOrder && fields.inHandsDateRaw ? { supplierIHD: fields.inHandsDateRaw } : {}),
      }));

      // Delete old document and create new one
      await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const response = await fetch(`/api/orders/${order.id}/documents`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}/documents`] });
      toast({
        title: "Document Saved",
        description: "Your changes have been saved and a new PDF has been generated.",
      });
      setIsSaving(false);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const handleDownload = async () => {
    if (!previewRef.current) return;

    const restoreImages = await preloadAndConvertImages(previewRef.current);
    await new Promise((r) => setTimeout(r, 300));

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: false,
      });
    } finally {
      restoreImages();
    }

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

    if (imgHeight <= pageHeight) {
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      const pxPerMm = canvas.width / pageWidth;
      const pageHeightPx = Math.floor(pageHeight * pxPerMm);
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        const sourceY = page * pageHeightPx;
        const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);
        if (sourceHeight <= 0) break;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext('2d');
        if (!ctx) continue;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
        const sliceHeightMm = (sourceHeight * pageWidth) / canvas.width;
        pdf.addImage(pageImgData, 'PNG', 0, 0, pageWidth, sliceHeightMm);
      }
    }

    pdf.save(`${doc.documentType}-${fields.documentNumber}.pdf`);
  };

  const handleSave = () => {
    if (isPurchaseOrder && !fields.inHandsDateRaw) {
      toast({ title: "Supplier IHD Required", description: "Please set the Supplier In-Hands Date before saving.", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const dialogTitle = isSalesOrder ? 'Sales Order' : isPurchaseOrder ? 'Purchase Order' : 'Quote';

  return {
    previewRef,
    isSaving,
    docType,
    isClientFacing,
    isSalesOrder,
    isPurchaseOrder,
    fields,
    updateField,
    updateItem,
    handleDownload,
    handleSave,
    dialogTitle,
    doc,
    formatDateDisplay,
  };
}
