"use client";

import { Expand, Group, Shrink, Trash2, X } from "lucide-react";
import MathLineField from "./MathLineField";
import { MathLine } from "@/lib/db";
import {
  calculateExpansion,
  calculateFactoring,
  calculateSimplification,
} from "@/lib/compute";

type MagicTool = (value: string) => Promise<string | null>;

interface MathBlockProps {
  lines: MathLine[];
  theme: "light" | "dark";
  focusedLineId: string | null;
  errorLineId: string | null;
  pulses: Record<string, number>;
  onLineChange: (lineIndex: number, val: string) => void;
  onNewLine: (lineIndex: number) => void;
  onNewBlock: () => void;
  onNewTextBlock: () => void;
  onDeleteLine: (lineIndex: number) => void;
  onDeleteBlock: () => void;
  onNavigate: (lineIndex: number, direction: "up" | "down") => void;
  onMoveLine: (lineIndex: number, direction: "up" | "down") => void;
  onMoveBlock: (direction: "up" | "down") => void;
  onMagic: (lineIndex: number, tool: MagicTool) => void;
  canDeleteBlock: boolean;
}

export default function MathBlock({
  lines,
  theme,
  focusedLineId,
  errorLineId,
  pulses,
  onLineChange,
  onNewLine,
  onNewBlock,
  onNewTextBlock,
  onDeleteLine,
  onDeleteBlock,
  onNavigate,
  onMoveLine,
  onMoveBlock,
  onMagic,
  canDeleteBlock,
}: MathBlockProps) {
  return (
    <div
      className={`w-full px-6 py-4 border rounded-xl transition-all relative group ${
        theme === "light"
          ? "bg-white shadow-xs border-neutral-200/70 focus-within:border-neutral-400"
          : "bg-neutral-900/40 shadow-md border-neutral-900 focus-within:border-neutral-800"
      }`}
    >
      <div className="flex flex-col gap-4">
        {lines.map((line, lineIndex) => (
          <div key={line.id} className="w-full group/line relative">
            <MathLineField
              id={`input-${line.id}`}
              initialValue={line.latex}
              onChange={(val) => onLineChange(lineIndex, val)}
              onNewLine={() => onNewLine(lineIndex)}
              onNewBlock={onNewBlock}
              onNewTextBlock={onNewTextBlock}
              onDeleteLine={() => onDeleteLine(lineIndex)}
              onDeleteBlock={onDeleteBlock}
              onNavigate={(direction) => onNavigate(lineIndex, direction)}
              onMoveLine={(direction) => onMoveLine(lineIndex, direction)}
              onMoveBlock={onMoveBlock}
              theme={theme}
              autoFocus={focusedLineId === line.id}
              hasError={errorLineId === line.id}
              pulseKey={pulses[line.id]}
            />

            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/line:opacity-100 transition-opacity duration-150 flex flex-col gap-1">
              <button
                onClick={() => onMagic(lineIndex, calculateFactoring)}
                className={`p-1 border rounded-md transition-colors cursor-pointer w-min h-min ${
                  theme === "light"
                    ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                }`}
                title="factor"
              >
                <Group className="w-3 h-3" />
              </button>
              <button
                onClick={() =>
                  onMagic(lineIndex, calculateSimplification)
                }
                className={`p-1 border rounded-md transition-colors cursor-pointer w-min h-min ${
                  theme === "light"
                    ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                }`}
                title="simplify"
              >
                <Shrink className="w-3 h-3" />
              </button>
              <button
                onClick={() => onMagic(lineIndex, calculateExpansion)}
                className={`p-1 border rounded-md transition-colors cursor-pointer w-min h-min ${
                  theme === "light"
                    ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                }`}
                title="expand"
              >
                <Expand className="w-3 h-3" />
              </button>
              {lines.length > 1 && (
                <button
                  onClick={() => onDeleteLine(lineIndex)}
                  className={`p-1 border rounded-md transition-colors cursor-pointer w-min h-min ${
                    theme === "light"
                      ? "bg-white border-neutral-200 text-neutral-400 hover:text-red-500"
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-red-400"
                  }`}
                  title="delete line"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canDeleteBlock && (
        <button
          onClick={onDeleteBlock}
          className={`absolute -top-2.5 -right-2.5 opacity-0 group-hover:opacity-100 p-1.5 border rounded-full transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white border-neutral-200 text-neutral-400 hover:text-red-500"
              : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-red-400"
          }`}
          title="delete block (Ctrl+Backspace)"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
