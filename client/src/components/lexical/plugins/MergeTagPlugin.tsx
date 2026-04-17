import React, { useCallback, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { TextNode } from "lexical";
import { $createMergeTagNode } from "../nodes/MergeTagNode";
import type { MergeField } from "@shared/email-merge-fields";

class MergeTagOption extends MenuOption {
  field: MergeField;

  constructor(field: MergeField) {
    super(field.key);
    this.field = field;
  }
}

interface MergeTagPluginProps {
  mergeFields: MergeField[];
}

export function MergeTagPlugin({ mergeFields }: MergeTagPluginProps) {
  const [editor] = useLexicalComposerContext();

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("{{", {
    minLength: 0,
  });

  const options = useMemo(
    () => mergeFields.map((f) => new MergeTagOption(f)),
    [mergeFields],
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MergeTagOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mergeTagNode = $createMergeTagNode(selectedOption.field.key);
        if (nodeToReplace) {
          nodeToReplace.replace(mergeTagNode);
        }
        closeMenu();
      });
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<MergeTagOption>
      onQueryChange={() => {}}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || options.length === 0) return null;

        return anchorElementRef.current && (
          <div
            className="z-50 mt-1 w-64 rounded-md border bg-popover shadow-lg"
          >
            <div
              className="overflow-y-auto overscroll-contain p-1"
              style={{ maxHeight: "min(240px, 50vh)" }}
              onWheel={(e) => e.stopPropagation()}
            >
              {options.map((option, i) => (
                <div
                  key={option.field.key}
                  className={`flex flex-col rounded-sm px-2 py-1.5 text-sm cursor-pointer ${
                    selectedIndex === i
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => {
                    setHighlightedIndex(i);
                    selectOptionAndCleanUp(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  ref={(el) => option.setRefElement(el)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.field.label}</span>
                    {option.field.kind === "link" && (
                      <span className="text-[10px] rounded bg-blue-100 text-blue-700 px-1">
                        link
                      </span>
                    )}
                  </div>
                  {option.field.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.field.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}
