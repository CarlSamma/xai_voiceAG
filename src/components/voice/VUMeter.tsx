// VUMeter Component - Audio level visualization

interface VUMeterProps {
  level: number; // 0 to 1
  color?: 'green' | 'blue' | 'orange';
  width?: number;
  height?: number;
}

export function VUMeter({
  level,
  color = 'green',
  width = 100,
  height = 8,
}: VUMeterProps) {
  const getColorClass = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500';
      case 'orange':
        return 'bg-orange-500';
      default:
        return 'bg-xai-success';
    }
  };

  // Clamp level between 0 and 1
  const clampedLevel = Math.max(0, Math.min(1, level));
  const percentage = clampedLevel * 100;

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-xai-border ${getColorClass()}`}
      style={{ width, height }}
    >
      <div
        className={`absolute left-0 top-0 h-full vu-meter-bar ${getColorClass()} rounded-full`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}