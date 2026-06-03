import { ComputeEngine } from "@cortex-js/compute-engine";

const ce = new ComputeEngine();
ce.angularUnit = "deg";

export function evaluateMath(latexInput: string): string | null {
  if (!latexInput || !latexInput.trim()) return null;

  try {
    const cleanInput = latexInput.replace(/\\text{[^}]*}/g, "").trim();

    if (!cleanInput.includes("=")) {
      const parsed = ce.parse(cleanInput);
      const evaluated = parsed.evaluate();
      return evaluated.latex;
    }

    const segments = cleanInput
      .split("=")
      .map((seg) => seg.trim())
      .filter(Boolean);
    if (segments.length === 0) return null;

    const baseExpression = segments[0];
    const parsedBase = ce.parse(baseExpression);
    const evaluatedBase = parsedBase.evaluate();
    const serializedResult = evaluatedBase.latex;

    if (segments.length === 1 || cleanInput.endsWith("=")) {
      return serializedResult;
    }

    const lastSegment = segments[segments.length - 1];
    const parsedLast = ce.parse(lastSegment);
    const evaluatedLast = parsedLast.evaluate();

    if (evaluatedBase.isEqual(evaluatedLast)) {
      return serializedResult;
    }

    return evaluatedLast.latex;
  } catch (error) {
    console.error(error);
    return null;
  }
}
