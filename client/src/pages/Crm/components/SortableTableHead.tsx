import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

interface SortableTableHeadProps {
  label: string;
  field: string;
  currentSortField: string;
  currentSortDirection: "asc" | "desc";
  onSort: (field: any) => void;
  className?: string;
}

export function SortableTableHead({
  label,
  field,
  currentSortField,
  currentSortDirection,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSortField === field;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 ${className || ""}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentSortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
}
