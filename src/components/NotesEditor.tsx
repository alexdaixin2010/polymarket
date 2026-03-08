"use client";

import { useState } from "react";

interface NotesEditorProps {
  initialNotes: string;
  onSave: (notes: string) => void;
}

export default function NotesEditor({ initialNotes, onSave }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const hasChanges = notes !== initialNotes;

  async function handleSave() {
    setSaving(true);
    await onSave(notes);
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add your personal notes about this market..."
        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        rows={4}
      />
    </div>
  );
}
