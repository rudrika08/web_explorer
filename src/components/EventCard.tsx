import React from 'react';
import { Calendar, MapPin, ExternalLink, Info } from 'lucide-react';
import { Event } from '../types/Event';

interface EventCardProps {
  event: Event;
  showDescription: boolean;
  index: number;
}

const EventCard: React.FC<EventCardProps> = ({ event, showDescription, index }) => {
  // Animation delay based on index for staggered entry
  const animationDelay = `${index * 100}ms`;
  
  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn"
      style={{ animationDelay }}
    >
      <div className="relative aspect-video bg-gray-200 overflow-hidden">
        {event.image ? (
          <img 
            src={event.image} 
            alt={event.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`;
            }}
          />
        ) : (
          <img
            src={`https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`}
            alt="Event"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white line-clamp-2">{event.name}</h3>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 flex-shrink-0 text-purple-600 mt-0.5" />
          <span className="text-gray-700">{event.date_time}</span>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 flex-shrink-0 text-pink-500 mt-0.5" />
          <span className="text-gray-700">{event.location || "Location not specified"}</span>
        </div>
        
        {showDescription && event.description && (
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
            <p className="text-gray-600 line-clamp-3">{event.description}</p>
          </div>
        )}
        
        <a 
          href={event.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors"
        >
          View Event <ExternalLink className="ml-1 h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

export default EventCard;