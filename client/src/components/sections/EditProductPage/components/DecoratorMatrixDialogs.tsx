import DecoratorMatrixDialog from "@/components/modals/DecoratorMatrixDialog";
import MatrixChargePicker from "@/components/modals/MatrixChargePicker";

interface MatrixPickerTarget {
  artworkId: string;
  chargeId: string;
  chargeName: string;
  chargeType: "run" | "fixed";
  currentMargin?: number;
  numberOfColors?: number;
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
          numberOfColors={matrixPickerTarget.numberOfColors}
          quantity={quantity || 1}
          projectId={projectId}
        />
      )}
    </>
  );
}
