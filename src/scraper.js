import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Web scraper for bar exam news
 * Searches multiple news sources for updates about Kim Kardashian's bar exam
 */

const NEWS_SOURCES = [
  {
    name: 'AP News',
    url: 'https://apnews.com/search?q=kim+kardashian+bar+exam',
    selector: '.Component-headline-0-2-152'
  },
  {
    name: 'Reuters',
    url: 'https://www.reuters.com/search/news?blob=kim+kardashian+bar+exam',
    selector: '.search-result-title'
  },
  {
    name: 'TMZ',
    url: 'https://www.tmz.com/search/?q=kim+kardashian+bar+exam',
    selector: '.search-item__title'
  },
  {
    name: 'Variety',
    url: 'https://variety.com/?s=kim+kardashian+bar+exam',
    selector: '.c-title__link'
  }
];

/**
 * Scrapes a single news source
 */
async function scrapeSource(source) {
  try {
    console.log(`🔍 Scraping ${source.name}...`);

    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BarWatch/1.0; +https://github.com/barwatch)'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const headlines = [];

    $(source.selector).each((i, element) => {
      if (i < 5) { // Limit to 5 headlines per source
        const text = $(element).text().trim();
        if (text && text.length > 10) {
          headlines.push(text);
        }
      }
    });

    console.log(`✅ ${source.name}: Found ${headlines.length} headlines`);

    return {
      source: source.name,
      headlines,
      success: true,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ ${source.name} failed:`, error.message);
    return {
      source: source.name,
      headlines: [],
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Scrapes all news sources concurrently
 */
export async function scrapeAllSources() {
  console.log('🚀 Starting news scraping...\n');

  const results = await Promise.all(
    NEWS_SOURCES.map(source => scrapeSource(source))
  );

  // Aggregate all headlines
  const allHeadlines = results
    .filter(r => r.success)
    .flatMap(r => r.headlines);

  console.log(`\n📊 Total headlines found: ${allHeadlines.length}`);

  return {
    results,
    allHeadlines,
    totalSources: NEWS_SOURCES.length,
    successfulSources: results.filter(r => r.success).length,
    timestamp: new Date().toISOString()
  };
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
