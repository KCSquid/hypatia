import { BlockItem, NotebookPage } from "./db";

export function aiToBlocks(
  aiInput: { type: "math" | "text" | "separator"; value?: string }[],
): BlockItem[] {
  const time = Date.now();
  const output: BlockItem[] = [];

  let i = 0;
  for (const input of aiInput) {
    if (input.type === "text")
      input.value = input.value?.replace(/\$/g, "").replace(/\\r\\n/g, "");
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

  const query = await queryOllama({
    model: "gemma4",
    prompt,
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
