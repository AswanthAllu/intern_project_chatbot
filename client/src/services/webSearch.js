import axios from 'axios';

export async function webSearch(query) {
  const response = await axios.get(`/api/websearch?q=${encodeURIComponent(query)}`);
  return response.data;
} 