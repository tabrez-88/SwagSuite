import { Button } from "@/components/ui/button";
import { PopoverClose } from "@/components/ui/popover";
import { useState } from "react";

/** Inline Color/Size selector popover — CommonSKU style */
export function ColorSizePopover({ colors, sizes, selectedColor, selectedSize, onSelect, onAddCustom }: {
  colors: string[];
  sizes: string[];
  selectedColor: string;
  selectedSize: string;
  onSelect: (color: string, size: string) => void;
  onAddCustom?: (color?: string, size?: string) => void;
}) {
  const [color, setColor] = useState(selectedColor);
  const [size, setSize] = useState(selectedSize);
  const [search, setSearch] = useState("");
  const [customColor, setCustomColor] = useState(
    selectedColor && !colors.includes(selectedColor) ? selectedColor : ""
  );
  const [customSize, setCustomSize] = useState(
    selectedSize && !sizes.includes(selectedSize) ? selectedSize : ""
  );
  const [isCustomColor, setIsCustomColor] = useState(
    !!selectedColor && !colors.includes(selectedColor)
  );
  const [isCustomSize, setIsCustomSize] = useState(
    !!selectedSize && !sizes.includes(selectedSize)
  );

  const filteredColors = colors.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  const Radio = ({ selected }: { selected: boolean }) => (
    <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 inline-flex items-center justify-center ${selected ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
    </span>
  );

  const handleDone = () => {
    const finalColor = isCustomColor ? customColor : color;
    const finalSize = isCustomSize ? customSize : size;
    onSelect(finalColor, finalSize);
    onAddCustom?.(
      isCustomColor && customColor ? customColor : undefined,
      isCustomSize && customSize ? customSize : undefined,
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex divide-x max-h-72">
        {/* Colors column */}
        <div className="flex-1 flex flex-col">
          <div className="p-2 border-b">
            <div className="relative">
              <input
                className="w-full h-7 text-xs rounded border border-gray-200 px-2 pl-7 focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="Find Color"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredColors.map(c => (
              <button
                key={c}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors ${!isCustomColor && c === color ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => { setColor(c === color ? "" : c); setIsCustomColor(false); setCustomColor(""); }}
              >
                <Radio selected={!isCustomColor && c === color} />
                {c}
              </button>
            ))}
          </div>
          <div className="border-t px-3 py-[6px] flex items-center gap-1.5">
            <button type="button" onClick={() => setIsCustomColor(true)}>
              <Radio selected={isCustomColor} />
            </button>
            <input
              className="flex-1 h-7 text-xs rounded border border-gray-200 px-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Custom color"
              value={customColor}
              onChange={(e) => { setCustomColor(e.target.value); setIsCustomColor(true); }}
              onFocus={() => setIsCustomColor(true)}
            />
          </div>
        </div>

        {/* Sizes column */}
        <div className="flex-1 flex flex-col">
          <div className="p-2 border-b">
            <span className="text-[10px] flex items-center h-7 font-semibold text-gray-500 uppercase">Size</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sizes.map(s => (
              <button
                key={s}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors ${!isCustomSize && s === size ? "bg-blue-50 text-blue-700 font-medium" : ""}`}
                onClick={() => { setSize(s === size ? "" : s); setIsCustomSize(false); setCustomSize(""); }}
              >
                <Radio selected={!isCustomSize && s === size} />
                {s}
              </button>
            ))}
          </div>
          <div className="border-t px-3 py-[6px] flex items-center gap-1.5">
            <button type="button" onClick={() => setIsCustomSize(true)}>
              <Radio selected={isCustomSize} />
            </button>
            <input
              className="flex-1 h-7 text-xs rounded border border-gray-200 px-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Custom size"
              value={customSize}
              onChange={(e) => { setCustomSize(e.target.value); setIsCustomSize(true); }}
              onFocus={() => setIsCustomSize(true)}
            />
          </div>
        </div>
      </div>
      <div className="border-t p-2 flex justify-end">
        <PopoverClose asChild>
          <Button size="sm" onClick={handleDone}>
            Done
          </Button>
        </PopoverClose>
      </div>
    </div>
  );
}
