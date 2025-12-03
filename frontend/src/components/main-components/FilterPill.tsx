import * as React from "react";

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(" ");

export interface FilterPillProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const FilterPill = React.forwardRef<HTMLButtonElement, FilterPillProps>(
  ({ label, isActive = false, onClick }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cx(
          "px-2.5 py-1 rounded-full transition-all whitespace-nowrap h-7 flex items-center justify-center",
          "text-xs leading-4 tracking-tighter font-medium",
          isActive
            ? "bg-bg-brand text-fg-inverted"
            : "bg-bg-3 text-fg-1 hover:bg-bg-2"
        )}
      >
        {label}
      </button>
    );
  }
);

FilterPill.displayName = "FilterPill";
