/**
 * @layer features
 * @segment trade-area-creation
 * @what 半径スライダー（0.1〜50km）
 */

'use client';

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function RadiusSlider({
  value,
  onChange,
  min = 0.1,
  max = 50,
  step = 0.1,
}: RadiusSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Radius</span>
        <span className="font-medium">{value.toFixed(1)} km</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min} km</span>
        <span>{max} km</span>
      </div>
    </div>
  );
}
