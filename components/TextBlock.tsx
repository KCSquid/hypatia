"use client";

import React, { useEffect, useRef } from "react";

interface TextBlockProps {
  id: string;
  initialValue: string;
  onChange: (val: string) => void;
  onEnterPress: () => void;
  onBackspaceEmpty: () => void;
  theme: "light" | "dark";
  autoFocus?: boolean;
}

export default function TextBlock({
  id,
  initialValue,
  onChange,
  onEnterPress,
  onBackspaceEmpty,
  theme,
  autoFocus,
}: TextBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && autoFocus) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnterPress();
    }
    if (e.key === "Backspace" && !textareaRef.current?.value) {
      e.preventDefault();
      onBackspaceEmpty();
    }
  };

  return (
    <div
      className={`w-full px-6 py-4 border rounded-xl shadow-xs transition-all ${
        theme === "light"
          ? "bg-white border-neutral-200/70 focus-within:border-neutral-400 focus-within:shadow-sm"
          : "bg-neutral-900/40 border-neutral-900 focus-within:border-neutral-800 focus-within:shadow-md"
      }`}
    >
      <textarea
        id={id}
        ref={textareaRef}
        value={initialValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Type continuous notation narrative..."
        className="w-full resize-none bg-transparent p-0 m-0 border-none outline-none focus:ring-0 text-sm leading-relaxed block overflow-hidden font-sans"
        style={{
          color: theme === "light" ? "#0f0f0f" : "#f0f0f0",
        }}
      />
    </div>
  );
}
