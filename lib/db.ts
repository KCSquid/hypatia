import Dexie, { type Table } from "dexie";

export interface BlockItem {
  id: string;
  type: "math" | "text" | "separator";
  latex: string;
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
