import type {
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { DecoratorNode } from "lexical";
import * as React from "react";
import { useEffect, useRef } from "react";
import { render as katexRender } from "katex";

type EquationComponentProps = {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
};

function EquationComponent({
  equation,
  inline,
}: EquationComponentProps): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      katexRender(equation, element, {
        throwOnError: false,
        displayMode: !inline,
      });
    }
  }, [equation, inline]);

  return <span ref={ref} />;
}

export type SerializedEquationNode = Spread<
  {
    type: "equation";
    equation: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

export class EquationNode extends DecoratorNode<React.JSX.Element> {
  __equation: string;
  __inline: boolean;

  static getType(): string {
    return "equation";
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key);
  }

  constructor(equation: string, inline?: boolean, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline ?? false;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement("span");
    const theme = config.theme as {
      equation?: string;
      inlineEquation?: string;
    };
    const className = this.__inline ? theme.inlineEquation : theme.equation;
    if (typeof className === "string") {
      element.className = className;
    }
    return element;
  }

  updateDOM(prevNode: EquationNode): boolean {
    return (
      prevNode.__equation !== this.__equation ||
      prevNode.__inline !== this.__inline
    );
  }

  getEquation(): string {
    return this.__equation;
  }

  getInline(): boolean {
    return this.__inline;
  }

  decorate(): React.JSX.Element {
    return (
      <EquationComponent
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.getKey()}
      />
    );
  }

  static importJSON(serializedNode: SerializedEquationNode): EquationNode {
    return $createEquationNode(serializedNode.equation, serializedNode.inline);
  }

  exportJSON(): SerializedEquationNode {
    return {
      type: "equation",
      equation: this.__equation,
      inline: this.__inline,
      version: 1,
    };
  }
}

export function $createEquationNode(
  equation: string,
  inline?: boolean,
): EquationNode {
  return new EquationNode(equation, inline);
}

export function $isEquationNode(
  node: LexicalNode | null | undefined,
): node is EquationNode {
  return node instanceof EquationNode;
}
