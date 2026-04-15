import DecoratorMatrixDialog from "@/components/modals/DecoratorMatrixDialog";
import MatrixChargePicker from "@/components/modals/MatrixChargePicker";

interface MatrixPickerTarget {
  artworkId: string;
  chargeId: string;
  chargeName: string;
  chargeType: "run" | "fixed";
  artworkMethod?: string;
  currentMargin?: number;
}

interface DecoratorMatrixDialogsProps {
  showMatrixDialog: boolean;
  setShowMatrixDialog: (v: boolean) => void;
  matrixPickerTarget: MatrixPickerTarget | null;
  setMatrixPickerTarget: (v: MatrixPickerTarget | null) => void;
  vendorId: string | undefined;
  vendorName: string;
  artworks: any[];
  quantity: number;
  projectId: string;
}

export function DecoratorMatrixDialogs({
  showMatrixDialog,
  setShowMatrixDialog,
  matrixPickerTarget,
  setMatrixPickerTarget,
  vendorId,
  vendorName,
  artworks,
  quantity,
  projectId,
}: DecoratorMatrixDialogsProps) {
  if (!vendorId) return null;

  return (
    <>
      <DecoratorMatrixDialog
        open={showMatrixDialog}
        onClose={() => setShowMatrixDialog(false)}
        supplierId={vendorId}
        supplierName={vendorName}
        artworkId={artworks.length === 1 ? artworks[0]?.id : undefined}
        artworkMethod={artworks.length === 1 ? (artworks[0]?.artworkType ?? undefined) : undefined}
        quantity={quantity || 1}
        projectId={projectId}
        readOnly
      />

      {matrixPickerTarget && (
        <MatrixChargePicker
          open={true}
          onClose={() => setMatrixPickerTarget(null)}
          supplierId={vendorId}
          supplierName={vendorName}
          chargeType={matrixPickerTarget.chargeType}
          artworkId={matrixPickerTarget.artworkId}
          chargeId={matrixPickerTarget.chargeId}
          chargeName={matrixPickerTarget.chargeName}
          currentMargin={matrixPickerTarget.currentMargin}
          quantity={quantity || 1}
          projectId={projectId}
          artworkMethod={matrixPickerTarget.artworkMethod}
        />
      )}
    </>
  );
}
