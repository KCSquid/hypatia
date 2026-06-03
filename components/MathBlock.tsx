"use client";

import { useEffect, useRef, useState } from "react";
import { evaluateMath } from "@/lib/compute";

interface MathBlockProps {
  id: string;
  initialValue: string;
  onChange: (val: string) => void;
  onEnterPress: () => void;
  onBackspaceEmpty: () => void;
  theme: "light" | "dark";
  autoFocus?: boolean;
  hasError: boolean;
}

interface MathFieldElement extends HTMLElement {
  value: string;
  setValue: (
    value: string,
    options?: { silenceNotifications?: boolean },
  ) => void;
}

export default function MathBlock({
  id,
  initialValue,
  onChange,
  onEnterPress,
  onBackspaceEmpty,
  theme,
  autoFocus,
  hasError,
}: MathBlockProps) {
  const mathfieldRef = useRef<MathFieldElement | null>(null);
  const [suggestion, setSuggestion] = useState<string>("");

  const calculateSuggestion = async (currentValue: string) => {
    if (!currentValue || !currentValue.trim().endsWith("=")) {
      setSuggestion("");
      return;
    }
    try {
      const result = await evaluateMath(currentValue);
      if (result && result.trim() !== currentValue.trim()) {
        setSuggestion(result);
      } else {
        setSuggestion("");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      setSuggestion("");
    }
  };

  useEffect(() => {
    const mf = mathfieldRef.current;
    if (mf && autoFocus) {
      setTimeout(() => mf.focus(), 10);
    }
  }, [autoFocus]);

  useEffect(() => {
    const mf = mathfieldRef.current;
    if (mf && mf.value !== initialValue) {
      mf.setValue(initialValue, { silenceNotifications: true });
      calculateSuggestion(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    const mf = mathfieldRef.current;
    if (!mf) return;

    const handleInput = (e: Event) => {
      const target = e.target as MathFieldElement | null;
      const val = target ? target.value : "";
      onChange(val);
      calculateSuggestion(val);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (suggestion) {
          e.preventDefault();
          e.stopPropagation();
          const finalValue = mf.value + suggestion;
          mf.setValue(finalValue);
          onChange(finalValue);
          setSuggestion("");
          setTimeout(() => mf.focus(), 0);
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onEnterPress();
      } else if (e.key === "Backspace" && !mf.value) {
        e.preventDefault();
        onBackspaceEmpty();
      }
    };

    mf.addEventListener("input", handleInput);
    mf.addEventListener("keydown", handleKeyDown);
    return () => {
      mf.removeEventListener("input", handleInput);
      mf.removeEventListener("keydown", handleKeyDown);
    };
  }, [onChange, onEnterPress, onBackspaceEmpty, suggestion]);

  return (
    <div
      className={`w-full px-6 py-4 border rounded-xl flex flex-col justify-center transition-all relative ${
        theme === "light" ? "bg-white shadow-xs" : "bg-neutral-900/40 shadow-md"
      } ${
        hasError
          ? "border-red-400/70 focus-within:border-red-500"
          : theme === "light"
            ? "border-neutral-200/70 focus-within:border-neutral-400"
            : "border-neutral-900 focus-within:border-neutral-800"
      }`}
    >
      <div className="w-full relative flex items-center">
        <math-field
          id={id}
          ref={mathfieldRef}
          style={{
            width: "100%",
            padding: "4px 0",
            fontSize: "1.25rem",
            background: "transparent",
            border: "none",
            outline: "none",
            display: "block",
            color: theme === "light" ? "#0f0f0f" : "#f0f0f0",
          }}
          mathVirtualKeyboardPolicy={"manual"}
        />

        {suggestion && (
          <div
            className="absolute pointer-events-none select-none text-xs font-mono font-light tracking-wide px-3 py-1 border rounded-md transition-all z-10"
            style={{
              right: "80px",
              color: theme === "light" ? "#737373" : "#a3a3a3",
              backgroundColor: theme === "light" ? "#f5f5f5" : "#171717",
              borderColor: theme === "light" ? "#e5e5e5" : "#262626",
            }}
          >
            Tab to complete:{" "}
            <span className="font-bold ml-1">{suggestion}</span>
          </div>
        )}
      </div>
    </div>
  );
}
