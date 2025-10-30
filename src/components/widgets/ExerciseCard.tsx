import * as React from "react";
import { Button } from "../main/Button";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";

export interface ExerciseCardProps {
  id: string;
  name: string;
  image?: React.ReactNode;
  onSelect?: (id: string) => void;
  onImageClick?: (id: string) => void;
  isSelected?: boolean;
}

export const ExerciseCard = React.forwardRef<HTMLDivElement, ExerciseCardProps>(
  ({ id, name, image, onSelect, onImageClick, isSelected = false }, ref) => {
    const handleClick = () => {
      onSelect?.(id);
    };

    const handleImageClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onImageClick?.(id);
    };

    return (
      <div
        ref={ref}
        className="flex flex-col overflow-hidden w-full"
      >
        {/* Image placeholder - square aspect ratio, responsive width */}
        <div
          className="flex-shrink-0 bg-bg-3 rounded-xl flex items-center justify-center overflow-hidden w-full cursor-pointer hover:opacity-80 transition-opacity"
          style={{ aspectRatio: "1", marginBottom: "2px" }}
          onClick={handleImageClick}
        >
          {image ? (
            image
          ) : (
            <svg
              className="w-12 h-12 text-fg-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>

        {/* Name - Inter medium, line-height 24, letter-spacing -4%, max 2 lines, fixed height 48px */}
        <h3
          className="text-base font-medium text-fg-1 line-clamp-2"
          style={{
            fontFamily: "Inter, sans-serif",
            lineHeight: "24px",
            letterSpacing: "-4%",
            marginBottom: "6px",
            height: "48px",
            display: "flex",
            alignItems: "flex-start"
          }}
        >
          {name}
        </h3>

        {/* Select button - sm size with state */}
        <Button
          size="sm"
          priority={isSelected ? "primary" : "secondary"}
          tone="default"
          onClick={handleClick}
          className="w-full"
          leftIcon={isSelected ? <CancelIcon /> : <AddIcon />}
        >
          {isSelected ? "Снять выбор" : "Выбрать"}
        </Button>
      </div>
    );
  }
);

ExerciseCard.displayName = "ExerciseCard";
