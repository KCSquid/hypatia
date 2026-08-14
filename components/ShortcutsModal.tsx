"use client";

import { X } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
}

const SHORTCUT_GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Editing",
    items: [
      ["Enter", "New line within the current math block"],
      ["Shift + Enter", "New math block below"],
      ["Ctrl/Cmd + Shift + Enter", "New text block below"],
      ["Ctrl/Cmd + M", "Insert a separator"],
      ["Tab", "Accept the autocomplete suggestion"],
      ["Backspace (empty line)", "Delete the line, or the block if it's the last line"],
      ["Ctrl/Cmd + Backspace", "Delete the whole block"],
    ],
  },
  {
    title: "Navigation",
    items: [
      ["Alt + ↑ / ↓", "Move focus to the previous/next line or block"],
      ["Alt + Shift + ↑ / ↓", "Reorder the current line within its block"],
      ["Ctrl/Cmd + Shift + ↑ / ↓", "Reorder the current block on the page"],
    ],
  },
];

export default function ShortcutsModal({
  isOpen,
  onClose,
  theme,
}: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/40"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-w-md w-full p-6 border rounded-xl shadow-2xl transition-all duration-300 ${
          theme === "light"
            ? "bg-white border-neutral-200 text-neutral-900"
            : "bg-neutral-900 border-neutral-800 text-white"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              theme === "light"
                ? "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <p
                className={`text-[10px] font-bold lowercase tracking-widest mb-2 font-mono ${
                  theme === "light" ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                {group.title}
              </p>
              <div className="space-y-2">
                {group.items.map(([keys, description]) => (
                  <div
                    key={keys}
                    className="flex items-baseline justify-between gap-4 text-xs"
                  >
                    <span
                      className={`opacity-70 leading-relaxed ${theme === "light" ? "text-neutral-700" : "text-neutral-300"}`}
                    >
                      {description}
                    </span>
                    <kbd
                      className={`shrink-0 font-mono text-[10px] px-2 py-1 rounded-md border whitespace-nowrap ${
                        theme === "light"
                          ? "bg-neutral-50 border-neutral-200 text-neutral-600"
                          : "bg-neutral-800 border-neutral-700 text-neutral-300"
                      }`}
                    >
                      {keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
