import React, { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import EventCard from './EventCard';
import { Event } from '../types/Event';

interface EventListProps {
  events: Event[];
  showDescriptions: boolean;
  city: string;
}

const EventList: React.FC<EventListProps> = ({ events, showDescriptions, city }) => {
  const [sortBy, setSortBy] = useState<'default' | 'date' | 'name'>('default');
  const [showFilters, setShowFilters] = useState(false);
  
  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === 'date') {
      return a.date_time.localeCompare(b.date_time);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });
  
  return (
    <div className="w-full animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {events.length} Events in {city}
        </h2>
        
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Sort & Filter</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {showFilters && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-2 border border-gray-200">
              <div className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold">Sort By</div>
              <button
                className={`w-full text-left px-4 py-2 hover:bg-purple-50 ${sortBy === 'default' ? 'text-purple-600 font-medium' : 'text-gray-700'}`}
                onClick={() => setSortBy('default')}
              >
                Default
              </button>
              <button
                className={`w-full text-left px-4 py-2 hover:bg-purple-50 ${sortBy === 'date' ? 'text-purple-600 font-medium' : 'text-gray-700'}`}
                onClick={() => setSortBy('date')}
              >
                Date (Earliest First)
              </button>
              <button
                className={`w-full text-left px-4 py-2 hover:bg-purple-50 ${sortBy === 'name' ? 'text-purple-600 font-medium' : 'text-gray-700'}`}
                onClick={() => setSortBy('name')}
              >
                Name (A-Z)
              </button>
            </div>
          )}
        </div>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No events found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event, index) => (
            <EventCard 
              key={`${event.name}-${index}`} 
              event={event} 
              showDescription={showDescriptions}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;