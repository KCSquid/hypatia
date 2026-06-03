"use client";

import React, { useEffect, useState, useCallback } from "react";
import { db, BlockItem, NotebookPage } from "@/lib/db";
import MathBlock from "./MathBlock";
import TextBlock from "./TextBlock";
import { X, Type, Sigma, Columns, Expand, Shrink, Group } from "lucide-react";
import {
  calculateSimplification,
  calculateExpansion,
  calculateFactoring,
} from "@/lib/compute";

interface NotebookProps {
  activePageId: string | null;
  theme: "light" | "dark";
  title: string;
}

export default function Notebook({
  activePageId,
  theme,
  title,
}: NotebookProps) {
  const [pageData, setPageData] = useState<NotebookPage | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    function check() {
      if (!activePageId) {
        setPageData(null);
        setFocusedBlockId(null);
        return true;
      }
      return false;
    }

    if (check()) return;

    const loadPage = async () => {
      const page = await db.pages.get(activePageId);
      if (page) setPageData(page);
    };
    loadPage();
  }, [activePageId]);

  const getTimestamp = useCallback(() => Date.now(), []);

  const saveToDisk = async (updatedBlocks: BlockItem[]) => {
    if (!activePageId || !pageData) return;
    const updatedPage: NotebookPage = {
      ...pageData,
      title: title,
      blocks: updatedBlocks,
      updatedAt: getTimestamp(),
    };
    setPageData(updatedPage);
    await db.pages.put(updatedPage);
  };

  const addBlockBelow = (index: number, type: "math" | "text" = "math") => {
    if (!pageData) return;
    const newBlock: BlockItem = {
      id: `block_${getTimestamp()}`,
      type,
      latex: "",
    };
    const updated = [...pageData.blocks];
    updated.splice(index + 1, 0, newBlock);
    setFocusedBlockId(newBlock.id);
    saveToDisk(updated);
  };

  const handleEnterKeyProgress = (
    index: number,
    currentType: "math" | "text",
  ) => {
    const nextType = currentType === "text" ? "math" : "math";
    addBlockBelow(index, nextType);
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
      const followBlock: BlockItem = {
        id: `block_${getTimestamp() + 1}`,
        type: "math",
        latex: "",
      };
      updated.push(followBlock);
      setFocusedBlockId(followBlock.id);
    } else {
      const nextValidBlock = updated[index + 2];
      if (nextValidBlock && nextValidBlock.type !== "separator") {
        setFocusedBlockId(nextValidBlock.id);
      }
    }

    saveToDisk(updated);
  };

  const updateBlockValue = (index: number, val: string) => {
    if (!pageData) return;
    if (index === error) {
      setError(null);
    }
    const updated = [...pageData.blocks];
    updated[index].latex = val;
    saveToDisk(updated);
  };

  const removeBlock = (index: number) => {
    if (!pageData || pageData.blocks.length === 1) return;
    const updated = pageData.blocks.filter((_, i) => i !== index);

    const targetIndex = index === 0 ? 0 : index - 1;
    const prevBlock = updated[targetIndex];
    if (prevBlock && prevBlock.type !== "separator") {
      setFocusedBlockId(prevBlock.id);
    } else if (updated[index] && updated[index].type !== "separator") {
      setFocusedBlockId(updated[index].id);
    }

    saveToDisk(updated);
  };

  const handleGlobalKeys = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "m" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addSeparator(index);
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      addBlockBelow(index, "text");
    }
  };

  if (!activePageId || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center text-neutral-400 font-light text-xs tracking-wider h-64 font-mono select-none opacity-50">
        open drawer menu to begin computation
      </div>
    );
  }

  const magicFunction = async (
    index: number,
    tool: (value: string) => Promise<string | null>,
  ) => {
    const currentValue = pageData.blocks[index].latex;
    if (!currentValue) {
      return;
    }
    try {
      const result = await tool(currentValue);
      if (!result || result.trim() === currentValue.trim()) return;
      if (result.includes("\\error")) {
        console.log(result);
        setError(index);
        return;
      }

      updateBlockValue(index, result);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      console.log("error");
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center space-y-1.5">
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

        const isFocused = focusedBlockId === block.id;

        return (
          <div
            key={block.id}
            className="w-full group relative"
            onKeyDown={(e) => handleGlobalKeys(e, index)}
          >
            {block.type === "text" ? (
              <TextBlock
                id={`input-${block.id}`}
                initialValue={block.latex}
                onChange={(val) => updateBlockValue(index, val)}
                onEnterPress={() => handleEnterKeyProgress(index, "text")}
                onBackspaceEmpty={() => removeBlock(index)}
                theme={theme}
                autoFocus={isFocused}
              />
            ) : (
              <MathBlock
                id={`input-${block.id}`}
                initialValue={block.latex}
                onChange={(val) => updateBlockValue(index, val)}
                onEnterPress={() => handleEnterKeyProgress(index, "math")}
                onBackspaceEmpty={() => removeBlock(index)}
                theme={theme}
                autoFocus={isFocused}
                hasError={index === error}
              />
            )}

            <div className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 grid grid-cols-2 grid-rows-2 gap-1">
              {pageData.blocks.length > 1 && (
                <button
                  onClick={() => removeBlock(index)}
                  className={`p-1 border rounded-md transition-colors cursor-pointer ${
                    theme === "light"
                      ? "bg-white border-neutral-200 text-neutral-400 hover:text-red-500"
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-red-400"
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {block.type === "math" && (
                <button
                  onClick={() => magicFunction(index, calculateFactoring)}
                  className={`p-1 border rounded-md transition-colors cursor-pointer ${
                    theme === "light"
                      ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                  }`}
                  title="factor"
                >
                  <Group className="w-3 h-3" />
                </button>
              )}
              {block.type === "math" && (
                <button
                  onClick={() => magicFunction(index, calculateSimplification)}
                  className={`p-1 border rounded-md transition-colors cursor-pointer ${
                    theme === "light"
                      ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                  }`}
                  title="simplify"
                >
                  <Shrink className="w-3 h-3" />
                </button>
              )}
              {block.type === "math" && (
                <button
                  onClick={() => magicFunction(index, calculateExpansion)}
                  className={`p-1 border rounded-md transition-colors cursor-pointer ${
                    theme === "light"
                      ? "bg-white border-neutral-200 text-neutral-400 hover:text-black"
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                  }`}
                  title="expand"
                >
                  <Expand className="w-3 h-3" />
                </button>
              )}
            </div>
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
