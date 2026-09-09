"use client";

import { useState } from "react";

interface AnnotationEditorProps {
  axisScoreId: string;
  initialText: string;
}

export function AnnotationEditor({
  axisScoreId,
  initialText,
}: AnnotationEditorProps) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      const response = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ axisScoreId, text }),
      });
      if (!response.ok) throw new Error("Annotation save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Could not save your note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const textareaId = `annotation-${axisScoreId}`;

  return (
    <div className="mt-4">
      <label htmlFor={textareaId} className="block text-sm font-medium text-text-secondary mb-1">
        Your notes
      </label>
      <textarea
        id={textareaId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add your reasoning, caveats, or context for this position..."
        rows={4}
        maxLength={5000}
        className="w-full rounded-sharp border border-border-primary px-3 py-2 text-sm bg-surface-1 text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="border border-stone-600 text-stone-600 px-4 py-1.5 rounded-sharp text-sm font-medium hover:bg-stone-100 disabled:opacity-50 transition-colors duration-150"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <span aria-live="polite" className="text-sm text-stone-600">
          {saved ? "Saved" : ""}
        </span>
        {saveError && (
          <span role="alert" className="text-sm text-red-600">
            {saveError}
          </span>
        )}
      </div>
    </div>
  );
}
