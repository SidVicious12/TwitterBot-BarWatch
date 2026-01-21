import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Web scraper for bar exam news
 * Uses Google News RSS feed for reliable updates about Kim Kardashian's bar exam
 */

const BASE_RSS_URL = 'https://news.google.com/rss/search';

/**
 * Scrapes news from Google News RSS with multiple query variations
 */
export async function scrapeAllSources() {
  console.log('🚀 Starting news scraping via Google News RSS...\n');

  const queries = [
    'Kim Kardashian bar exam',
    'Kim Kardashian law student',
    'Kim Kardashian baby bar',
    'Kim Kardashian lawyer journey'
  ];

  const allHeadlines = new Set();

  try {
    for (const query of queries) {
      console.log(`   Searching for: "${query}"...`);
      const url = `${BASE_RSS_URL}?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BarWatch/1.0; +https://github.com/barwatch)'
        },
        timeout: 10000
      });

      // Parse XML/RSS with cheerio
      const $ = cheerio.load(response.data, { xmlMode: true });
      $('item').each((i, element) => {
        if (i < 5) { // Top 5 per query
          const title = $(element).find('title').text().trim();
          const pubDate = $(element).find('pubDate').text().trim();

          if (title && title.length > 10) {
            allHeadlines.add(`${title} (${pubDate})`);
          }
        }
      });
    }

    const headlinesArray = Array.from(allHeadlines);
    console.log(`✅ Google News RSS: Found ${headlinesArray.length} unique headlines`);

    return {
      allHeadlines: headlinesArray,
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
