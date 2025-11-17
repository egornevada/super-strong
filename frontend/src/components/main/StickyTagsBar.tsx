import * as React from "react";

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(" ");

export interface StickyTagsBarProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryClick: (category: string) => void;
}

export const StickyTagsBar = React.forwardRef<HTMLDivElement, StickyTagsBarProps>(
  ({ categories, activeCategory, onCategoryClick }, ref) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const buttonRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});

    // Автоскроллим активную категорию в видимую область sticky bar
    React.useEffect(() => {
      if (activeCategory && buttonRefs.current[activeCategory]) {
        const activeButton = buttonRefs.current[activeCategory];
        activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, [activeCategory]);

    return (
      <div
        ref={ref}
        className="sticky top-0 bg-bg-1 z-20 border-b border-stroke-1 py-2"
      >
        <div
          ref={scrollContainerRef}
          className="flex gap-2 px-4 overflow-x-auto scrollbar-hide"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                ref={(el) => {
                  if (el) buttonRefs.current[category] = el;
                }}
                onClick={() => {
                  if (!isActive) {
                    onCategoryClick(category);
                  }
                }}
                disabled={isActive}
                className={cx(
                  "px-2.5 py-1 rounded-full transition-all whitespace-nowrap h-7 flex items-center justify-center",
                  "text-xs leading-4 tracking-tighter font-medium",
                  "disabled:cursor-default",
                  isActive
                    ? "bg-fg-1 text-bg-1"
                    : "bg-bg-3 text-fg-1 hover:bg-bg-2"
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

StickyTagsBar.displayName = "StickyTagsBar";
