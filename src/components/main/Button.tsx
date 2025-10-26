import * as React from "react";

/**
 * Button (Material-like, со StateLayer)
 * ----------------------------------------------------
 * Параметры:
 *  - priority: визуальный приоритет
 *      • primary   — заливка
 *      • secondary — бордюр + светлый фон
 *      • tertiary  — прозрачный фон (только текст/иконки)
 *  - tone: смысловой тон
 *      • brand | default | error
 *  - size: визуальный размер
 *      • sm | md   (large пока нет)
 *  - leftIcon/rightIcon: слоты под иконки
 *
 * ВАЖНО: состояния (hover/pressed) отрисовываются не через изменение
 * цвета фона, а через отдельный слой StateLayer (как в Material 3).
 * Для него мы кладём два CSS-переменных:
 *   --layer-hover   → var(--state-*-hover)
 *   --layer-pressed → var(--state-*-pressed)
 * Эти токены задаются в tokens.theme.css в абсолютных HSLA.
 */

/**
 * Размеры (фиксированные пиксели, без tailwind scale)
 *
 * Словарик классов:
 *  • h-[Npx]        — высота кнопки (height)
 *  • text-[Npx]     — размер шрифта (font-size)
 *  • leading-[Npx]  — межстрочный интервал (line-height). Для однострочной кнопки влияет на вертикальное положение текста.
 *
 * Паддинги вынесены отдельно (см. pad*, чтобы можно было сужать края у иконочных вариантов).
 *
 * В base ниже:
 *  • gap-2          — расстояние между иконкой и текстом по умолчанию = 8px (для безиконных вариантов не важно)
 *  • rounded-[12px] — радиус скругления = 12px (меняется ТУТ)
 */
type Priority = "primary" | "secondary" | "tertiary";
type Tone = "brand" | "default" | "error";
type Size = "sm" | "md";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  priority?: Priority;
  tone?: Tone;
  size?: Size;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: boolean;
};

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(" ");

const sizes: Record<Size, string> = {
  // sm: высота 32, кегль 14, line-height 24
  sm: "h-[32px] text-[14px] leading-[24px]",
  // md: высота 48, кегль 16, line-height 24
  md: "h-[48px] text-[16px] leading-[24px]"
};

/** Паддинги по умолчанию (без иконок) — взято из твоих правок */
const pad: Record<Size, string> = {
  sm: "px-[8px]",
  md: "px-[16px]"
};

/** Паддинги, если есть только левая иконка (слегка уменьшаем слева) */
const padIconLeft: Record<Size, string> = {
  sm: "pl-[4px] pr-[8px]",
  md: "pl-[12px] pr-[16px]"
};

/** Паддинги, если есть только правая иконка (слегка уменьшаем справа) */
const padIconRight: Record<Size, string> = {
  sm: "pl-[8px] pr-[4px]",
  md: "pl-[16px] pr-[12px]"
};

/** Паддинги, если есть и левая, и правая иконки (уменьшаем оба края) */
const padIconBoth: Record<Size, string> = {
  sm: "px-[4px]",
  md: "px-[12px]"
};

/** Размер контейнера иконок (фикс) */
const iconSize: Record<Size, string> = {
  sm: "w-[20px] h-[20px]",
  md: "w-[24px] h-[24px]"
};

/** Меньший gap для иконочных вариантов */
const gapIcon: Record<Size, string> = {
  sm: "gap-[6px]",
  md: "gap-[8px]"
};

/** Ширина для иконочных (квадратных) кнопок */
const squareW: Record<Size, string> = {
  sm: "w-[32px]",
  md: "w-[48px]"
};

/** Радиус скругления по размерам */
const radius: Record<Size, string> = {
  sm: "rounded-[6px]", // пример: маленькой кнопке меньше скругление
  md: "rounded-[16px]"
};

/** Базовые классы кнопки (без радиуса — он задаётся через `radius[size]`) */
const base =
  "relative overflow-hidden inline-flex group items-center justify-center " +
  "font-ui font-medium select-none transition " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-outside " +
  "disabled:opacity-50 disabled:pointer-events-none";

/**
 * Визуал по приоритету/тону — полная матрица.
 * Если tone === "error", всегда используем стиль tertiary/error (независимо от priority).
 * Каждая строка задаёт полный набор: фон, текст, толщина бордера и цвет бордера (или прозрачный).
 */
const visualStyles: Record<Priority, Record<Tone, string>> = {
  primary: {
    brand:   "bg-bg-brand  text-fg-inverted border border-transparent",
    default: "bg-fg-1      text-fg-inverted border border-transparent",
    // не используется, т.к. tone=error форсит стиль tertiary/error
    error:   "bg-fg-1      text-fg-inverted border border-transparent"
  },
  secondary: {
    brand:   "bg-bg-3 text-fg-brand  border border-transparent",
    default: "bg-bg-3 text-fg-2      border border-transparent",
    // не используется, т.к. tone=error форсит стиль tertiary/error
    error:   "bg-bg-1 text-fg-1      border border-stroke-1"
  },
  tertiary: {
    brand:   "bg-transparent text-fg-brand  border border-transparent",
    default: "bg-transparent text-fg-1      border border-transparent",
    error:   "bg-transparent text-fg-error  border border-transparent"
  }
};

function visual(priority: Priority, tone: Tone) {
  // Требование: error всегда выглядит как tertiary/error, какой бы priority ни пришёл
  if (tone === "error") return visualStyles.tertiary.error;
  return visualStyles[priority][tone];
}

/**
 * =====================  EDIT HERE: STATE LAYER  =====================
 * Один раз задаёшь цвета для каждого варианта кнопки (priority × tone).
 * Значение — ЛЮБОЕ валидное CSS: hsla(...), rgba(...), #RRGGBBAA, var(--token), color-mix(...)
 * Никаких fallbacks. Ровно то, что тут поставишь — то и поедет в слой.
 *
 * Пример заполнения под твои токены:
 *   hover:   "var(--btn-state-hover--primary--brand)",
 *   pressed: "var(--btn-state-pressed--primary--brand)",
 *
 * По умолчанию везде стоит "transparent", чтобы ничего не мешало — замени на свои.
 */
 type StatePair = { hover: string; pressed: string };
 type VariantKey = `${Priority}:${Tone}`;

 const STATE_LAYER: Record<VariantKey, StatePair> = {
   // PRIMARY
   "primary:brand":   { hover: "var(--state-default-hover)", pressed: "var(--state-default-pressed)" },
   "primary:default": { hover: "var(--state-inverted-hover)", pressed: "var(--state-inverted-pressed)" },
   "primary:error":  { hover: "var(--state-error-hover)", pressed: "var(--state-error-pressed)" },

   // SECONDARY
   "secondary:brand":   { hover: "var(--state-brand-hover)", pressed: "var(--state-brand-pressed)" },
   "secondary:default": { hover: "var(--state-default-hover)", pressed: "var(--state-default-pressed)" },
   "secondary:error":  { hover: "var(--state-error-hover)", pressed: "var(--state-error-pressed)" },

   // TERTIARY
   "tertiary:brand":   { hover: "var(--state-brand-hover)", pressed: "var(--state-brand-pressed)" },
   "tertiary:default": { hover: "var(--state-default-hover)", pressed: "var(--state-default-pressed)" },
   "tertiary:error":  { hover: "var(--state-error-hover)", pressed: "var(--state-error-pressed)" }
 };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      priority = "primary",
      tone = "brand",
      size = "md",
      className,
      leftIcon,
      rightIcon,
      children,
      disabled,
      style: externalStyle,
      ...props
    },
    ref
  ) => {
    // Иконочный режим (без текста). Можно задать явно через prop iconOnly,
    // либо он включится автоматически, если нет текста, но есть иконка.
    const hasText = React.Children.count(children) > 0;
    const hasLeft = Boolean(leftIcon);
    const hasRight = Boolean(rightIcon);
    const hasIcon = hasLeft || hasRight;
    const isIconOnly = (props as Record<string, unknown>).iconOnly ?? (!hasText && hasIcon);
    const showText = hasText && !isIconOnly;

    // A11y-подсказка в консоли: для иконочного варианта нужен aria-label
    if (process.env.NODE_ENV !== "production") {
      if (isIconOnly && !("aria-label" in (props || {}))) {
        console.warn("Button(iconOnly): добавь aria-label для доступности.");
      }
    }

    // Жёстко берём ровно то, что задано в STATE_LAYER (без какой-либо логики
    // и без var()/fallback'ов). Если забудешь заполнить — будет transparent.
    const key = `${priority}:${tone}` as `${Priority}:${Tone}`;
    const lay = STATE_LAYER[key];
    const style = {
      "--layer-hover":   lay.hover,
      "--layer-pressed": lay.pressed,
      letterSpacing: "-3%",
      ...(externalStyle as React.CSSProperties)
    } as React.CSSProperties;

    // Иконки и вычисление паддингов/зазора
    // Получаем размеры иконок в пикселях для этого размера кнопки
    const getIconPixelSize = () => {
      return size === "sm" ? 20 : 24;
    };

    // Клонируем иконки и добавляем им размеры
    const iconPxSize = getIconPixelSize();
    const wrappedLeftIcon = leftIcon && React.isValidElement(leftIcon)
      ? React.cloneElement(leftIcon, {
          style: {
            fontSize: `${iconPxSize}px`,
            width: `${iconPxSize}px`,
            height: `${iconPxSize}px`,
          } as React.CSSProperties
        } as React.HTMLAttributes<unknown>)
      : null;

    const wrappedRightIcon = rightIcon && React.isValidElement(rightIcon)
      ? React.cloneElement(rightIcon, {
          style: {
            fontSize: `${iconPxSize}px`,
            width: `${iconPxSize}px`,
            height: `${iconPxSize}px`,
          } as React.CSSProperties
        } as React.HTMLAttributes<unknown>)
      : null;

    let paddingCls = pad[size];
    if (isIconOnly) {
      paddingCls = cx("px-0", squareW[size]); // делаем кнопку квадратной
    } else if (hasLeft && hasRight) {
      paddingCls = padIconBoth[size];
    } else if (hasLeft) {
      paddingCls = padIconLeft[size];
    } else if (hasRight) {
      paddingCls = padIconRight[size];
    }

    return (
      <button
        ref={ref}
        className={cx(
          base,
          sizes[size],
          paddingCls,
          radius[size],
          visual(priority, tone),
          (hasIcon && showText) && gapIcon[size],
          className
        )}
        disabled={disabled}
        style={style}
        {...props}
      >
        {/* StateLayer — под контентом, красит только фон */}
        <span
          aria-hidden
          className="
            pointer-events-none absolute inset-0 z-0
            transition-colors duration-150
            bg-transparent
            group-hover:bg-[var(--layer-hover)]
            group-active:bg-[var(--layer-pressed)]
          "
        />
        {/* Контент */}
        {wrappedLeftIcon && (
          <span aria-hidden className={cx("relative z-[1] inline-flex items-center justify-center shrink-0", iconSize[size])}>
            {wrappedLeftIcon}
          </span>
        )}
        {showText && (<span className="relative z-[1]">{children}</span>)}
        {wrappedRightIcon && (
          <span aria-hidden className={cx("relative z-[1] inline-flex items-center justify-center shrink-0", iconSize[size])}>
            {wrappedRightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
