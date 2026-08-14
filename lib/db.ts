import Dexie, { type Table } from "dexie";

export interface MathLine {
  id: string;
  latex: string;
}

export interface BlockItem {
  id: string;
  type: "math" | "text" | "separator";
  /** Used by "text" blocks (and unused by "separator"). Math blocks store
   *  their content in `lines` instead; `latex` is kept only so pages saved
   *  before multi-line math blocks existed still load correctly. */
  latex: string;
  /** Only present on "math" blocks. One or more sub-steps (1a, 1b, 1c...)
   *  grouped together in a single visual block. */
  lines?: MathLine[];
}

/** Returns a math block's lines, migrating legacy single-`latex` blocks
 *  (saved before multi-line blocks existed) into the `lines` shape. */
export function getMathLines(block: BlockItem): MathLine[] {
  if (block.lines && block.lines.length > 0) return block.lines;
  return [{ id: block.id, latex: block.latex }];
}

export interface NotebookPage {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  blocks: BlockItem[];
}

export interface ConfigItem {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

class HypatiaDatabase extends Dexie {
  pages!: Table<NotebookPage>;
  config!: Table<ConfigItem>;

  constructor() {
    super("HypatiaDatabase");
    this.version(1).stores({
      pages: "id, title, createdAt, updatedAt",
      config: "key",
    });
  }
}

export const db = new HypatiaDatabase();
