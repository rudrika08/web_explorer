import { Event, SearchParams } from '../types/Event';

// In a real application, this would make an API call to your backend
// that runs the Python script. For this demo, we'll simulate the API call.
const apiUrl = import.meta.env.VITE_API_URL || 'http://default-url.com';


export const searchEvents = async (params: SearchParams): Promise<Event[]> => {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Error fetching events');
  }

  return response.json();
};