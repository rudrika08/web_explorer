import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="w-full py-12 flex flex-col items-center animate-fadeIn">
      <div className="w-20 h-20 relative">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-lg text-gray-600">Discovering amazing events...</p>
      <div className="mt-4 max-w-md text-center">
        <p className="text-sm text-gray-500">We're searching high and low to find the best events for you. This may take a moment.</p>
      </div>
    </div>
  );
};

export default LoadingState;