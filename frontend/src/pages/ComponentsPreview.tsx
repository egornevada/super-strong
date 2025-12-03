import { Button } from '../components';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';

export function ComponentsPreview() {
  const priorities = ['primary', 'secondary', 'inverted', 'tertiary'] as const;
  const tones = ['brand', 'default', 'error'] as const;
  const sizes = ['M', 'S', 'XS'] as const;

  const iconVariants = [
    { label: 'Text only', leftIcon: undefined, rightIcon: undefined, text: 'Button' },
    { label: 'Left icon', leftIcon: <AddRounded />, rightIcon: undefined, text: 'Add' },
    { label: 'Both icons', leftIcon: <AddRounded />, rightIcon: <DeleteRounded />, text: 'Action' },
    { label: 'Right icon', leftIcon: undefined, rightIcon: <DeleteRounded />, text: 'Delete' },
    { label: 'Icon only', leftIcon: <AddRounded />, rightIcon: undefined, text: undefined, iconOnly: true },
  ];

  return (
    <div className="w-full min-h-screen bg-bg-special p-4">
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl font-bold text-fg-1 mb-8 sticky top-0 bg-bg-special py-2">Button Components</h1>

        {/* By Tone */}
        {tones.map((tone) => (
          <div key={tone} className="mb-12">
            <h2 className="text-xl font-bold text-fg-1 mb-6 capitalize">Tone: {tone}</h2>

            {/* By Priority */}
            {priorities.map((priority) => (
              <div key={priority} className="mb-8">
                <h3 className="text-lg font-semibold text-fg-2 mb-4 capitalize">Priority: {priority}</h3>

                {/* By Size */}
                {sizes.map((size) => (
                  <div key={size} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-semibold text-fg-3 mb-3 capitalize">Size: {size}</h4>

                    {/* Icon Variants */}
                    <div className="space-y-3 ml-4">
                      {iconVariants.map((variant, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          {/* Label */}
                          <span className="text-xs text-fg-3 w-24">{variant.label}</span>

                          {/* Normal state */}
                          <Button
                            priority={priority}
                            tone={tone}
                            size={size}
                            leftIcon={variant.leftIcon}
                            rightIcon={variant.rightIcon}
                            iconOnly={variant.iconOnly}
                            aria-label={variant.label}
                          >
                            {variant.text}
                          </Button>

                          {/* Disabled state */}
                          <Button
                            priority={priority}
                            tone={tone}
                            size={size}
                            leftIcon={variant.leftIcon}
                            rightIcon={variant.rightIcon}
                            iconOnly={variant.iconOnly}
                            disabled
                            aria-label={`${variant.label} disabled`}
                          >
                            {variant.text}
                          </Button>

                          <span className="text-xs text-fg-3 ml-2">(normal / disabled)</span>
                        </div>
                      ))}
                    </div>

                    {/* Divider between M and S */}
                    {size === 'S' && <div className="border-t border-stroke-1 mt-6 pt-6" />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
