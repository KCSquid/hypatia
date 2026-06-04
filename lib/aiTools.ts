import { BlockItem, NotebookPage } from "./db";

export function aiToBlocks(
  aiInput: { type: "math" | "text" | "separator"; value?: string }[],
): BlockItem[] {
  const time = Date.now();
  const output: BlockItem[] = [];

  let i = 0;
  for (const input of aiInput) {
    output.push({
      id: `block_ai_${time}_${i}`,
      type: input.type,
      latex: input.value || "",
    });
    i++;
  }

  return output;
}

interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  [key: string]: unknown;
}

async function queryOllama(
  request: OllamaRequest,
): Promise<OllamaResponse | null> {
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const data: OllamaResponse = await res.json();
    return data;
  } catch (err) {
    console.error("Error querying Ollama:", err);
  }

  return null;
}

export async function aiAnswer(prompt: string, pageData: NotebookPage) {
  if (!pageData) return;

  const PROMPT = `You are a mathematical pedagogy engine. Your task is to break down the provided word problem into an instructional, step-by-step tutorial. You must output the response strictly as a valid JSON array of objects, with no markdown formatting wrappers (like \`\`\`json) outside the payload if streaming directly, or strictly conforming to this TypeScript type:

type OutputBlock = 
  | { type: "text"; value: string }
  | { type: "math"; value: string }
  | { type: "separator" };

Instructions for content generation:
1. "text" blocks must explain the conceptual 'why' behind the next step in clear, friendly prose.
2. "math" blocks must contain exactly ONE single-line LaTeX expression. Do not use multiline formatting, linebreaks (\\), alignment characters (&), or environment blocks (\begin{...}). 
3. Break down algebra granularly. Every algebraic mutation, substitution, or simplification step requires its own "math" block.
4. Use a "separator" block to segment major shifts in the problem-solving phase (e.g., between "Defining Variables", "Setting up Equations", "Performing Calculus/Optimization", and "Final Answer Conclusion").
5. Ensure all LaTeX tokens are basic, standard symbols compatible with MathLive math-fields (e.g., use \cdot for multiplication, standard fractions, and basic exponents).

Word Problem to solve:
${prompt}`;

  const query = await queryOllama({
    model: "gemma4",
    prompt: PROMPT,
  });

  if (!query) return [];
  const output = aiToBlocks(
    JSON.parse(query.response.replace(/(?<!\\)\\(?!\\)/g, "\\\\")),
  );

  const updated = [...pageData.blocks];
  for (const out of output) {
    updated.push(out);
  }

  return updated;
}
