import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';

export interface TextFieldProps {
  label: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  type?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url' | 'none';
  onChange?: (value: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function TextField({
  label,
  value = '',
  required = false,
  disabled = false,
  error = false,
  type = 'text',
  inputMode = 'text',
  onChange,
  onClear,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocusProp?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlurProp?.();
  };

  const handleClear = () => {
    onChange?.('');
    onClear?.();
  };

  const isLabelActive = isFocused || value;

  // Determine border and background based on state
  const getBorderColor = () => {
    if (disabled) return 'border-stroke-fg-disabled';
    if (error) return 'border-stroke-error';
    if (isFocused) return 'border-fg-1';
    return 'border-stroke-controls';
  };

  const getBgColor = () => {
    if (disabled) return 'bg-white';
    if (isHovered) return 'bg-white';
    return 'bg-white';
  };

  const getStateLayerBg = () => {
    if (isHovered && !isFocused && !value && !error && !disabled) {
      return 'hover:bg-fill-state-default-hover';
    }
    return '';
  };

  const getBorderWidth = () => {
    return 'border';
  };

  const getClearButtonColor = () => {
    if (error) return '#ef4444'; // red
    if (isFocused) return '#000000'; // black for pressed state
    return '#9ca3af'; // gray for rest/hover
  };

  const getLabelColor = () => {
    if (disabled) return 'text-stroke-fg-disabled';
    if (error) return 'text-stroke-error';
    return 'text-fg-3';
  };

  return (
    <div className="w-full">
      {/* Input container */}
      <div
        className={`relative rounded-2xl transition-all duration-150 ${getBorderWidth()} ${getBorderColor()} ${getBgColor()} ${getStateLayerBg()} ${
          !disabled ? 'cursor-text' : 'cursor-not-allowed'
        }`}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          height: '48px',
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingTop: isLabelActive ? '8px' : '0px',
          paddingBottom: isLabelActive ? '8px' : '0px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isLabelActive ? 'flex-start' : 'center',
          position: 'relative',
        }}
      >
        {/* Floating Label */}
        <label
          className={`pointer-events-none font-normal transition-all duration-200 ${getLabelColor()}`}
          style={{
            position: 'absolute',
            left: '16px',
            top: isLabelActive ? '8px' : '50%',
            transform: isLabelActive ? 'translateY(0)' : 'translateY(-50%)',
            fontSize: isLabelActive ? '12px' : '16px',
            lineHeight: isLabelActive ? '12px' : '20px',
            letterSpacing: '-0.03em',
            height: isLabelActive ? '12px' : '20px',
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Input field */}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="outline-none bg-transparent text-fg-1 disabled:text-stroke-fg-disabled"
          style={{
            fontSize: '16px',
            lineHeight: '20px',
            letterSpacing: '-0.03em',
            margin: 0,
            padding: 0,
            border: 'none',
            minWidth: 0,
            height: '20px',
            marginTop: isLabelActive ? '12px' : '0',
          }}
          placeholder=""
        />

        {/* Clear button - centered vertically in the container */}
        {value && !disabled && isFocused && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleClear();
            }}
            className="hover:bg-gray-100 rounded transition-colors absolute"
            aria-label="Clear input"
            type="button"
            style={{
              width: '24px',
              height: '24px',
              padding: 0,
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <CloseIcon sx={{ fontSize: 24, color: getClearButtonColor() }} />
          </button>
        )}
      </div>
    </div>
  );
}
