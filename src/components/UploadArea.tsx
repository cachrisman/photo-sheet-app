import { useRef, useState } from "react";

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
}

export default function UploadArea({ onFileSelected }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <label
      className={`upload-zone ${dragging ? "dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFile(event.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <strong>Upload or drop one photo</strong>
      <div className="inline-note">JPG, PNG, or HEIC supported.</div>
    </label>
  );
}
