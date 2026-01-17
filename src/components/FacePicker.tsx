import { useEffect, useRef, useState } from "react";
import type { FaceBox } from "../utils/crop";

interface FacePickerProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  faces: FaceBox[];
  selectedFaceId?: string;
  onSelectFace: (faceId: string) => void;
}

export default function FacePicker({
  imageUrl,
  imageWidth,
  imageHeight,
  faces,
  selectedFaceId,
  onSelectFace,
}: FacePickerProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    if (!imgRef.current) {
      return;
    }
    const updateSize = () => {
      setDisplaySize({
        width: imgRef.current?.clientWidth ?? 1,
        height: imgRef.current?.clientHeight ?? 1,
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [imageUrl]);

  const scaleX = displaySize.width / imageWidth;
  const scaleY = displaySize.height / imageHeight;

  return (
    <div className="face-preview">
      <img ref={imgRef} src={imageUrl} alt="Uploaded" />
      {faces.map((face) => (
        <button
          key={face.id}
          type="button"
          className={`face-box ${
            face.id === selectedFaceId ? "selected" : ""
          }`}
          style={{
            left: face.x * scaleX,
            top: face.y * scaleY,
            width: face.width * scaleX,
            height: face.height * scaleY,
          }}
          onClick={() => onSelectFace(face.id)}
          aria-label="Select face"
        />
      ))}
    </div>
  );
}
