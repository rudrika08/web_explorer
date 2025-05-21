import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import SearchForm from './components/SearchForm';
import EventList from './components/EventList';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import { Event, SearchParams } from './types/Event';
import { searchEvents } from './services/eventsApi';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentCity, setCurrentCity] = useState('');
  const [showDescriptions, setShowDescriptions] = useState(false);

  const handleSearch = async (params: SearchParams) => {
    setLoading(true);
    setError(null);
    setCurrentCity(params.city);
    setShowDescriptions(params.showDescriptions);
    
    try {
      const results = await searchEvents(params);
      setEvents(results);
      setSearchPerformed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSearchPerformed(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-600" />
              <h1 className="ml-2 text-3xl font-bold text-gray-900">
                Event<span className="text-purple-600">Explorer</span>
              </h1>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">Home</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">Popular Events</a>
              <a href="#" className="text-gray-700 hover:text-purple-600 transition-colors">About</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-12">
          {!searchPerformed || error ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl transform -rotate-1 -z-10 opacity-10"></div>
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                  Discover Amazing <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Events</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Find exciting events happening in your city or anywhere around the world.
                </p>
              </div>
              
              <SearchForm onSearch={handleSearch} isLoading={loading} />
            </div>
          ) : (
            <div className="mb-10">
              <SearchForm onSearch={handleSearch} isLoading={loading} />
            </div>
          )}
          
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={handleRetry} />
          ) : searchPerformed && (
            <EventList 
              events={events} 
              showDescriptions={showDescriptions}
              city={currentCity}
            />
          )}
        </div>
      </main>
      
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-purple-400" />
                <h2 className="ml-2 text-xl font-bold">
                  Event<span className="text-purple-400">Explorer</span>
                </h2>
              </div>
              <p className="mt-4 text-gray-400">
                Discover and explore the best events happening around you.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Popular Events</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Subscribe</h3>
              <p className="text-gray-400 mb-4">
                Get the latest events and updates delivered to your inbox.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-r-lg transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© 2025 EventExplorer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;