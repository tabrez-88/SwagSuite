import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { getCloudinaryThumbnail } from "@/lib/media-library";
import {
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Eye,
  Loader2,
  Mail,
  Palette,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { VendorArtwork } from "../../types";
import { PROOF_STATUSES } from "../../types";
import { formatLabel } from "@/lib/utils";

export interface ArtworkProofItemProps {
  artwork: VendorArtwork;
  isLocked: boolean;
  onUpdateArtwork: (params: {
    artworkId: string;
    orderItemId: string;
    updates: Record<string, unknown>;
  }) => void;
  isUpdating: boolean;
  onUploadProof: (art: VendorArtwork) => void;
  onOpenApprovalLink: (art: VendorArtwork) => void;
  onPreviewFile: (file: { url: string; name: string }) => void;
}

export default function ArtworkProofItem({
  artwork: art,
  isLocked,
  onUpdateArtwork,
  isUpdating,
  onUploadProof,
  onOpenApprovalLink,
  onPreviewFile,
}: ArtworkProofItemProps) {
  const proofRequired = art.proofRequired !== false;
  const si = PROOF_STATUSES[art.status] || PROOF_STATUSES.pending;
  const canRequestProof =
    proofRequired &&
    ["pending", "change_requested"].includes(art.status || "pending");
  const canUpload =
    proofRequired &&
    ["pending", "awaiting_proof", "change_requested"].includes(
      art.status || "pending",
    );
  const canMarkComplete = proofRequired && art.status === "approved";

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 p-3">
        <div
          className="w-12 h-12 flex-shrink-0 bg-white rounded border overflow-hidden flex items-center justify-center cursor-pointer"
          onClick={() => {
            const url = (art.fileUrl || art.filePath) as string | undefined;
            if (url)
              onPreviewFile({ url, name: (art.name as string) || "Artwork" });
          }}
        >
          {art.fileUrl || art.filePath ? (
            (() => {
              const url = (art.fileUrl || art.filePath) as string;
              const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
              const isDesignFile = ["ai", "eps", "psd"].includes(ext || "");
              const imgSrc =
                isDesignFile && url.includes("cloudinary.com")
                  ? getCloudinaryThumbnail(url, 96, 96)
                  : url;
              return (
                <img
                  src={imgSrc}
                  alt=""
                  className="w-full h-full object-contain p-0.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    e.currentTarget.parentElement?.insertAdjacentHTML(
                      "afterbegin",
                      `<span class="text-[9px] text-gray-400 uppercase font-medium">.${ext || "file"}</span>`,
                    );
                  }}
                />
              );
            })()
          ) : (
            <Palette className="w-5 h-5 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {art.name || art.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {art.productName}
            {art.location && (
              <span className="ml-1 text-gray-400">· {formatLabel(art.location)}</span>
            )}
            {art.artworkType && (
              <span className="ml-1 text-gray-400">· {formatLabel(art.artworkType)}</span>
            )}
          </p>
        </div>

        <div
          className="flex flex-col items-start gap-1.5"
          title={proofRequired ? "Proof required" : "No proof needed"}
        >
          <div className="flex gap-1 items-center justify-start">
            <ShieldCheck
              className={`w-3.5 h-3.5 ${proofRequired ? "text-blue-500" : "text-gray-300"}`}
            />
            <p className="text-xs">Proof Required </p>
          </div>
          <div className="flex gap-2 w-full">
            <Switch
              checked={proofRequired}
              onCheckedChange={(checked) => {
                onUpdateArtwork({
                  artworkId: art.id,
                  orderItemId: art.orderItemId,
                  updates: { name: art.name, proofRequired: checked },
                });
              }}
              disabled={isLocked}
            />
            {proofRequired ? (
              !isLocked ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      disabled={isUpdating}
                    >
                      <Badge className={`text-[10px] ${si.color}`}>{si.label}</Badge>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {Object.entries(PROOF_STATUSES)
                      .filter(([key]) => key !== art.status)
                      .map(([key, info]) => (
                        <DropdownMenuItem
                          key={key}
                          onClick={() => {
                            onUpdateArtwork({
                              artworkId: art.id,
                              orderItemId: art.orderItemId,
                              updates: { name: art.name, status: key },
                            });
                          }}
                        >
                          <Badge className={`text-[10px] mr-2 ${info.color}`}>{info.label}</Badge>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge className={`text-[10px] ${si.color}`}>{si.label}</Badge>
              )
            ) : (
              <Badge variant="outline" className="text-[10px] text-gray-400">
                No Proof
              </Badge>
            )}
          </div>
        </div>
      </div>

      {proofRequired && art.proofFilePath && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-md border border-blue-100">
            <div
              className="w-10 h-10 flex-shrink-0 bg-white rounded border overflow-hidden cursor-pointer"
              onClick={() =>
                onPreviewFile({
                  url: art.proofFilePath as string,
                  name: (art.proofFileName as string) || "Vendor Proof",
                })
              }
            >
              {(() => {
                const pPath = art.proofFilePath as string;
                const pExt = pPath
                  .split("?")[0]
                  .split(".")
                  .pop()
                  ?.toLowerCase();
                const pIsDesign = ["ai", "eps", "psd"].includes(pExt || "");
                const pSrc =
                  pIsDesign && pPath.includes("cloudinary.com")
                    ? getCloudinaryThumbnail(pPath, 80, 80)
                    : pPath;
                return (
                  <img
                    src={pSrc}
                    alt="Proof"
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                );
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-700">Vendor Proof</p>
              <p className="text-[10px] text-blue-500 truncate">
                {(art.proofFileName as string) || "proof-file"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-800"
              onClick={() =>
                onPreviewFile({
                  url: art.proofFilePath as string,
                  name: (art.proofFileName as string) || "Vendor Proof",
                })
              }
            >
              <Eye className="w-3 h-3 mr-1" /> View
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 pb-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 border-purple-200 text-purple-700 hover:text-purple-700 hover:bg-purple-50"
          onClick={() => onOpenApprovalLink(art)}
        >
          <ExternalLink className="w-3 h-3" /> Open Approval Link
        </Button>

        {proofRequired && !isLocked && (
          <div className="flex items-center gap-2 flex-wrap">
            {canRequestProof && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={isUpdating}
                onClick={() => {
                  onUpdateArtwork({
                    artworkId: art.id,
                    orderItemId: art.orderItemId,
                    updates: { name: art.name, status: "awaiting_proof" },
                  });
                }}
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Mail className="w-3 h-3" />
                )}{" "}
                Request Proof
              </Button>
            )}

            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onUploadProof(art)}
              >
                <Upload className="w-3 h-3" /> Upload Proof
              </Button>
            )}

            {canMarkComplete && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-green-200 text-green-700 hover:text-green-700 hover:bg-green-50"
                disabled={isUpdating}
                onClick={() => {
                  onUpdateArtwork({
                    artworkId: art.id,
                    orderItemId: art.orderItemId,
                    updates: { name: art.name, status: "proofing_complete" },
                  });
                }}
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}{" "}
                Complete
              </Button>
            )}

            {art.status === "change_requested" && art.proofFilePath && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-orange-200 text-orange-700 hover:text-orange-700 hover:bg-orange-50"
                onClick={() => onUploadProof(art)}
              >
                <Upload className="w-3 h-3" /> Re-upload Proof
              </Button>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
