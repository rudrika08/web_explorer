export interface Event {
  name: string;
  date_time: string;
  location: string;
  link: string;
  description: string;
  image: string;
}

export interface SearchParams {
  city: string;
  maxEvents: number;
  showDescriptions: boolean;
}