
import requests
from bs4 import BeautifulSoup
import json
import time
import random
import logging
from datetime import datetime
from typing import List, Dict, Tuple, Optional, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

import subprocess
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

    
# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('event_scraper')

# User agents to rotate for avoiding rate limiting
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"
]

class EventScraper:
    """
    A class to scrape event details from Eventbrite.
    """
    
    def __init__(self, city: str, max_events: int = 10, delay: float = 1.0):
        """
        Initialize the EventScraper.
        
        Args:
            city (str): City name to search for events
            max_events (int): Maximum number of events to scrape
            delay (float): Delay between requests to avoid rate limiting
        """
        self.city = city.lower().replace(' ', '-')
        self.max_events = max_events
        self.delay = delay
        self.base_url = "https://www.eventbrite.com"
        
    def get_headers(self) -> Dict[str, str]:
        """Get request headers with a random user agent."""
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
    
    def make_request(self, url: str) -> Optional[BeautifulSoup]:
        """
        Make an HTTP request and return BeautifulSoup object.
        
        Args:
            url (str): URL to request
            
        Returns:
            Optional[BeautifulSoup]: BeautifulSoup object or None if request failed
        """
        try:
            response = requests.get(url, headers=self.get_headers(), timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Failed to retrieve page. Status code: {response.status_code} for URL: {url}")
                return None
                
            return BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            logger.error(f"Error making request to {url}: {e}")
            return None
    
    def extract_json_ld_events(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Extract event data from JSON-LD script tags.
        
        Args:
            soup (BeautifulSoup): BeautifulSoup object of the page
            
        Returns:
            List[Dict[str, Any]]: List of event data dictionaries
        """
        json_events = []
        
        script_tags = soup.find_all('script', {'type': 'application/ld+json'})
        for script in script_tags:
            try:
                data = json.loads(script.string)
                if isinstance(data, list):
                    for item in data:
                        if item.get('@type') == 'Event':
                            json_events.append(item)
                elif isinstance(data, dict) and data.get('@type') == 'Event':
                    json_events.append(data)
            except Exception as e:
                logger.debug(f"Error parsing JSON-LD: {e}")
                continue
                
        return json_events
    
    def extract_json_ld_event_details(self, event_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Extract event details from JSON-LD data.
        
        Args:
            event_data (Dict[str, Any]): JSON-LD event data
            
        Returns:
            Dict[str, str]: Extracted event details
        """
        name = event_data.get('name', 'No Title')
        
        # Handle date/time
        start_date = event_data.get('startDate', 'No Date')
        try:
            if isinstance(start_date, str) and start_date != 'No Date':
                # Try to parse and format the date
                dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                start_date = dt.strftime('%A, %B %d, %Y at %I:%M %p')
        except Exception:
            # Keep the original string if parsing fails
            pass
        
        # Handle location - extract just the essential location info
        location = 'No Location'
        location_data = event_data.get('location', {})
        if isinstance(location_data, dict):
            # First try just the venue name if available
            if location_data.get('name'):
                location = location_data.get('name')
            # If no name, try to construct a clean address
            elif location_data.get('address'):
                addr = location_data.get('address')
                if isinstance(addr, dict):
                    # Only include key address components
                    # Prefer street address + locality format
                    if addr.get('streetAddress') and addr.get('addressLocality'):
                        location = f"{addr.get('streetAddress')}, {addr.get('addressLocality')}"
                        if addr.get('addressRegion'):
                            location += f", {addr.get('addressRegion')}"
                    # Fallback to just locality + region
                    elif addr.get('addressLocality'):
                        location = addr.get('addressLocality')
                        if addr.get('addressRegion'):
                            location += f", {addr.get('addressRegion')}"
        
        # Get URL
        url = event_data.get('url', '')
        
        # Get description - limit length to avoid overly long descriptions
        description = event_data.get('description', 'No description available')
        if description and len(description) > 300:
            description = description[:297] + "..."
        
        # Get image
        image = event_data.get('image', '')
        if isinstance(image, list) and image:
            image = image[0]
        
        return {
            'name': name,
            'date_time': start_date,
            'location': location,
            'link': url,
            'description': description,
            'image': image
        }
    
    def extract_html_event_details(self, card: BeautifulSoup, event_url: str) -> Dict[str, str]:
        """
        Extract event details from HTML.
        
        Args:
            card (BeautifulSoup): Event card element
            event_url (str): Event URL
            
        Returns:
            Dict[str, str]: Extracted event details
        """
        # Extract title
        title = None
        for heading in card.select('h1, h2, h3, h4, h5'):
            if heading.text.strip():
                title = heading.text.strip()
                break
        
        if not title:
            title_candidates = card.select('[class*="title"], [class*="name"], strong, b')
            for candidate in title_candidates:
                if candidate.text.strip() and len(candidate.text.strip()) > 5:
                    title = candidate.text.strip()
                    break
        
        if not title:
            title = "Untitled Event"
        
        # Extract date
        date_str = None
        date_candidates = card.select('time, [class*="date"], [class*="time"], [datetime]')
        for date_elem in date_candidates:
            if date_elem.text.strip():
                date_str = date_elem.text.strip()
                break
        
        if not date_str:
            date_str = "Date not available"
        
        # Extract location
        location = None
        # Better location extraction - looking for elements that are more likely to contain just the location
        location_candidates = card.select('[aria-label*="location"], [data-automation="venue"], [class*="address-line"]')
        if not location_candidates:
            location_candidates = card.select('[class*="location"], [class*="venue"], [class*="address"], [class*="place"]')
        
        for loc_elem in location_candidates:
            loc_text = loc_elem.text.strip()
            # Filter out long text that's likely not just a location
            if loc_text and len(loc_text) < 100:
                location = loc_text
                break
        
        if not location:
            location = "Location not available"
        
        # Extract description (if available)
        description = "No description available"
        desc_candidates = card.select('[class*="desc"], [class*="summary"], [class*="about"]')
        for desc_elem in desc_candidates:
            if desc_elem.text.strip():
                description = desc_elem.text.strip()
                break
        
        # Try to find image
        image = ""
        img_tag = card.find('img')
        if img_tag and img_tag.get('src'):
            image = img_tag.get('src')
        
        return {
            'name': title,
            'date_time': date_str,
            'location': location,
            'link': event_url,
            'description': description,
            'image': image
        }
    
    def scrape_individual_event_page(self, url: str) -> Dict[str, str]:
        """
        Scrape details from an individual event page.
        
        Args:
            url (str): Event URL
            
        Returns:
            Dict[str, str]: Event details
        """
        logger.info(f"Scraping individual page: {url}")
        soup = self.make_request(url)
        
        if not soup:
            return {}
        
        # Try to extract from JSON-LD (most reliable)
        json_events = self.extract_json_ld_events(soup)
        
        if json_events:
            return self.extract_json_ld_event_details(json_events[0])
        
        # Fall back to HTML parsing
        event_details = {
            'name': 'Untitled Event',
            'date_time': 'Date not available',
            'location': 'Location not available',
            'link': url,
            'description': 'No description available',
            'image': ''
        }
        
        # Extract title
        title_element = soup.find('h1')
        if title_element:
            event_details['name'] = title_element.text.strip()
        
        # Extract date
        date_elements = soup.select('[class*="date"], [class*="time"], time, [datetime]')
        for elem in date_elements:
            if elem.text.strip():
                event_details['date_time'] = elem.text.strip()
                break
        
        # Extract location - improved to find concise location data
        # First try elements that typically have structured location data
        location_found = False
        venue_elements = soup.select('[aria-label*="venue"], [aria-label*="location"], [class*="venue-name"], [class*="address-line"]')
        for elem in venue_elements:
            loc_text = elem.text.strip()
            if loc_text and len(loc_text) < 150:  # Reasonable location length
                event_details['location'] = loc_text
                location_found = True
                break
        
        # If no structured element found, try schema markup
        if not location_found:
            meta_location = soup.find('meta', {'property': 'event:location'})
            if meta_location and meta_location.get('content'):
                event_details['location'] = meta_location.get('content')
                location_found = True
        
        # Last resort, try generic location classes
        if not location_found:
            location_elements = soup.select('[class*="location"], [class*="venue"], [class*="address"], [class*="place"]')
            for elem in location_elements:
                loc_text = elem.text.strip()
                # Avoid large text blocks by limiting length and removing multi-line content
                if loc_text and len(loc_text) < 100 and '\n' not in loc_text:
                    event_details['location'] = loc_text
                    break
        
        # Extract description
        desc_elements = soup.select('[class*="desc"], [class*="summary"], [class*="about"], [property="og:description"]')
        for elem in desc_elements:
            if hasattr(elem, 'content'):
                event_details['description'] = elem.get('content', '')
                break
            elif elem.text.strip():
                event_details['description'] = elem.text.strip()
                break
        
        # Extract image
        meta_image = soup.find('meta', {'property': 'og:image'})
        if meta_image and meta_image.get('content'):
            event_details['image'] = meta_image.get('content')
        
        return event_details
    
    def clean_text(self, text: str) -> str:
        """
        Clean text by removing extra whitespace and newlines.
        
        Args:
            text (str): Text to clean
            
        Returns:
            str: Cleaned text
        """
        if not text:
            return ""
        return " ".join(text.split())
    
    def extract_event_link(self, card: BeautifulSoup) -> Optional[str]:
        """
        Extract event link from card.
        
        Args:
            card (BeautifulSoup): Event card element
            
        Returns:
            Optional[str]: Event URL or None if not found
        """
        # Find any link that looks like an Eventbrite event link
        link_element = card.find('a', href=lambda href: href and ('/e/' in href or 'eventbrite.com/e/' in href))
        
        if not link_element:
            # Try any link
            link_element = card.find('a')
            
        if not link_element or not link_element.get('href'):
            return None
            
        event_url = link_element.get('href')
        
        # Check if URL is valid
        if not (event_url.startswith('http') or event_url.startswith('/')):
            return None
            
        # Add base URL if needed
        if not event_url.startswith('http'):
            event_url = f"{self.base_url}{event_url}"
            
        return event_url
    
    def scrape_events(self, scrape_individual: bool = True) -> List[Dict[str, str]]:
        """
        Scrape events from Eventbrite.
        
        Args:
            scrape_individual (bool): Whether to scrape individual event pages
            
        Returns:
            List[Dict[str, str]]: List of event dictionaries
        """
        url = f"{self.base_url}/d/{self.city}/all-events/"
        logger.info(f"Fetching events from {url}")
        
        soup = self.make_request(url)
        if not soup:
            return []
        
        events = []
        
        # Try to extract from JSON-LD first
        json_events = self.extract_json_ld_events(soup)
        logger.info(f"Found {len(json_events)} events in JSON-LD data")
        
        for event_data in json_events:
            event_details = self.extract_json_ld_event_details(event_data)
            events.append(self.clean_event_details(event_details))
            
            if len(events) >= self.max_events:
                return events
        
        # Fall back to HTML parsing if needed
        if len(events) < self.max_events:
            logger.info("Falling back to HTML parsing")
            
            # Try different selectors to find event cards
            event_cards = []
            selectors = [
                '[data-testid="event-card"]',
                'div[data-event-id], article[data-event-id]',
                'div.event-card, div.eds-event-card-content, article.eds-l-pad-all-4',
                'div.search-event-card-square-image'
            ]
            
            for selector in selectors:
                event_cards = soup.select(selector)
                if event_cards:
                    break
            
            logger.info(f"Found {len(event_cards)} potential event cards in HTML")
            
            if not event_cards:
                # If no cards found but we have some events from JSON-LD, return those
                if events:
                    return events
                logger.warning("Could not find event elements. Website structure may have changed.")
                return []
            
            for card in event_cards:
                try:
                    event_url = self.extract_event_link(card)
                    if not event_url:
                        continue
                    
                    event_details = {}
                    
                    # Get detailed information from individual event page if enabled
                    if scrape_individual:
                        # Add a delay to avoid rate limiting
                        time.sleep(self.delay)
                        event_details = self.scrape_individual_event_page(event_url)
                    
                    # If individual scraping failed or wasn't enabled, extract from the card
                    if not event_details:
                        event_details = self.extract_html_event_details(card, event_url)
                    
                    events.append(self.clean_event_details(event_details))
                    
                    # Limit the number of events
                    if len(events) >= self.max_events:
                        break
                        
                except Exception as e:
                    logger.error(f"Error processing event: {e}\nStandard Error Output: {result.stderr}")
                    continue
        
        return events
    
    def clean_event_details(self, event: Dict[str, str]) -> Dict[str, str]:
        """
        Clean event details.
        
        Args:
            event (Dict[str, str]): Event details
            
        Returns:
            Dict[str, str]: Cleaned event details
        """
        # Clean location - remove excessive text
        location = self.clean_text(event.get('location', 'Location not available'))
        # If location is too long, it's likely containing other content
        if len(location) > 100:
            # Try to extract just the first line or sentence
            if '\n' in location:
                location = location.split('\n')[0].strip()
            elif '.' in location:
                location = location.split('.')[0].strip() + '.'
            # Last resort - limit to first 80 chars
            if len(location) > 100:
                location = location[:80] + '...'
        
        return {
            'name': self.clean_text(event.get('name', 'Untitled Event')),
            'date_time': self.clean_text(event.get('date_time', 'Date not available')),
            'location': location,
            'link': event.get('link', ''),
            'description': self.clean_text(event.get('description', 'No description available')),
            'image': event.get('image', '')
        }

def display_events(events: List[Dict[str, str]], include_description: bool = False) -> None:
    """
    Display events in a clean, formatted way.
    
    Args:
        events (List[Dict[str, str]]): List of event dictionaries
        include_description (bool): Whether to include event descriptions
    """
    if not events:
        print("\n📅 No events found.")
        print("Suggestions:")
        print("1. Try a different city format (e.g., 'new-york' instead of 'new york')")
        print("2. Try a major city like 'san-francisco' or 'london'")
        return
    
    print(f"\n📅 Found {len(events)} upcoming events:\n")
    
    for i, event in enumerate(events, 1):
        print(f"🎟️ EVENT #{i}: {event['name']}")
        print(f"   📅 When: {event['date_time']}")
        
        # Keep location formatting simple and brief
        location = event['location']
        print(f"   📍 Where: {location}")
        
        if include_description and event['description'] != 'No description available':
            # Limit description length
            desc = event['description']
            if len(desc) > 150:
                desc = desc[:147] + "..."
            print(f"   ℹ️  Info: {desc}")
            
        print(f"   🔗 Link: {event['link']}")
        print()

def main():
    """Main function to run the event scraper."""
    print("=== 🎭 Event Finder 🎭 ===")
    
    while True:
        city = input("Enter city name (e.g., bangalore, san-francisco, new-york): ").strip()
        if not city:
            print("City name cannot be empty. Please try again.")
            continue
        break
    
    print(f"🔍 Searching for events in {city.title()}...")
    
    try:
        # Get number of events
        max_events_input = input("Number of events to fetch (default: 5): ").strip()
        max_events = 5
        if max_events_input and max_events_input.isdigit():
            max_events = int(max_events_input)
            max_events = min(max(1, max_events), 20)  # Limit between 1 and 20
        
        # Ask if user wants descriptions
        show_descriptions = input("Show event descriptions? (y/n, default: n): ").strip().lower() == 'y'
        
        # Initialize scraper
        scraper = EventScraper(city, max_events=max_events)
        
        # Scrape events
        events = scraper.scrape_events(scrape_individual=True)
        
        # Display results
        display_events(events, include_description=show_descriptions)
        
    except KeyboardInterrupt:
        print("\n\nSearch cancelled by user.")
    except Exception as e:
        logger.error(f"Error: {e}")
        print(f"\n❌ An error occurred: {e}\nStandard Error Output: {result.stderr}")
        print("Please try again with a different city or check your internet connection.")


   


@app.route('/api/events', methods=['POST', 'OPTIONS'])
def fetch_events():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        params = request.json
        if not params or 'city' not in params or 'maxEvents' not in params:
            return jsonify({'error': 'Missing required parameters'}), 400

        scraper = EventScraper(params['city'], int(params['maxEvents']))
        events = scraper.scrape_events()
        return jsonify(events)
    except Exception as e:
        logger.error(f'Error fetching events: {str(e)}')
        return jsonify({'error': 'Failed to fetch events'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))  # Render provides the port via an environment variable
    app.run(host='0.0.0.0', port=port, debug=True)