import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-2 text-xs font-mono uppercase tracking-wider">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
