import { useState, type KeyboardEvent } from "react";
import styles from "./TagInput.module.css";

const MAX_TAG_LENGTH = 30; // same limit as the backend (US08)

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
}

/**
 * Chip-style tag editor (US08): type then Enter/comma to add, Backspace on an
 * empty input to pop the last chip, × to remove one. The tag rules mirror the
 * backend: trimmed, non-empty, <= 30 chars, no case-insensitive duplicates.
 */
export default function TagInput({
  tags,
  onTagsChange,
  label = "Tags (optionnel)",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (!tag) return;
    if (tag.length > MAX_TAG_LENGTH) {
      setError("Un tag ne peut pas dépasser 30 caractères");
      return;
    }
    if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setError("Ce tag est déjà ajouté");
      return;
    }
    onTagsChange([...tags, tag]);
    setInput("");
    setError("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    } else if (event.key === "Backspace" && !input && tags.length) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  return (
    <div className={styles.tagField}>
      <label className={styles.tagLabel} htmlFor="tag-input">
        {label}
      </label>
      <div className={styles.tagBox}>
        {tags.map((tag) => (
          <span key={tag} className={styles.tagChip}>
            {tag}
            <button
              type="button"
              className={styles.tagRemove}
              aria-label={`Retirer le tag ${tag}`}
              onClick={() => onTagsChange(tags.filter((t) => t !== tag))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="tag-input"
          className={styles.tagInput}
          type="text"
          placeholder={tags.length ? "" : "Ajoutez un tag puis Entrée..."}
          value={input}
          maxLength={MAX_TAG_LENGTH}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
        />
      </div>
      {error && <p className={styles.tagError}>{error}</p>}
    </div>
  );
}
