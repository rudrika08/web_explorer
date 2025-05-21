import React, { useState } from 'react';
import { SearchIcon, RefreshCw } from 'lucide-react';
import { SearchParams } from '../types/Event';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [city, setCity] = useState('');
  const [maxEvents, setMaxEvents] = useState(5);
  const [showDescriptions, setShowDescriptions] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      onSearch({
        city: city.trim(),
        maxEvents,
        showDescriptions
      });
      
      fetch('http://127.0.0.1:10000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ city, maxEvents })
      })
        .then(response => response.json())
        .then(data => {
          // Handle the data received from the backend
          console.log(data);
        })
        .catch(error => {
          console.error('Error fetching events:', error);
        });
    }
  };

  const popularCities = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Berlin'];
  
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Find Events Near You</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <div className="relative">
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name (e.g., San Francisco, London)"
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              disabled={isLoading}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {popularCities.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => setCity(city)}
                disabled={isLoading}
                className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-1/2">
            <label htmlFor="maxEvents" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Events
            </label>
            <select
              id="maxEvents"
              value={maxEvents}
              onChange={(e) => setMaxEvents(parseInt(e.target.value))}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              disabled={isLoading}
            >
              {[5, 10, 15, 20].map(num => (
                <option key={num} value={num}>{num} events</option>
              ))}
            </select>
          </div>
          
          <div className="w-full sm:w-1/2 flex items-end">
            <label className="flex items-center cursor-pointer w-full">
              <input
                type="checkbox"
                checked={showDescriptions}
                onChange={() => setShowDescriptions(!showDescriptions)}
                className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 transition-colors"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">Show descriptions</span>
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !city.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {isLoading ? (
            <>
              <RefreshCw className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Searching...
            </>
          ) : (
            'Search Events'
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;