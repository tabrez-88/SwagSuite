import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Image, FileText } from "lucide-react";

interface FileToAssign {
  file: File;
  preview?: string;
  orderItemId?: string;
}

interface Product {
  id: string;
  productName: string;
  color?: string;
  size?: string;
  quantity: number;
}

interface AssignFilesToProductsModalProps {
  open: boolean;
  onClose: () => void;
  files: File[];
  products: Product[];
  onAssign: (assignments: { file: File; orderItemId?: string }[]) => void;
}

export function AssignFilesToProductsModal({
  open,
  onClose,
  files,
  products,
  onAssign,
}: AssignFilesToProductsModalProps) {
  const [fileAssignments, setFileAssignments] = useState<FileToAssign[]>(() => {
    return files.map((file) => {
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;
      return { file, preview };
    });
  });

  const handleAssignment = (index: number, orderItemId: string) => {
    setFileAssignments((prev) => {
      const newAssignments = [...prev];
      newAssignments[index] = {
        ...newAssignments[index],
        orderItemId: orderItemId === "none" ? undefined : orderItemId,
      };
      return newAssignments;
    });
  };

  const handleSubmit = () => {
    onAssign(
      fileAssignments.map(({ file, orderItemId }) => ({
        file,
        orderItemId,
      }))
    );
    onClose();
  };

  const getProductLabel = (product: Product) => {
    const details = [];
    if (product.color) details.push(product.color);
    if (product.size) details.push(product.size);
    return `${product.productName}${details.length > 0 ? ` (${details.join(", ")})` : ""}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assign Files to Products</DialogTitle>
          <p className="text-sm text-gray-500">
            Assign each uploaded file to a specific product, or leave unassigned for order-level files.
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {fileAssignments.map((assignment, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                {/* File Preview */}
                <div className="flex-shrink-0">
                  {assignment.preview ? (
                    <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={assignment.preview}
                        alt={assignment.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-32 h-32 bg-gray-100 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info & Assignment */}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-medium text-sm truncate">
                      {assignment.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(assignment.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`assignment-${index}`}>
                      Assign to Product
                    </Label>
                    <Select
                      value={assignment.orderItemId || "none"}
                      onValueChange={(value) => handleAssignment(index, value)}
                    >
                      <SelectTrigger id={`assignment-${index}`}>
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-gray-500">No specific product (order-level)</span>
                        </SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center gap-2">
                              <span>{getProductLabel(product)}</span>
                              <Badge variant="secondary" className="text-xs">
                                Qty: {product.quantity}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {assignment.orderItemId && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Image className="w-4 h-4" />
                      <span>
                        Assigned to:{" "}
                        {
                          getProductLabel(
                            products.find((p) => p.id === assignment.orderItemId)!
                          )
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Upload {files.length} File{files.length > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
