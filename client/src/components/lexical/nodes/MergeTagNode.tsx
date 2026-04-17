import React from "react";
import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";

export type SerializedMergeTagNode = Spread<
  { mergeTagKey: string; type: "merge-tag"; version: 1 },
  SerializedLexicalNode
>;

function convertMergeTagElement(domNode: HTMLElement): DOMConversionOutput | null {
  const key = domNode.getAttribute("data-merge-tag");
  if (key) {
    return { node: $createMergeTagNode(key) };
  }
  return null;
}

function MergeTagPill({ mergeTagKey }: { mergeTagKey: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 select-none cursor-default"
      title={mergeTagKey}
    >
      {`{{${mergeTagKey}}}`}
    </span>
  );
}

export class MergeTagNode extends DecoratorNode<React.ReactElement> {
  __mergeTagKey: string;

  static getType(): string {
    return "merge-tag";
  }

  static clone(node: MergeTagNode): MergeTagNode {
    return new MergeTagNode(node.__mergeTagKey, node.__key);
  }

  constructor(mergeTagKey: string, key?: NodeKey) {
    super(key);
    this.__mergeTagKey = mergeTagKey;
  }

  getMergeTagKey(): string {
    return this.__mergeTagKey;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline";
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement("span");
    span.setAttribute("data-merge-tag", this.__mergeTagKey);
    span.textContent = `{{${this.__mergeTagKey}}}`;
    return { element: span };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (node: HTMLElement) => {
        if (!node.hasAttribute("data-merge-tag")) return null;
        return { conversion: convertMergeTagElement, priority: 1 };
      },
    };
  }

  exportJSON(): SerializedMergeTagNode {
    return {
      mergeTagKey: this.__mergeTagKey,
      type: "merge-tag",
      version: 1,
    };
  }

  static importJSON(json: SerializedMergeTagNode): MergeTagNode {
    return $createMergeTagNode(json.mergeTagKey);
  }

  isInline(): boolean {
    return true;
  }

  isIsolated(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  getTextContent(): string {
    return `{{${this.__mergeTagKey}}}`;
  }

  decorate(): React.ReactElement {
    return <MergeTagPill mergeTagKey={this.__mergeTagKey} />;
  }
}

export function $createMergeTagNode(key: string): MergeTagNode {
  return new MergeTagNode(key);
}

export function $isMergeTagNode(node: LexicalNode | null | undefined): node is MergeTagNode {
  return node instanceof MergeTagNode;
}
