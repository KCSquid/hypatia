import { ComputeEngine, expandAll, simplify } from "@cortex-js/compute-engine";
import { db } from "./db";

const ce = new ComputeEngine();

export async function evaluateMath(latexInput: string): Promise<string | null> {
  if (!latexInput || !latexInput.trim()) return null;

  const angularUnit = await db.config.get("angle");
  ce.angularUnit = angularUnit?.value ?? "deg";

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

export async function calculateSimplification(
  latexInput: string,
): Promise<string | null> {
  if (!latexInput || !latexInput.trim()) return null;

  const angularUnit = await db.config.get("angle");
  ce.angularUnit = angularUnit?.value ?? "deg";

  try {
    const cleanInput = latexInput.replace(/\\text{[^}]*}/g, "").trim();
    const res = simplify(cleanInput);

    return res.latex;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function calculateExpansion(
  latexInput: string,
): Promise<string | null> {
  if (!latexInput || !latexInput.trim()) return null;

  const angularUnit = await db.config.get("angle");
  ce.angularUnit = angularUnit?.value ?? "deg";

  try {
    const cleanInput = latexInput.replace(/\\text{[^}]*}/g, "").trim();
    const res = expandAll(cleanInput);

    return res.latex;
  } catch (error) {
    console.error(error);
    return null;
  }
}
