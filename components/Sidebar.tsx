"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, NotebookPage } from "@/lib/db";
import {
  X,
  Plus,
  Trash2,
  Moon,
  Sun,
  Download,
  Upload,
  TriangleRight,
  Circle,
  Keyboard,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  theme: "light" | "dark";
  angle: "rad" | "deg";
  onToggleTheme: () => void;
  onToggleAngle: () => void;
  onRequestDelete: (pageId: string, pageTitle: string) => void;
  onShowShortcuts: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  activePageId,
  onSelectPage,
  theme,
  angle,
  onToggleTheme,
  onToggleAngle,
  onRequestDelete,
  onShowShortcuts,
}: SidebarProps) {
  const pages =
    useLiveQuery(() => db.pages.orderBy("updatedAt").reverse().toArray()) ??
    [];

  const createNewPage = async () => {
    const id = `page_${Date.now()}`;
    const newPage: NotebookPage = {
      id,
      title: `Untitled Workspace`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      blocks: [
        {
          id: `block_${Date.now()}`,
          type: "math",
          latex: "",
          lines: [{ id: `line_${Date.now()}`, latex: "" }],
        },
      ],
    };
    await db.pages.add(newPage);
    onSelectPage(id);
    onClose();
  };

  const exportCurrentPage = async () => {
    if (!activePageId) return;
    const page = await db.pages.get(activePageId);
    if (!page) return;

    const blob = new Blob([JSON.stringify(page, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.title.toLowerCase().replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(
          event.target?.result as string,
        ) as NotebookPage;
        parsed.id = `page_${Date.now()}`;
        parsed.updatedAt = Date.now();
        if (!parsed.title) parsed.title = "Imported Space";
        await db.pages.put(parsed);
        onSelectPage(parsed.id);
        onClose();
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 backdrop-blur-sm bg-black/10 transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-72 z-50 border-r shadow-2xl transform transition-transform duration-300 ease-out flex flex-col p-6 select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          theme === "light"
            ? "bg-white/95 border-neutral-200/80 text-neutral-900"
            : "bg-neutral-950/95 border-neutral-900 text-white"
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xs font-bold lowercase opacity-60 font-mono">
            hypatia
          </h1>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-neutral-500/10 transition-colors cursor-pointer text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={createNewPage}
          className={`w-full flex items-center justify-center active:shadow-none gap-2 text-xs font-medium px-3 py-2.5 rounded-lg border transition-all duration-200 cursor-pointer mb-6 ${
            theme === "light"
              ? "bg-white border-neutral-200 shadow-sm hover:bg-neutral-50 text-neutral-800"
              : "bg-neutral-900 border-neutral-800 shadow-md hover:bg-neutral-800 text-neutral-200"
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> new workspace page
        </button>

        <div className="flex-1 overflow-y-auto space-y-1 mb-6">
          <p className="text-[10px] font-bold lowercase tracking-widest text-neutral-400 px-2 mb-3 font-mono">
            your notebook pages
          </p>
          {pages.map((p) => (
            <div
              key={p.id}
              className="group flex items-center justify-between rounded-lg transition-all duration-150"
            >
              <button
                onClick={() => {
                  onSelectPage(p.id);
                  onClose();
                }}
                className={`flex-1 text-left text-xs px-3 py-2.5 rounded-lg truncate cursor-pointer font-medium transition-colors ${
                  activePageId === p.id
                    ? theme === "light"
                      ? "bg-neutral-100 group-hover:bg-neutral-200/75 text-black font-semibold"
                      : "bg-neutral-900 group-hover:bg-neutral-800/75 text-white font-semibold"
                    : theme === "light"
                      ? "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                      : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                }`}
              >
                {p.title || "Untitled Workspace"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete(p.id, p.title);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-500 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-0 group-hover:w-3.5 transition-all h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div
          className={`border-t pt-4 space-y-3 font-mono text-xs ${theme === "light" ? "border-neutral-200" : "border-neutral-900"}`}
        >
          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center gap-2 text-left transition-colors cursor-pointer ${theme === "light" ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"}`}
          >
            {theme === "light" ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
            {theme === "light" ? "shift dark theme" : "shift light theme"}
          </button>
          <button
            onClick={onToggleAngle}
            className={`w-full flex items-center gap-2 text-left transition-colors cursor-pointer ${theme === "light" ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"}`}
          >
            {angle === "rad" ? (
              <Circle className="w-3.5 h-3.5" />
            ) : (
              <TriangleRight className="w-3.5 h-3.5" />
            )}
            {angle === "rad" ? "using radians" : "using degrees"}
          </button>
          <button
            onClick={onShowShortcuts}
            className={`w-full flex items-center gap-2 text-left transition-colors cursor-pointer ${theme === "light" ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"}`}
          >
            <Keyboard className="w-3.5 h-3.5" /> keyboard shortcuts
          </button>
          <div
            className={`border-t ${theme === "light" ? "border-neutral-200" : "border-neutral-900"}`}
          ></div>
          <button
            onClick={exportCurrentPage}
            disabled={!activePageId}
            className={`w-full flex items-center gap-2 text-left transition-colors cursor-pointer disabled:opacity-30 ${theme === "light" ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"}`}
          >
            <Download className="w-3.5 h-3.5" /> export to json
          </button>
          <label
            className={`flex items-center gap-2 w-full text-left transition-colors cursor-pointer ${theme === "light" ? "text-neutral-500 hover:text-black" : "text-neutral-400 hover:text-white"}`}
          >
            <Upload className="w-3.5 h-3.5" /> import from json
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>
        </div>
      </aside>
    </>
  );
}
