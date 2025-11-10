import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

/**
 * Loading State Component
 * Displays a loading spinner with optional message
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && (
        <p className={`${textSizeClasses[size]} text-muted-foreground`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * Skeleton Loader Component
 * Displays a skeleton placeholder for content
 */
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`bg-muted animate-pulse ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

/**
 * Match Card Skeleton
 * Skeleton loader for match history cards
 */
export const MatchCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width="48px" height="48px" />
          <div className="space-y-2">
            <Skeleton width="120px" height="16px" />
            <Skeleton width="80px" height="12px" />
          </div>
        </div>
        <Skeleton width="60px" height="24px" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} variant="rectangular" width="32px" height="32px" />
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton width="100px" height="12px" />
        <Skeleton width="80px" height="12px" />
      </div>
    </div>
  );
};

/**
 * Chart Skeleton
 * Skeleton loader for chart components
 */
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '300px' }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <Skeleton width="150px" height="20px" className="mb-4" />
      <Skeleton width="100%" height={height} />
    </div>
  );
};

/**
 * Loading Overlay
 * Semi-transparent overlay with loading spinner
 */
interface LoadingOverlayProps {
  message?: string;
  isLoading: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  isLoading,
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
        <LoadingState message={message} size="lg" />
      </div>
    </div>
  );
};

/**
 * Inline Loading
 * Small inline loading indicator
 */
export const InlineLoading: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
};

export default LoadingState;
