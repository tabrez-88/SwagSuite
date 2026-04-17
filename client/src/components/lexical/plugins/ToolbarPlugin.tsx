import React, { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $isHeadingNode, $createHeadingNode, HeadingTagType } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $getNearestNodeOfType } from "@lexical/utils";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Heading2,
  Heading3,
  Tags,
  Undo,
  Redo,
} from "lucide-react";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $createMergeTagNode } from "../nodes/MergeTagNode";
import type { MergeField } from "@shared/email-merge-fields";

interface ToolbarPluginProps {
  mode?: "full" | "notes";
  mergeFields?: MergeField[];
}

export function ToolbarPlugin({ mode = "full", mergeFields = [] }: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [showMergeMenu, setShowMergeMenu] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode);
        setBlockType(parentList ? parentList.getListType() : element.getType());
      } else if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else {
        setBlockType("paragraph");
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  const formatHeading = (tag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (blockType === tag) {
          // Toggle off — back to paragraph
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(tag));
        }
      }
    });
  };

  const insertMergeTag = (field: MergeField) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = $createMergeTagNode(field.key);
        selection.insertNodes([node]);
      }
    });
    setShowMergeMenu(false);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded hover:bg-accent transition-colors ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`;

  return (
    <div className="flex items-center gap-0.5 border-b px-2 py-1 flex-wrap">
      {/* Undo/Redo */}
      <button
        type="button"
        className={btnClass(false)}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btnClass(false)}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Text formatting */}
      <button
        type="button"
        className={btnClass(isBold)}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btnClass(isItalic)}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btnClass(isUnderline)}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Lists */}
      <button
        type="button"
        className={btnClass(blockType === "bullet")}
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btnClass(blockType === "number")}
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>

      {/* Link */}
      <button
        type="button"
        className={btnClass(false)}
        onClick={insertLink}
        title="Insert Link"
      >
        <Link className="h-4 w-4" />
      </button>

      {/* Headings — full mode only */}
      {mode === "full" && (
        <>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            type="button"
            className={btnClass(blockType === "h2")}
            onClick={() => formatHeading("h2")}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={btnClass(blockType === "h3")}
            onClick={() => formatHeading("h3")}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Merge tag inserter — full mode only, when fields provided */}
      {mode === "full" && mergeFields.length > 0 && (
        <>
          <div className="w-px h-5 bg-border mx-1" />
          <div className="relative">
            <button
              type="button"
              className={btnClass(showMergeMenu)}
              onClick={() => setShowMergeMenu(!showMergeMenu)}
              title="Insert Merge Tag"
            >
              <Tags className="h-4 w-4" />
            </button>
            {showMergeMenu && (
              <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-md border bg-popover shadow-lg">
                <div className="max-h-60 overflow-y-auto p-1">
                  {mergeFields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      className="w-full text-left rounded-sm px-2 py-1.5 text-sm hover:bg-accent flex items-center justify-between"
                      onClick={() => insertMergeTag(field)}
                    >
                      <span>{field.label}</span>
                      {field.kind === "link" && (
                        <span className="text-[10px] rounded bg-blue-100 text-blue-700 px-1">
                          link
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
