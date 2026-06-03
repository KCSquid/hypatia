import type {} from "react";

interface MathfieldElement extends HTMLElement {
  value: string;
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement> & {
          value?: string;
        },
        MathfieldElement
      >;
    }
  }
}
