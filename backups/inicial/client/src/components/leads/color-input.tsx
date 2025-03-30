import { useState } from "react";

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  const [colorValue, setColorValue] = useState(value);
  
  // Handle color picker change
  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColorValue(newColor);
    onChange(newColor);
  };
  
  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColorValue(newColor);
    
    // Only update if it's a valid color format
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newColor)) {
      onChange(newColor);
    }
  };
  
  // Handle text input blur (final validation)
  const handleTextBlur = () => {
    // If the color is not a valid hex format, reset to the previous valid value
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(colorValue)) {
      setColorValue(value);
    } else {
      onChange(colorValue);
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={colorValue}
        onChange={handlePickerChange}
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
      />
      <input
        type="text"
        value={colorValue}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        className="w-20 text-xs px-2 py-1 border border-gray-300 rounded"
        placeholder="#000000"
      />
    </div>
  );
}
