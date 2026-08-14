"use client";

import React, { useCallback, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, BlockItem, MathLine, NotebookPage, getMathLines } from "@/lib/db";
import MathBlock from "./MathBlock";
import TextBlock from "./TextBlock";
import { X, Type, Sigma, Columns } from "lucide-react";

interface NotebookProps {
  activePageId: string | null;
  theme: "light" | "dark";
}

type FocusUnit =
  | { kind: "text"; blockIndex: number; id: string }
  | { kind: "line"; blockIndex: number; lineIndex: number; id: string };

function flattenUnits(blocks: BlockItem[]): FocusUnit[] {
  const units: FocusUnit[] = [];
  blocks.forEach((block, blockIndex) => {
    if (block.type === "text") {
      units.push({ kind: "text", blockIndex, id: block.id });
    } else if (block.type === "math") {
      getMathLines(block).forEach((line, lineIndex) => {
        units.push({ kind: "line", blockIndex, lineIndex, id: line.id });
      });
    }
  });
  return units;
}

export default function Notebook({ activePageId, theme }: NotebookProps) {
  const pageData = useLiveQuery(
    () => (activePageId ? db.pages.get(activePageId) : undefined),
    [activePageId],
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [pulses, setPulses] = useState<Record<string, number>>({});

  const [trackedPageId, setTrackedPageId] = useState(activePageId);
  if (activePageId !== trackedPageId) {
    setTrackedPageId(activePageId);
    setFocusedId(null);
  }

  const getTimestamp = useCallback(() => Date.now(), []);

  const saveToDisk = async (updatedBlocks: BlockItem[]) => {
    if (!activePageId || !pageData) return;
    const updatedPage: NotebookPage = {
      ...pageData,
      blocks: updatedBlocks,
      updatedAt: getTimestamp(),
    };
    await db.pages.put(updatedPage);
  };

  const navigateFocus = (currentId: string, direction: "up" | "down") => {
    if (!pageData) return;
    const units = flattenUnits(pageData.blocks);
    const idx = units.findIndex((u) => u.id === currentId);
    if (idx === -1) return;
    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= units.length) return;
    setFocusedId(units[nextIdx].id);
  };

  const addBlockBelow = (index: number, type: "math" | "text" = "math") => {
    if (!pageData) return;
    const newBlock: BlockItem =
      type === "math"
        ? {
            id: `block_${getTimestamp()}`,
            type,
            latex: "",
            lines: [{ id: `line_${getTimestamp()}`, latex: "" }],
          }
        : { id: `block_${getTimestamp()}`, type, latex: "" };
    const updated = [...pageData.blocks];
    updated.splice(index + 1, 0, newBlock);
    setFocusedId(
      newBlock.type === "math" ? newBlock.lines![0].id : newBlock.id,
    );
    saveToDisk(updated);
  };

  const addSeparator = (index: number) => {
    if (!pageData) return;
    const updated = [...pageData.blocks];
    const sepBlock: BlockItem = {
      id: `sep_${getTimestamp()}`,
      type: "separator",
      latex: "",
    };

    updated.splice(index + 1, 0, sepBlock);

    if (index + 1 === updated.length - 1) {
      const lineId = `line_${getTimestamp() + 1}`;
      const followBlock: BlockItem = {
        id: `block_${getTimestamp() + 1}`,
        type: "math",
        latex: "",
        lines: [{ id: lineId, latex: "" }],
      };
      updated.push(followBlock);
      setFocusedId(lineId);
    } else {
      const nextValidBlock = updated[index + 2];
      if (nextValidBlock && nextValidBlock.type !== "separator") {
        const firstUnitId =
          nextValidBlock.type === "math"
            ? getMathLines(nextValidBlock)[0].id
            : nextValidBlock.id;
        setFocusedId(firstUnitId);
      }
    }

    saveToDisk(updated);
  };

  const updateTextValue = (blockIndex: number, val: string) => {
    if (!pageData) return;
    const block = pageData.blocks[blockIndex];
    if (block.id === errorId) setErrorId(null);
    const updated = [...pageData.blocks];
    updated[blockIndex] = { ...block, latex: val };
    saveToDisk(updated);
  };

  const updateLineValue = (
    blockIndex: number,
    lineIndex: number,
    val: string,
  ) => {
    if (!pageData) return;
    const block = pageData.blocks[blockIndex];
    const lines = getMathLines(block).map((l) => ({ ...l }));
    if (lines[lineIndex].id === errorId) setErrorId(null);
    lines[lineIndex] = { ...lines[lineIndex], latex: val };
    const updated = [...pageData.blocks];
    updated[blockIndex] = { ...block, lines };
    saveToDisk(updated);
  };

  const addLineBelow = (blockIndex: number, lineIndex: number) => {
    if (!pageData) return;
    const block = pageData.blocks[blockIndex];
    const lines = getMathLines(block).map((l) => ({ ...l }));
    const newLine: MathLine = { id: `line_${getTimestamp()}`, latex: "" };
    lines.splice(lineIndex + 1, 0, newLine);
    const updated = [...pageData.blocks];
    updated[blockIndex] = { ...block, lines };
    setFocusedId(newLine.id);
    saveToDisk(updated);
  };

  const removeBlock = (blockIndex: number) => {
    if (!pageData || pageData.blocks.length === 1) return;
    const updated = pageData.blocks.filter((_, i) => i !== blockIndex);
    const units = flattenUnits(updated);

    const prevUnits = units.filter((u) => u.blockIndex === blockIndex - 1);
    const nextUnits = units.filter((u) => u.blockIndex === blockIndex);
    if (prevUnits.length > 0) {
      setFocusedId(prevUnits[prevUnits.length - 1].id);
    } else if (nextUnits.length > 0) {
      setFocusedId(nextUnits[0].id);
    } else {
      setFocusedId(units[0]?.id ?? null);
    }

    saveToDisk(updated);
  };

  const removeLine = (blockIndex: number, lineIndex: number) => {
    if (!pageData) return;
    const block = pageData.blocks[blockIndex];
    const lines = getMathLines(block);
    if (lines.length <= 1) {
      removeBlock(blockIndex);
      return;
    }

    const newLines = lines.filter((_, i) => i !== lineIndex).map((l) => ({ ...l }));
    const updated = [...pageData.blocks];
    updated[blockIndex] = { ...block, lines: newLines };
    const targetIndex = lineIndex === 0 ? 0 : lineIndex - 1;
    setFocusedId(newLines[targetIndex]?.id ?? null);
    saveToDisk(updated);
  };

  const moveLine = (
    blockIndex: number,
    lineIndex: number,
    direction: "up" | "down",
  ) => {
    if (!pageData) return;
    const block = pageData.blocks[blockIndex];
    const lines = getMathLines(block).map((l) => ({ ...l }));
    const targetIndex = direction === "up" ? lineIndex - 1 : lineIndex + 1;
    if (targetIndex < 0 || targetIndex >= lines.length) return;
    [lines[lineIndex], lines[targetIndex]] = [
      lines[targetIndex],
      lines[lineIndex],
    ];
    const updated = [...pageData.blocks];
    updated[blockIndex] = { ...block, lines };
    saveToDisk(updated);
  };

  const moveBlock = (blockIndex: number, direction: "up" | "down") => {
    if (!pageData) return;
    const targetIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (targetIndex < 0 || targetIndex >= pageData.blocks.length) return;
    const updated = [...pageData.blocks];
    [updated[blockIndex], updated[targetIndex]] = [
      updated[targetIndex],
      updated[blockIndex],
    ];
    saveToDisk(updated);
  };

  const handleGlobalKeys = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "m" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addSeparator(index);
    }
  };

  const magicFunction = async (
    blockIndex: number,
    lineIndex: number,
    tool: (value: string) => Promise<string | null>,
  ) => {
    if (!pageData) return;
    const block = pageData.blocks[blockIndex];
    const lines = getMathLines(block);
    const currentValue = lines[lineIndex].latex;
    if (!currentValue) return;

    try {
      const result = await tool(currentValue);
      if (!result || result.trim() === currentValue.trim()) return;
      if (result.includes("\\error")) {
        setErrorId(lines[lineIndex].id);
        return;
      }

      const lineId = lines[lineIndex].id;
      updateLineValue(blockIndex, lineIndex, result);
      setPulses((p) => ({ ...p, [lineId]: (p[lineId] || 0) + 1 }));
    } catch (err) {
      console.log("error:", err);
    }
  };

  if (!activePageId || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center text-neutral-400 font-light text-xs tracking-wider h-64 font-mono select-none opacity-50">
        create a new page from the sidebar!
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col items-center space-y-1.5 relative">
      {pageData.blocks.map((block, index) => {
        if (block.type === "separator") {
          return (
            <div
              key={block.id}
              className="w-full group relative py-3 flex items-center justify-center"
            >
              <div
                className={`w-full h-px border-t border-dashed ${theme === "light" ? "border-neutral-300" : "border-neutral-800"}`}
              />
              <button
                onClick={() => removeBlock(index)}
                className={`absolute -right-10 opacity-0 group-hover:opacity-100 p-1.5 border rounded-md transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white border-neutral-200 text-neutral-400 hover:text-red-500 hover:border-red-200"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-red-400 hover:border-red-900/50"
                }`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        }

        if (block.type === "text") {
          const isFocused = focusedId === block.id;
          return (
            <div
              key={block.id}
              className="w-full group relative"
              onKeyDown={(e) => handleGlobalKeys(e, index)}
            >
              <TextBlock
                id={`input-${block.id}`}
                initialValue={block.latex}
                onChange={(val) => updateTextValue(index, val)}
                onEnterPress={() => addBlockBelow(index, "math")}
                onBackspaceEmpty={() => removeBlock(index)}
                theme={theme}
                autoFocus={isFocused}
              />

              {pageData.blocks.length > 1 && (
                <button
                  onClick={() => removeBlock(index)}
                  className={`absolute left-full ml-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 border rounded-md transition-colors cursor-pointer w-min h-min ${
                    theme === "light"
                      ? "bg-white border-neutral-200 text-neutral-400 hover:text-red-500"
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-red-400"
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        }

        const lines = getMathLines(block);

        return (
          <div
            key={block.id}
            className="w-full relative"
            onKeyDown={(e) => handleGlobalKeys(e, index)}
          >
            <MathBlock
              lines={lines}
              theme={theme}
              focusedLineId={focusedId}
              errorLineId={errorId}
              pulses={pulses}
              onLineChange={(lineIndex, val) =>
                updateLineValue(index, lineIndex, val)
              }
              onNewLine={(lineIndex) => addLineBelow(index, lineIndex)}
              onNewBlock={() => addBlockBelow(index, "math")}
              onNewTextBlock={() => addBlockBelow(index, "text")}
              onDeleteLine={(lineIndex) => removeLine(index, lineIndex)}
              onDeleteBlock={() => removeBlock(index)}
              onNavigate={(lineIndex, direction) =>
                navigateFocus(lines[lineIndex].id, direction)
              }
              onMoveLine={(lineIndex, direction) =>
                moveLine(index, lineIndex, direction)
              }
              onMoveBlock={(direction) => moveBlock(index, direction)}
              onMagic={(lineIndex, tool) => magicFunction(index, lineIndex, tool)}
              canDeleteBlock={pageData.blocks.length > 1}
            />
          </div>
        );
      })}
      <div className="opacity-0 hover:opacity-100 transition-opacity duration-250 w-full flex items-center justify-between gap-2 h-8">
        <button
          onClick={() => addBlockBelow(Infinity, "math")}
          className={`p-1 border-dashed hover:shadow-sm active:shadow-none flex-1 h-full flex items-center justify-center border rounded-md transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
              : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
          }`}
        >
          <Sigma className="w-3 h-3" />
        </button>
        <button
          onClick={() => addBlockBelow(Infinity, "text")}
          className={`p-1 border-dashed hover:shadow-sm active:shadow-none flex-1 h-full flex items-center justify-center border rounded-md transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
              : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
          }`}
        >
          <Type className="w-3 h-3" />
        </button>
        <button
          onClick={() => addSeparator(pageData.blocks.length - 1)}
          className={`p-1 border-dashed hover:shadow-sm active:shadow-none flex-1 h-full flex items-center justify-center border rounded-md transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
              : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
          }`}
        >
          <Columns className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
