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
type Priority = "primary" | "secondary" | "tertiary" | "inverted";
type Tone = "brand" | "default" | "error";
type Size = "XS" | "S" | "M";

// Тип для CSS свойств с поддержкой кастомных переменных
type CSSPropertiesWithCustom = React.CSSProperties & {
  [key: `--${string}`]: string | number;
};

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
  // XS: высота 28, кегль 12, line-height 16
  XS: "h-[28px] text-[12px] leading-[16px]",
  // S: высота 32, кегль 14, line-height 24
  S: "h-[32px] text-[14px] leading-[24px]",
  // M: высота 48, кегль 16, line-height 24
  M: "h-[48px] text-[16px] leading-[24px]"
};

/** Паддинги по умолчанию (без иконок) */
const pad: Record<Size, string> = {
  XS: "px-[6px]",
  S: "px-[8px]",
  M: "px-[16px]"
};

/** Паддинги, если есть только левая иконка (слегка уменьшаем слева) */
const padIconLeft: Record<Size, string> = {
  XS: "pl-[2px] pr-[6px]",
  S: "pl-[4px] pr-[8px]",
  M: "pl-[12px] pr-[16px]"
};

/** Паддинги, если есть только правая иконка (слегка уменьшаем справа) */
const padIconRight: Record<Size, string> = {
  XS: "pl-[6px] pr-[2px]",
  S: "pl-[8px] pr-[4px]",
  M: "pl-[16px] pr-[12px]"
};

/** Паддинги, если есть и левая, и правая иконки (уменьшаем оба края) */
const padIconBoth: Record<Size, string> = {
  XS: "px-[2px]",
  S: "px-[4px]",
  M: "px-[12px]"
};

/** Размер контейнера иконок (фикс) */
const iconSize: Record<Size, string> = {
  XS: "w-[16px] h-[16px]",
  S: "w-[20px] h-[20px]",
  M: "w-[24px] h-[24px]"
};

/** Меньший gap для иконочных вариантов */
const gapIcon: Record<Size, string> = {
  XS: "gap-[4px]",
  S: "gap-[6px]",
  M: "gap-[8px]"
};

/** Ширина для иконочных (квадратных) кнопок */
const squareW: Record<Size, string> = {
  XS: "w-[28px]",
  S: "w-[32px]",
  M: "w-[48px]"
};

/** Радиус скругления по размерам */
const radius: Record<Size, string> = {
  XS: "rounded-[999px]",
  S: "rounded-[6px]",
  M: "rounded-[16px]"
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
    brand:   "bg-bg-brand  text-fg-inverted",
    default: "bg-fg-1      text-fg-inverted",
    // error никогда не используется - tone=error всегда tertiary
    error:   ""
  },
  secondary: {
    // Фон для secondary используется из CSS переменной --bg-special (в style inline)
    brand:   "text-fg-brand",
    default: "text-fg-2",
    // не используется, т.к. tone=error форсит стиль tertiary/error
    error:   "text-fg-1"
  },
  inverted: {
    // Фон для inverted используется из CSS переменной --bg-1 (в style inline)
    brand:   "text-fg-brand",
    default: "text-fg-2",
    error:   "text-fg-1"
  },
  tertiary: {
    brand:   "bg-transparent text-fg-brand",
    default: "bg-transparent text-fg-1",
    error:   "bg-transparent text-fg-error"
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
   "primary:error":  { hover: "var(--state-error-hover)", pressed: "var(--state-error-pressed)" }, // никогда не используется

   // SECONDARY
   "secondary:brand":   { hover: "var(--state-brand-hover)", pressed: "var(--state-brand-pressed)" },
   "secondary:default": { hover: "var(--state-default-hover)", pressed: "var(--state-default-pressed)" },
   "secondary:error":  { hover: "var(--state-error-hover)", pressed: "var(--state-error-pressed)" },

   // INVERTED
   "inverted:brand":   { hover: "var(--state-brand-hover)", pressed: "var(--state-brand-pressed)" },
   "inverted:default": { hover: "var(--state-default-hover)", pressed: "var(--state-default-pressed)" },
   "inverted:error":  { hover: "var(--state-error-hover)", pressed: "var(--state-error-pressed)" },

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
      size = "M",
      className,
      leftIcon,
      rightIcon,
      children,
      disabled,
      style: externalStyle,
      iconOnly: _iconOnly, // Extract but don't pass to DOM
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
    const isIconOnly = _iconOnly ?? (!hasText && hasIcon);
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

    // Secondary/Inverted buttons используют CSS переменные для фона (в style inline)
    const bgStyle = priority === "secondary"
      ? { backgroundColor: "var(--bg-special)" as any }
      : priority === "inverted"
      ? { backgroundColor: "var(--bg-1)" as any }
      : {};

    const style = {
      "--layer-hover":   lay.hover,
      "--layer-pressed": lay.pressed,
      letterSpacing: "-3%",
      ...bgStyle,
      ...(externalStyle as React.CSSProperties)
    } as CSSPropertiesWithCustom;

    // Иконки и вычисление паддингов/зазора
    // Получаем размеры иконок в пикселях для этого размера кнопки
    const getIconPixelSize = () => {
      if (size === "XS") return 16;
      if (size === "S") return 20;
      return 24; // M
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
