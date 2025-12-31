import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Web scraper for bar exam news
 * Uses Google News RSS feed for reliable updates about Kim Kardashian's bar exam
 */

const RSS_URL = 'https://news.google.com/rss/search?q=Kim+Kardashian+bar+exam&hl=en-US&gl=US&ceid=US:en';

/**
 * Scrapes news from Google News RSS
 */
export async function scrapeAllSources() {
  console.log('🚀 Starting news scraping via Google News RSS...\n');

  try {
    const response = await axios.get(RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BarWatch/1.0; +https://github.com/barwatch)'
      },
      timeout: 10000
    });

    // Parse XML/RSS with cheerio
    const $ = cheerio.load(response.data, { xmlMode: true });
    const headlines = [];
    const items = $('item');

    items.each((i, element) => {
      if (i < 10) { // Get top 10
        const title = $(element).find('title').text().trim();
        const pubDate = $(element).find('pubDate').text().trim();
        // Filter out very old news if needed, but for now just gather them
        // Also filter out noise if titles are too short
        if (title && title.length > 10) {
          headlines.push(`${title} (${pubDate})`);
        }
      }
    });

    console.log(`✅ Google News RSS: Found ${headlines.length} headlines`);

    return {
      allHeadlines: headlines,
      success: true,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ RSS Scraping failed');
    console.error('   Error message:', error.message);
    
    return {
      allHeadlines: [],
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Searches for specific keywords in headlines
 */
export function searchHeadlines(headlines, keywords) {
  const matches = headlines.filter(headline => {
    const lower = headline.toLowerCase();
    return keywords.some(keyword => lower.includes(keyword.toLowerCase()));
  });

  return {
    matches,
    count: matches.length,
    keywords
  };
}

export default {
  scrapeAllSources,
  searchHeadlines
};
