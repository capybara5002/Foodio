import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="relative h-10 w-10 rounded-full border border-[#4b362a]/10 bg-[#fffaf4] shadow-[0_12px_30px_rgba(77,49,31,0.1)]">
        <div className="absolute inset-1 rounded-full border-2 border-[#b76548] border-t-transparent animate-spin" />
      </div>
      <span className="ml-3 text-xs font-mono uppercase tracking-wider text-[#6f655b]">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
