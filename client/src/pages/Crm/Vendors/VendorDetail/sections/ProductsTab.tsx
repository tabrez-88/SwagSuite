import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";

interface ProductsTabProps {
  products: any[] | undefined;
  isLoading: boolean;
  productCount: number;
}

export default function ProductsTab({ products, isLoading, productCount }: ProductsTabProps) {
  return (
    <div className="space-y-4 bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <Package className="h-4 w-4" />
          <h3 className="text-lg font-semibold">Products</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {productCount} products
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="text-lg font-semibold text-muted-foreground mb-2">No products yet</h4>
          <p className="text-sm text-muted-foreground">
            No products found for this vendor.
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Min Qty</TableHead>
                <TableHead>Lead Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[300px]">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {product.sku || product.supplierSku || "-"}
                    </code>
                  </TableCell>
                  <TableCell>
                    {product.basePrice ? (
                      <span className="font-medium text-green-600">${parseFloat(product.basePrice).toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.minimumQuantity || 1}</Badge>
                  </TableCell>
                  <TableCell>
                    {product.leadTime ? (
                      <span className="text-sm text-muted-foreground">{product.leadTime} days</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
