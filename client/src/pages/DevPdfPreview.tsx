/**
 * Dev-only PDF Preview Page
 *
 * Hot-reload PDF styling without regenerating each time.
 * Navigate to /dev/pdf in browser.
 * Use ?projectId=xxx to load real project data.
 */
import { PDFViewer } from "@react-pdf/renderer";
import { useState } from "react";
import { InvoicePdf } from "@/components/documents/pdf/InvoicePdf";
import { QuotePdf } from "@/components/documents/pdf/QuotePdf";
import { SalesOrderPdf } from "@/components/documents/pdf/SalesOrderPdf";
import { useProjectData } from "@/services/projects";
import { mockPdfData, mockVendor } from "./mockPdfData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PurchaseOrderPdf } from "@/components/documents/pdf/PurchaseOrderPdf";

type DocType = "invoice" | "quote" | "so" | "purchase_order";

export default function DevPdfPreview() {
  const [docType, setDocType] = useState<DocType>("so");
  const [projectId, setProjectId] = useState("a71de981-dfcf-4c99-affc-dc09de201897");
  const [inputValue, setInputValue] = useState("a71de981-dfcf-4c99-affc-dc09de201897");

  // Load real project data if projectId is set
  const projectData = useProjectData("a71de981-dfcf-4c99-affc-dc09de201897", "quote");
  const isLoading = projectData.orderLoading;
  const usingRealData = !!projectData.order;

  // Use real data if loaded, otherwise use mock data
  const pdfData = usingRealData
    ? {
        order: projectData.order,
        orderItems: projectData.orderItems,
        companyName: projectData.companyName,
        primaryContact: projectData.primaryContact,
        allItemLines: projectData.allItemLines,
        allArtworkItems: projectData.allArtworkItems,
        allItemCharges: projectData.allItemCharges,
        allArtworkCharges: projectData.allArtworkCharges,
        serviceCharges: projectData.serviceCharges,
        assignedUser: projectData.assignedUser,
        invoice: projectData.invoice,
        sellerName: "Liquid Screen Design",
      }
    : mockPdfData;

  const renderPdf = () => {
    if (docType === "quote") {
      return (
        <QuotePdf
          order={pdfData.order}
          orderItems={pdfData.orderItems}
          companyName={pdfData.companyName}
          primaryContact={pdfData.primaryContact}
          allItemLines={pdfData.allItemLines}
          allArtworkItems={pdfData.allArtworkItems}
          allItemCharges={pdfData.allItemCharges}
          allArtworkCharges={pdfData.allArtworkCharges}
          serviceCharges={pdfData.serviceCharges}
          assignedUser={pdfData.assignedUser}
          sellerName={pdfData.sellerName}
        />
      );
    }
    if (docType === "so") {
      return (
        <SalesOrderPdf
          order={pdfData.order}
          orderItems={pdfData.orderItems}
          companyName={pdfData.companyName}
          primaryContact={pdfData.primaryContact}
          allItemLines={pdfData.allItemLines}
          allArtworkItems={pdfData.allArtworkItems}
          allItemCharges={pdfData.allItemCharges}
          allArtworkCharges={pdfData.allArtworkCharges}
          serviceCharges={pdfData.serviceCharges}
          assignedUser={pdfData.assignedUser}
          sellerName={pdfData.sellerName}
        />
      );
    }
    if (docType === "purchase_order") {
      // PO has different structure — it's for vendors, not clients
      return (
        <PurchaseOrderPdf
          order={pdfData.order}
          vendor={mockVendor}
          vendorItems={pdfData.orderItems}
          poNumber="PO-2024-001"
          artworkItems={Object.values(pdfData.allArtworkItems).flat()}
          allArtworkCharges={pdfData.allArtworkCharges}
          allItemCharges={pdfData.allItemCharges}
          serviceCharges={pdfData.serviceCharges}
          poType="supplier"
          sellerName={pdfData.sellerName}
        />
      );
    }
    return (
      <InvoicePdf
        invoice={pdfData.invoice}
        order={pdfData.order}
        orderItems={pdfData.orderItems}
        companyName={pdfData.companyName}
        primaryContact={pdfData.primaryContact}
        allItemLines={pdfData.allItemLines}
        allArtworkItems={pdfData.allArtworkItems}
        allItemCharges={pdfData.allItemCharges}
        allArtworkCharges={pdfData.allArtworkCharges}
        serviceCharges={pdfData.serviceCharges}
        assignedUser={pdfData.assignedUser}
        sellerName={pdfData.sellerName}
      />
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-4 flex items-center gap-4 shadow-lg border-b border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setDocType("quote")}
            className={`px-4 py-2 rounded transition-colors ${
              docType === "quote"
                ? "bg-blue-600 font-semibold"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            📄 Quote
          </button>
          <button
            onClick={() => setDocType("so")}
            className={`px-4 py-2 rounded transition-colors ${
              docType === "so"
                ? "bg-emerald-600 font-semibold"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            📋 Sales Order
          </button>
          <button
            onClick={() => setDocType("purchase_order")}
            className={`px-4 py-2 rounded transition-colors ${
              docType === "purchase_order"
                ? "bg-yellow-600 font-semibold"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            🛒 Purchase Order
          </button>
          <button
            onClick={() => setDocType("invoice")}
            className={`px-4 py-2 rounded transition-colors ${
              docType === "invoice"
                ? "bg-purple-600 font-semibold"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            💰 Invoice
          </button>
        </div>

        <div className="h-8 w-px bg-gray-600" />

        {/* Load Real Data */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Project ID (optional)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-48 h-9 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Button
            onClick={() => setProjectId(inputValue)}
            size="sm"
            variant="secondary"
            className="h-9"
          >
            Load
          </Button>
          {projectId && (
            <Button
              onClick={() => {
                setProjectId("");
                setInputValue("");
              }}
              size="sm"
              variant="ghost"
              className="h-9 text-gray-400 hover:text-white"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex-1" />

        <div className="text-sm text-gray-400">
          {isLoading && "⏳ Loading..."}
          {usingRealData && !isLoading && "✅ Using real data"}
          {!usingRealData && !isLoading && "🔥 Hot reload enabled"}
        </div>
      </div>

      {/* PDF Preview */}
      <div className="flex-1 bg-gray-900">
        {!isLoading ? (
          <PDFViewer
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            showToolbar={true}
          >
            {renderPdf()}
          </PDFViewer>
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <div>Loading project data...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
