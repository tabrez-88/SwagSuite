export interface OrderFile {
    id: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;
    thumbnailPath?: string;
    fileType: string;
    tags: string[];
    orderItemId?: string;
    orderItem?: {
        id: string;
        productName: string;
        productSku: string;
        productId: string;
        color?: string;
        size?: string;
        quantity: number;
    };
    approval?: {
        status: 'pending' | 'approved' | 'declined';
        approvedAt?: string;
        declinedAt?: string;
        feedback?: string;
        approvalToken?: string;
    };
    notes?: string;
    uploadedBy: string;
    createdAt: string;
}

export interface FilesTabProps {
    projectId: string;
    products: Array<{
        id: string;
        productName: string;
        color?: string;
        size?: string;
        quantity: number;
    }>;
    artworkItems?: Record<string, any[]>;
    onSwitchToEmail?: (emailData: { body: string; subject: string }) => void;
}

export const FILE_TYPE_OPTIONS = [
    { value: "customer_proof", label: "Customer Proof", color: "bg-blue-500" },
    { value: "supplier_proof", label: "Supplier Proof", color: "bg-purple-500" },
    { value: "invoice", label: "Invoice", color: "bg-green-500" },
    { value: "artwork", label: "Artwork", color: "bg-orange-500" },
    { value: "other_document", label: "Other Document", color: "bg-gray-500" },
];
