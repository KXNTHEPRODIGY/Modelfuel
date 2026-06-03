"use client";

import { useState } from "react";

/** Description that clamps to 3 lines with a "Read more" toggle. */
export function ExpandableText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  return (
    <div>
      <p className={`text-white/60 ${open ? "" : "line-clamp-3"}`}>{text}</p>
      {text.length > 160 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-1 text-xs font-medium text-[#FF6B1A] hover:underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
