import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const api = {
  async getArticleSummary(url) {
    try {
      const response = await axios.post(`${API_URL}/article-summary`, { url });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  async scrapeUrl(url) {
    try {
      const response = await axios.post(`${API_URL}/scrape-url`, { url });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default api; 