'use client';

interface ConfidenceIndicatorProps {
  confidence: number; // 0 to 1
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  size = 'medium',
  showLabel = false,
  showPercentage = true,
  className = '',
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);
  const level = getConfidenceLevel(confidence);

  const sizeClasses = {
    small: 'w-16 h-2',
    medium: 'w-24 h-3',
    large: 'w-32 h-4',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className={`font-medium text-gray-700 ${textSizeClasses[size]}`}>Confidence:</span>
      )}

      <div className="flex items-center space-x-2">
        {/* Progress bar */}
        <div className={`bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <div
            className={`h-full transition-all duration-500 ${level.color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Percentage */}
        {showPercentage && (
          <span className={`font-semibold ${level.textColor} ${textSizeClasses[size]}`}>
            {percentage}%
          </span>
        )}
      </div>

      {/* Level badge */}
      {size !== 'small' && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${level.badgeColor}`}>
          {level.label}
        </span>
      )}
    </div>
  );
}

interface ConfidenceLevel {
  label: string;
  color: string;
  textColor: string;
  badgeColor: string;
}

function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) {
    return {
      label: 'High',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      badgeColor: 'bg-green-100 text-green-700',
    };
  }
  if (confidence >= 0.6) {
    return {
      label: 'Good',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
    };
  }
  if (confidence >= 0.4) {
    return {
      label: 'Medium',
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      badgeColor: 'bg-orange-100 text-orange-700',
    };
  }
  return {
    label: 'Low',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-700',
  };
}

// Circular confidence indicator variant
export function CircularConfidenceIndicator({
  confidence,
  size = 60,
  showPercentage = true,
  className = '',
}: {
  confidence: number;
  size?: number;
  showPercentage?: boolean;
  className?: string;
}) {
  const percentage = Math.round(confidence * 100);
  const level = getConfidenceLevel(confidence);
  const circumference = 2 * Math.PI * (size / 2 - 5);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 5}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 5}
          fill="none"
          stroke={getStrokeColor(confidence)}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${level.textColor}`} style={{ fontSize: size / 4 }}>
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
}

function getStrokeColor(confidence: number): string {
  if (confidence >= 0.8) return '#10b981'; // green-500
  if (confidence >= 0.6) return '#3b82f6'; // blue-500
  if (confidence >= 0.4) return '#f59e0b'; // orange-500
  return '#ef4444'; // red-500
}
