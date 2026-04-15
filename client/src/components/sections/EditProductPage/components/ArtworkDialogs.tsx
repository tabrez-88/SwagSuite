import FilePickerDialog from "@/components/modals/FilePickerDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImprintOptionSelect } from "@/components/shared/ImprintOptionSelect";
import { Loader2, Palette, Repeat } from "lucide-react";

interface ArtworkDialogsProps {
  projectId: string;
  // File picker (initial selection)
  pickingArtwork: boolean;
  setPickingArtwork: (v: boolean) => void;
  handleArtworkFilePicked: (files: any[]) => void;
  // Metadata dialog
  artPickedFile: { filePath: string; fileName: string } | null;
  artUploadName: string;
  setArtUploadName: (v: string) => void;
  artUploadLocation: string;
  setArtUploadLocation: (v: string) => void;
  artUploadMethod: string;
  setArtUploadMethod: (v: string) => void;
  artUploadSize: string;
  setArtUploadSize: (v: string) => void;
  artUploadColor: string;
  setArtUploadColor: (v: string) => void;
  artUploadNumberOfColors: number;
  setArtUploadNumberOfColors: (v: number) => void;
  artUploadRepeatLogo: boolean;
  setArtUploadRepeatLogo: (v: boolean) => void;
  createArtworkMutation: { isPending: boolean };
  handleCreateArtwork: () => void;
  resetArtForm: () => void;
  // Add file to existing artwork
  addingFileToArtworkId: string | null;
  setAddingFileToArtworkId: (v: string | null) => void;
  addArtworkFileMutation: { mutate: (args: any) => void };
}

export function ArtworkDialogs({
  projectId,
  pickingArtwork,
  setPickingArtwork,
  handleArtworkFilePicked,
  artPickedFile,
  artUploadName,
  setArtUploadName,
  artUploadLocation,
  setArtUploadLocation,
  artUploadMethod,
  setArtUploadMethod,
  artUploadSize,
  setArtUploadSize,
  artUploadColor,
  setArtUploadColor,
  artUploadNumberOfColors,
  setArtUploadNumberOfColors,
  artUploadRepeatLogo,
  setArtUploadRepeatLogo,
  createArtworkMutation,
  handleCreateArtwork,
  resetArtForm,
  addingFileToArtworkId,
  setAddingFileToArtworkId,
  addArtworkFileMutation,
}: ArtworkDialogsProps) {
  return (
    <>
      {/* ARTWORK FILE PICKER */}
      <FilePickerDialog
        open={pickingArtwork}
        onClose={() => setPickingArtwork(false)}
        onSelect={handleArtworkFilePicked}
        multiple={false}
        contextProjectId={projectId}
        title="Select Artwork File"
      />

      {/* ARTWORK METADATA DIALOG */}
      <Dialog open={!!artPickedFile} onOpenChange={(open) => !open && resetArtForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Artwork Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {artPickedFile && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img
                  src={artPickedFile.filePath}
                  alt={artPickedFile.fileName}
                  className="w-16 h-16 object-contain rounded border bg-white"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-sm text-gray-600 truncate flex-1">{artPickedFile.fileName}</p>
              </div>
            )}
            <div>
              <Label>Name</Label>
              <Input value={artUploadName} onChange={(e) => setArtUploadName(e.target.value)} placeholder="e.g., Logo Front" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Decoration Location <span className="text-red-500">*</span></Label>
                <ImprintOptionSelect
                  type="location"
                  value={artUploadLocation}
                  onChange={setArtUploadLocation}
                  orderId={projectId}
                />
              </div>
              <div>
                <Label>Imprint Method <span className="text-red-500">*</span></Label>
                <ImprintOptionSelect
                  type="method"
                  value={artUploadMethod}
                  onChange={setArtUploadMethod}
                  orderId={projectId}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Design Size</Label>
                <Input value={artUploadSize} onChange={(e) => setArtUploadSize(e.target.value)} placeholder='e.g., 3" x 3"' />
              </div>
              <div>
                <Label>Design Color</Label>
                <Input value={artUploadColor} onChange={(e) => setArtUploadColor(e.target.value)} placeholder="e.g., White, PMS 186" />
              </div>
            </div>
            <div>
              <Label>Number of Colors <span className="text-xs text-muted-foreground">(for decorator matrix pricing)</span></Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={artUploadNumberOfColors}
                onChange={(e) => setArtUploadNumberOfColors(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="art-repeat-logo"
                checked={artUploadRepeatLogo}
                onChange={(e) => setArtUploadRepeatLogo(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="art-repeat-logo" className="font-normal text-sm flex items-center gap-1">
                <Repeat className="w-3 h-3 text-purple-500" />
                Repeat logo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetArtForm}>Cancel</Button>
            <Button
              disabled={createArtworkMutation.isPending || !artPickedFile || !artUploadLocation || !artUploadMethod}
              onClick={handleCreateArtwork}
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

      {/* ADD FILE TO EXISTING ARTWORK */}
      <FilePickerDialog
        open={!!addingFileToArtworkId}
        onClose={() => setAddingFileToArtworkId(null)}
        onSelect={(files: any[]) => {
          const file = files[0];
          if (file && addingFileToArtworkId) {
            addArtworkFileMutation.mutate({
              artworkId: addingFileToArtworkId,
              file: {
                fileName: file.originalName || file.fileName,
                filePath: file.cloudinaryUrl,
                fileSize: file.fileSize || null,
                mimeType: file.mimeType || null,
              },
            });
          }
          setAddingFileToArtworkId(null);
        }}
        multiple={false}
        contextProjectId={projectId}
        title="Add File to Artwork"
      />
    </>
  );
}
