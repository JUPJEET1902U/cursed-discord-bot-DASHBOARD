"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * A hex color input paired with a native `<input type="color">` swatch.
 * Kept intentionally simple (no external color-picker dependency) — the
 * swatch drives valid picks, and the text field lets people paste a known
 * hex value directly. Invalid text input never propagates upward as a
 * "valid" value; it just gets flagged until it matches `#RRGGBB`.
 */
export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const isValid = HEX_COLOR.test(text);

  return (
    <div className="flex items-center gap-2.5">
      <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/10">
        <input
          type="color"
          value={isValid ? text : value}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            onChange(e.target.value);
          }}
          className="absolute -left-1 -top-1 h-12 w-12 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Pick embed color"
        />
      </label>
      <Input
        value={text}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (HEX_COLOR.test(next)) onChange(next);
        }}
        placeholder="#7C3AED"
        maxLength={7}
        className={cn(
          "font-mono uppercase",
          !isValid && "border-crimson/60 focus-visible:border-crimson focus-visible:ring-crimson/60"
        )}
      />
      {!isValid ? (
        <span className="shrink-0 text-xs text-crimson-bright">Invalid hex</span>
      ) : null}
    </div>
  );
}
