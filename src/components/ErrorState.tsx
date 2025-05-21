import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = "We couldn't find any events. Please try a different search.",
  onRetry 
}) => {
  return (
    <div className="w-full py-12 flex flex-col items-center text-center animate-fadeIn">
      <div className="rounded-full bg-red-100 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
      >
        Try Again
      </button>
      
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md">
        <h4 className="font-medium text-amber-800 mb-2">Suggestions:</h4>
        <ul className="text-sm text-amber-700 text-left list-disc list-inside space-y-1">
          <li>Check the spelling of the city name</li>
          <li>Try a major city like "New York" or "London"</li>
          <li>Use hyphens for multi-word cities (e.g., "San-Francisco")</li>
          <li>Try a different location nearby</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorState;