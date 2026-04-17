import React, { useCallback, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $insertNodes,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  EditorState,
  SerializedEditorState,
} from "lexical";

import { MergeTagNode, $isMergeTagNode } from "./nodes/MergeTagNode";
import { MergeTagPlugin } from "./plugins/MergeTagPlugin";
import { ToolbarPlugin } from "./plugins/ToolbarPlugin";
import type { MergeField } from "@shared/email-merge-fields";

export interface RichEmailEditorOutput {
  html: string;
  json: SerializedEditorState;
}

export interface RichEmailEditorProps {
  /** "full" = all toolbar options + merge tags. "notes" = bold/italic/list/link only */
  mode?: "full" | "notes";
  /** Available merge fields for typeahead + toolbar inserter */
  mergeFields?: MergeField[];
  /** Called on every editor change */
  onChange?: (output: RichEmailEditorOutput) => void;
  /** Initial HTML content to load */
  initialHtml?: string;
  /** Initial Lexical JSON state (takes precedence over initialHtml) */
  initialJson?: SerializedEditorState;
  /** Placeholder text */
  placeholder?: string;
  /** Min height of editor area */
  minHeight?: string;
  /** CSS class for outer wrapper */
  className?: string;
  /** Whether editor is read-only */
  readOnly?: boolean;
}

const theme = {
  paragraph: "mb-1",
  heading: {
    h2: "text-xl font-bold mb-2",
    h3: "text-lg font-semibold mb-1",
  },
  list: {
    ul: "list-disc ml-4 mb-1",
    ol: "list-decimal ml-4 mb-1",
    listitem: "mb-0.5",
  },
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
  link: "text-blue-600 underline cursor-pointer",
};

function onError(error: Error) {
  console.error("[RichEmailEditor]", error);
}

/** Plugin that loads initial HTML content into the editor */
function InitialHtmlPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !html) return;
    loaded.current = true;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      $insertNodes(nodes);
    });
  }, [editor, html]);

  return null;
}

/** Plugin that handles backspace/delete for decorator nodes like MergeTagNode */
function DecoratorBackspacePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if ($isNodeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            if ($isMergeTagNode(node)) node.remove();
          });
          return true;
        }
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const anchor = selection.anchor;
          if (anchor.type === "element" && anchor.offset > 0) {
            const element = anchor.getNode();
            const prevChild = element.getChildAtIndex(anchor.offset - 1);
            if ($isMergeTagNode(prevChild)) {
              event.preventDefault();
              prevChild.remove();
              return true;
            }
          }
          if (anchor.type === "text" && anchor.offset === 0) {
            const textNode = anchor.getNode();
            const prev = textNode.getPreviousSibling();
            if ($isMergeTagNode(prev)) {
              event.preventDefault();
              prev.remove();
              return true;
            }
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const removeDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if ($isNodeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            if ($isMergeTagNode(node)) node.remove();
          });
          return true;
        }
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const anchor = selection.anchor;
          if (anchor.type === "text") {
            const textNode = anchor.getNode();
            if (anchor.offset === textNode.getTextContentSize()) {
              const next = textNode.getNextSibling();
              if ($isMergeTagNode(next)) {
                event.preventDefault();
                next.remove();
                return true;
              }
            }
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      removeBackspace();
      removeDelete();
    };
  }, [editor]);

  return null;
}

/** Plugin that exposes editor instance via ref for external control */
function EditorRefPlugin({
  editorRef,
}: {
  editorRef: React.MutableRefObject<ReturnType<typeof useLexicalComposerContext>[0] | null>;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editorRef.current = editor;
  }, [editor, editorRef]);
  return null;
}

export function RichEmailEditor({
  mode = "full",
  mergeFields = [],
  onChange,
  initialHtml = "",
  initialJson,
  placeholder = "Start typing...",
  minHeight = "200px",
  className = "",
  readOnly = false,
}: RichEmailEditorProps) {
  const editorRef = useRef<ReturnType<typeof useLexicalComposerContext>[0] | null>(null);

  const initialConfig = {
    namespace: "RichEmailEditor",
    theme,
    onError,
    editable: !readOnly,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      MergeTagNode,
    ],
    ...(initialJson ? { editorState: JSON.stringify(initialJson) } : {}),
  };

  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (!onChange) return;

      editorState.read(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const html = $generateHtmlFromNodes(editor);
        const json = editorState.toJSON();
        onChange({ html, json });
      });
    },
    [onChange],
  );

  return (
    <div className={`rounded-md border bg-background ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        {!readOnly && (
          <ToolbarPlugin mode={mode} mergeFields={mode === "full" ? mergeFields : []} />
        )}
        <div className="relative" style={{ minHeight }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="outline-none px-3 py-2 prose prose-sm max-w-none min-h-full"
                style={{ minHeight }}
              />
            }
            placeholder={
              <div className="absolute top-2 left-3 text-muted-foreground pointer-events-none text-sm">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} />
        <DecoratorBackspacePlugin />
        <EditorRefPlugin editorRef={editorRef} />
        {!initialJson && initialHtml && <InitialHtmlPlugin html={initialHtml} />}
        {mode === "full" && mergeFields.length > 0 && (
          <MergeTagPlugin mergeFields={mergeFields} />
        )}
      </LexicalComposer>
    </div>
  );
}

export default RichEmailEditor;
