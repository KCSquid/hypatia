"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateMath } from "@/lib/compute";

interface MathLineFieldProps {
  id: string;
  initialValue: string;
  onChange: (val: string) => void;
  onNewLine: () => void;
  onNewBlock: () => void;
  onNewTextBlock: () => void;
  onDeleteLine: () => void;
  onDeleteBlock: () => void;
  onNavigate: (direction: "up" | "down") => void;
  onMoveLine: (direction: "up" | "down") => void;
  onMoveBlock: (direction: "up" | "down") => void;
  theme: "light" | "dark";
  autoFocus?: boolean;
  hasError: boolean;
  /** Bump this from the parent to play the "magic result" reveal animation
   *  (e.g. after factor/simplify/expand). Tab-completing the autocomplete
   *  suggestion triggers the same animation locally. */
  pulseKey?: number;
}

interface MathFieldElement extends HTMLElement {
  value: string;
  setValue: (
    value: string,
    options?: { silenceNotifications?: boolean },
  ) => void;
}

export default function MathLineField({
  id,
  initialValue,
  onChange,
  onNewLine,
  onNewBlock,
  onNewTextBlock,
  onDeleteLine,
  onDeleteBlock,
  onNavigate,
  onMoveLine,
  onMoveBlock,
  theme,
  autoFocus,
  hasError,
  pulseKey,
}: MathLineFieldProps) {
  const mathfieldRef = useRef<MathFieldElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const [suggestion, setSuggestion] = useState<string>("");
  const [animKey, setAnimKey] = useState(0);
  const playPulse = useCallback(() => setAnimKey((k) => k + 1), []);

  const [trackedPulseKey, setTrackedPulseKey] = useState(pulseKey ?? 0);
  if ((pulseKey ?? 0) !== trackedPulseKey) {
    setTrackedPulseKey(pulseKey ?? 0);
    setAnimKey((k) => k + 1);
  }

  // Restart the CSS animation imperatively (rather than via React `key`,
  // which would unmount/remount the <math-field> and lose focus/cursor).
  useEffect(() => {
    if (animKey === 0) return;
    const el = revealRef.current;
    if (!el) return;
    el.classList.remove("hypatia-materialize");
    void el.offsetWidth;
    el.classList.add("hypatia-materialize");
  }, [animKey]);

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
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === "Tab") {
        if (suggestion) {
          e.preventDefault();
          e.stopPropagation();
          const finalValue = mf.value + suggestion;
          mf.setValue(finalValue);
          onChange(finalValue);
          setSuggestion("");
          playPulse();
          setTimeout(() => mf.focus(), 0);
        }
        return;
      }

      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        e.stopPropagation();
        const direction = e.key === "ArrowUp" ? "up" : "down";
        if (e.shiftKey) {
          onMoveLine(direction);
        } else {
          onNavigate(direction);
        }
        return;
      }

      if (ctrl && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        e.stopPropagation();
        onMoveBlock(e.key === "ArrowUp" ? "up" : "down");
        return;
      }

      if (ctrl && e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        onDeleteBlock();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (ctrl && e.shiftKey) {
          onNewTextBlock();
        } else if (e.shiftKey) {
          onNewBlock();
        } else {
          onNewLine();
        }
        return;
      }

      if (e.key === "Backspace" && !mf.value) {
        e.preventDefault();
        onDeleteLine();
      }
    };

    mf.addEventListener("input", handleInput);
    // Capture phase: MathLive appears to swallow Enter internally (likely to
    // stop it from bubbling as an accidental form-submit) before it reaches
    // bubble-phase listeners, even though it lets Tab/Backspace/arrows through.
    mf.addEventListener("keydown", handleKeyDown, true);
    return () => {
      mf.removeEventListener("input", handleInput);
      mf.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [
    onChange,
    onNewLine,
    onNewBlock,
    onNewTextBlock,
    onDeleteLine,
    onDeleteBlock,
    onNavigate,
    onMoveLine,
    onMoveBlock,
    suggestion,
    playPulse,
  ]);

  return (
    <div className="w-full relative">
      <div ref={revealRef} className="w-full relative flex items-center">
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

      {hasError && (
        <div className="absolute inset-0 rounded-md ring-1 ring-red-400/70 pointer-events-none" />
      )}

      {animKey > 0 && (
        <div
          key={`glow-${animKey}`}
          aria-hidden
          className="hypatia-magic-glow pointer-events-none absolute -inset-1.5 rounded-lg"
        />
      )}
    </div>
  );
}
