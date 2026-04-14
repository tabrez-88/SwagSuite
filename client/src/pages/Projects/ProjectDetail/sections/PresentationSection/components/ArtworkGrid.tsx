import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateArtwork, useDeleteArtwork } from "@/services/project-items";
import { useSupplier } from "@/services/suppliers";
import { projectKeys } from "@/services/projects/keys";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Package,
  Palette,
  Trash2,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IMPRINT_LOCATIONS, IMPRINT_METHODS } from "@/constants/imprintOptions";
import FilePickerDialog from "@/components/modals/FilePickerDialog";
import type { useProjectData } from "../../../hooks";

interface ArtworkGridProps {
  data: ReturnType<typeof useProjectData>;
  projectId: string;
  enrichedItems: any[];
}

export default function ArtworkGrid({ data, projectId, enrichedItems }: ArtworkGridProps) {
  const { allArtworkItems } = data;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Step 1: file picker for selecting item
  const [pickingForItem, setPickingForItem] = useState<string | null>(null);
  // Step 2: metadata form after file is picked
  const [pickedFile, setPickedFile] = useState<{ orderItemId: string; filePath: string; fileName: string } | null>(null);
  const [artName, setArtName] = useState("");
  const [artLocation, setArtLocation] = useState("");
  const [artMethod, setArtMethod] = useState("");

  // Get current item's product-level imprint methods and supplier sageData
  const currentItem = pickedFile ? enrichedItems.find((i: any) => i.id === pickedFile.orderItemId) : null;
  const currentSupplierId = currentItem?.productSupplierId;

  // Fetch supplier data for sageData.generalInfo.imprintMethods
  const { data: supplierData } = useSupplier(currentSupplierId);

  // Build dynamic imprint method groups
  const imprintMethodGroups = useMemo(() => {
    const productMethods: string[] = [];
    const supplierMethods: string[] = [];
    const seenValues = new Set<string>();

    // 1. Product-level methods (from products.imprintMethods)
    if (currentItem?.productImprintMethods) {
      try {
        const parsed = typeof currentItem.productImprintMethods === 'string'
          ? JSON.parse(currentItem.productImprintMethods)
          : currentItem.productImprintMethods;
        if (Array.isArray(parsed)) {
          for (const m of parsed) {
            const val = m.trim();
            if (val && !seenValues.has(val.toLowerCase())) {
              productMethods.push(val);
              seenValues.add(val.toLowerCase());
            }
          }
        }
      } catch { /* ignore parse errors */ }
    }

    // Also check orderItem.imprintMethod (already selected for this item)
    if (currentItem?.imprintMethod && !seenValues.has(currentItem.imprintMethod.toLowerCase())) {
      productMethods.push(currentItem.imprintMethod);
      seenValues.add(currentItem.imprintMethod.toLowerCase());
    }

    // 2. Supplier-level methods (from supplier.sageData.generalInfo.imprintMethods)
    const sageImprintMethods = (supplierData as any)?.sageData?.generalInfo?.imprintMethods;
    if (sageImprintMethods && typeof sageImprintMethods === 'string') {
      const methods = sageImprintMethods.split(/[,;]/).map((m: string) => m.trim()).filter(Boolean);
      for (const m of methods) {
        if (!seenValues.has(m.toLowerCase())) {
          supplierMethods.push(m);
          seenValues.add(m.toLowerCase());
        }
      }
    }

    // 3. Static fallback methods (filtered)
    const staticMethods = IMPRINT_METHODS.filter(opt => !seenValues.has(opt.label.toLowerCase()) && !seenValues.has(opt.value.toLowerCase()));

    const hasProductMethods = productMethods.length > 0;
    const hasSupplierMethods = supplierMethods.length > 0;

    return { productMethods, supplierMethods, staticMethods, hasProductMethods, hasSupplierMethods };
  }, [currentItem, supplierData]);

  const resetForm = () => {
    setPickedFile(null);
    setArtName("");
    setArtLocation("");
    setArtMethod("");
  };

  const _createArtwork = useCreateArtwork(projectId);
  const createArtworkMutation = {
    ..._createArtwork,
    mutate: (
      payload: { orderItemId: string; name: string; filePath: string; fileName: string; location?: string; artworkType?: string },
    ) =>
      _createArtwork.mutate(payload, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: projectKeys.artworks(projectId) });
          resetForm();
          toast({ title: "Artwork added" });
        },
        onError: () => toast({ title: "Failed to add artwork", variant: "destructive" }),
      }),
  };

  const _deleteArtwork = useDeleteArtwork(projectId);
  const deleteArtworkMutation = {
    ..._deleteArtwork,
    mutate: ({ artworkId, orderItemId }: { artworkId: string; orderItemId: string }) =>
      _deleteArtwork.mutate(
        { orderItemId, artworkId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.artworks(projectId) });
            toast({ title: "Artwork removed" });
          },
          onError: () => toast({ title: "Failed to remove artwork", variant: "destructive" }),
        },
      ),
  };

  if (enrichedItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500">Add products first, then you can attach artwork to each one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {enrichedItems.map((item: any) => {
          const artworks = allArtworkItems[item.id] || [];
          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName || ""} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName || "Unnamed Product"}</p>
                    {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPickingForItem(item.id)}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Add Artwork
                  </Button>
                </div>

                {artworks.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {artworks.map((art: any) => (
                      <div key={art.id} className="border rounded-lg p-2 bg-white w-36 group relative">
                        {art.filePath ? (
                          <img src={art.filePath} alt={art.name} className="w-full h-20 object-contain rounded mb-1.5" />
                        ) : (
                          <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center mb-1.5">
                            <Palette className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        <p className="text-[10px] font-medium truncate">{art.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${
                                art.status === "approved" ? "border-green-300 text-green-700" :
                                art.status === "rejected" ? "border-red-300 text-red-700" :
                                "border-yellow-300 text-yellow-700"
                              }`}
                            >
                              {art.status}
                            </Badge>
                            {art.location && <span className="text-[9px] text-gray-400">{art.location}</span>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteArtworkMutation.mutate({ artworkId: art.id, orderItemId: item.id })}
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No artwork yet — click "Add Artwork" to upload</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Step 1: File Picker */}
      <FilePickerDialog
        open={!!pickingForItem}
        onClose={() => setPickingForItem(null)}
        onSelect={(files) => {
          const file = files[0];
          if (file && pickingForItem) {
            setPickedFile({
              orderItemId: pickingForItem,
              filePath: file.cloudinaryUrl,
              fileName: file.originalName || file.fileName,
            });
            setArtName(file.originalName || file.fileName);
          }
          setPickingForItem(null);
        }}
        multiple={false}
        contextProjectId={projectId}
        title="Select Artwork File"
      />

      {/* Step 2: Artwork Metadata Dialog */}
      <Dialog open={!!pickedFile} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Artwork Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pickedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={pickedFile.filePath}
                  alt={pickedFile.fileName}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">{pickedFile.fileName}</p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={artName} onChange={(e) => setArtName(e.target.value)} placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location</Label>
                <Select value={artLocation} onValueChange={setArtLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPRINT_LOCATIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Imprint Method</Label>
                <Select value={artMethod} onValueChange={setArtMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {imprintMethodGroups.hasProductMethods && (
                      <SelectGroup>
                        <SelectLabel>Product Methods</SelectLabel>
                        {imprintMethodGroups.productMethods.map((m) => (
                          <SelectItem key={`prod-${m}`} value={m}>{m}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {imprintMethodGroups.hasSupplierMethods && (
                      <SelectGroup>
                        <SelectLabel>Supplier Methods</SelectLabel>
                        {imprintMethodGroups.supplierMethods.map((m) => (
                          <SelectItem key={`supp-${m}`} value={m}>{m}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    <SelectGroup>
                      {(imprintMethodGroups.hasProductMethods || imprintMethodGroups.hasSupplierMethods) && (
                        <SelectLabel>All Methods</SelectLabel>
                      )}
                      {imprintMethodGroups.staticMethods.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              disabled={createArtworkMutation.isPending || !pickedFile}
              onClick={() => {
                if (!pickedFile) return;
                createArtworkMutation.mutate({
                  orderItemId: pickedFile.orderItemId,
                  name: artName || pickedFile.fileName,
                  filePath: pickedFile.filePath,
                  fileName: pickedFile.fileName,
                  location: artLocation || undefined,
                  artworkType: artMethod || undefined,
                });
              }}
            >
              {createArtworkMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                "Add Artwork"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
