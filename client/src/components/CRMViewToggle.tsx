import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Grid, List } from "lucide-react";

interface CRMViewToggleProps {
  viewMode: 'cards' | 'list';
  onViewModeChange: (mode: 'cards' | 'list') => void;
}

export function CRMViewToggle({ viewMode, onViewModeChange }: CRMViewToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {/* View Toggle */}
      <div className="flex items-center border rounded-md">
        <Button
          variant={viewMode === 'cards' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('cards')}
          className="rounded-r-none"
          data-testid="view-cards"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
          className="rounded-l-none"
          data-testid="view-list"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      <Separator orientation="vertical" className="h-8" />
    </div>
  );
}