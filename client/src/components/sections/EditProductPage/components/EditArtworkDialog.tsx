import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImprintOptionSelect } from "@/components/shared/ImprintOptionSelect";
import { Loader2, Palette, Repeat } from "lucide-react";

interface EditArtworkDialogProps {
  projectId: string;
  artwork: any | null;
  onClose: () => void;
  onSave: (artworkId: string, updates: Record<string, any>) => void;
  isSaving: boolean;
}

export function EditArtworkDialog({
  projectId,
  artwork,
  onClose,
  onSave,
  isSaving,
}: EditArtworkDialogProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [method, setMethod] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [numberOfColors, setNumberOfColors] = useState(1);
  const [repeatLogo, setRepeatLogo] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!artwork) return;
    setName(artwork.name ?? "");
    setLocation(artwork.location ?? "");
    setMethod(artwork.artworkType ?? "");
    setSize(artwork.size ?? "");
    setColor(artwork.color ?? "");
    setNumberOfColors(artwork.numberOfColors ?? 1);
    setRepeatLogo(!!artwork.repeatLogo);
    setNotes(artwork.notes ?? "");
  }, [artwork]);

  const handleSave = () => {
    if (!artwork) return;
    onSave(artwork.id, {
      name: name || artwork.fileName,
      location: location || null,
      artworkType: method || null,
      size: size || null,
      color: color || null,
      numberOfColors: numberOfColors || 1,
      repeatLogo,
      notes: notes || null,
    });
  };

  return (
    <Dialog open={!!artwork} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Edit Artwork
          </DialogTitle>
        </DialogHeader>
        {artwork && (
          <div className="space-y-4">
            {artwork.filePath && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={artwork.filePath}
                  alt={artwork.name}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">
                  {artwork.fileName}
                </p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Logo Front"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location</Label>
                <ImprintOptionSelect
                  type="location"
                  value={location}
                  onChange={setLocation}
                  orderId={projectId}
                />
              </div>
              <div>
                <Label>Imprint Method</Label>
                <ImprintOptionSelect
                  type="method"
                  value={method}
                  onChange={setMethod}
                  orderId={projectId}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Design Size</Label>
                <Input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder='e.g., 3" x 3"'
                />
              </div>
              <div>
                <Label>Design Color</Label>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g., White, PMS 186"
                />
              </div>
            </div>
            <div>
              <Label>
                Number of Colors{" "}
                <span className="text-xs text-muted-foreground">
                  (for decorator matrix pricing)
                </span>
              </Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={numberOfColors}
                onChange={(e) => setNumberOfColors(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-art-repeat-logo"
                checked={repeatLogo}
                onChange={(e) => setRepeatLogo(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label
                htmlFor="edit-art-repeat-logo"
                className="font-normal text-sm flex items-center gap-1"
              >
                <Repeat className="w-3 h-3 text-purple-500" />
                Repeat logo
              </Label>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={handleSave}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
