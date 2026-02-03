import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Web Searcher - Autonomous search for Kim Kardashian bar exam news
 * Searches trusted sources and extracts up to 2 concrete facts
 */

// Trusted sources by tier
const TRUSTED_SOURCES = {
    official: ['calbar.ca.gov', 'state bar of california'],
    tier1: ['people.com', 'usatoday.com', 'latimes.com', 'tmz.com', 'eonline.com', 'etonline.com'],
    tier2: ['nbcnews.com', 'newsweek.com', 'yahoo.com', 'elle.com', 'vanityfair.com'],
    legal: ['abovethelaw.com', 'dailyjournal.com', 'jdadvising.com', 'law360.com']
};

// Search queries to use
const SEARCH_QUERIES = [
    'Kim Kardashian California bar exam results',
    'Kim Kardashian bar exam fail 2025',
    'California bar exam results schedule February 2026',
    'Kim Kardashian law school update'
];

/**
 * Search Google News RSS for bar exam news
 */
async function searchGoogleNews(query) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BarWatch/2.0)'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data, { xmlMode: true });
        const items = [];

        $('item').each((i, element) => {
            if (i < 5) {
                const title = $(element).find('title').text().trim();
                const link = $(element).find('link').text().trim();
                const pubDate = $(element).find('pubDate').text().trim();
                const source = $(element).find('source').text().trim();

                items.push({ title, link, pubDate, source });
            }
        });

        return items;
    } catch (error) {
        console.warn(`⚠️ Search failed for "${query}":`, error.message);
        return [];
    }
}

/**
 * Filter results to trusted sources only
 */
function filterTrustedSources(items) {
    const allTrusted = [
        ...TRUSTED_SOURCES.official,
        ...TRUSTED_SOURCES.tier1,
        ...TRUSTED_SOURCES.tier2,
        ...TRUSTED_SOURCES.legal
    ];

    return items.filter(item => {
        const sourceLower = (item.source || '').toLowerCase();
        const linkLower = (item.link || '').toLowerCase();

        return allTrusted.some(trusted =>
            sourceLower.includes(trusted) || linkLower.includes(trusted)
        );
    });
}

/**
 * Extract concrete facts from headlines
 * Returns structured scraped_items[]
 */
function extractFacts(items) {
    const facts = [];

    // Keywords indicating concrete facts
    const factPatterns = [
        { pattern: /pass(?:ed|es)?/i, type: 'status' },
        { pattern: /fail(?:ed|s)?/i, type: 'status' },
        { pattern: /results?\s+(?:release|out|announced)/i, type: 'result_timing' },
        { pattern: /(?:february|march|may|june)\s+\d{4}/i, type: 'date' },
        { pattern: /attempt\s+#?\d/i, type: 'attempt' },
        { pattern: /bar\s+exam\s+(?:score|results?)/i, type: 'result' },
        { pattern: /"[^"]+"/i, type: 'quote' }
    ];

    for (const item of items) {
        const title = item.title || '';

        for (const { pattern, type } of factPatterns) {
            const match = title.match(pattern);
            if (match) {
                facts.push({
                    text: title,
                    source: item.source || extractDomain(item.link),
                    type,
                    matchedFact: match[0],
                    pubDate: item.pubDate,
                    link: item.link
                });
                break; // One fact per headline
            }
        }

        // Limit to 2 facts
        if (facts.length >= 2) break;
    }

    return facts;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

/**
 * Determine source tier for prioritization
 */
function getSourceTier(source) {
    const s = source.toLowerCase();
    if (TRUSTED_SOURCES.official.some(t => s.includes(t))) return 0;
    if (TRUSTED_SOURCES.tier1.some(t => s.includes(t))) return 1;
    if (TRUSTED_SOURCES.tier2.some(t => s.includes(t))) return 2;
    if (TRUSTED_SOURCES.legal.some(t => s.includes(t))) return 3;
    return 4;
}

/**
 * Main search function
 * Returns scraped_items[] with up to 2 concrete facts
 */
export async function searchForNews() {
    console.log('🔍 Searching for bar exam news...\n');

    const allItems = [];

    // Search with each query
    for (const query of SEARCH_QUERIES) {
        console.log(`   Searching: "${query}"...`);
        const results = await searchGoogleNews(query);
        allItems.push(...results);
    }

    // Deduplicate by title
    const uniqueItems = [];
    const seenTitles = new Set();
    for (const item of allItems) {
        const key = item.title.toLowerCase().slice(0, 50);
        if (!seenTitles.has(key)) {
            seenTitles.add(key);
            uniqueItems.push(item);
        }
    }

    console.log(`\n   Found ${uniqueItems.length} unique headlines`);

    // Filter to trusted sources
    const trustedItems = filterTrustedSources(uniqueItems);
    console.log(`   Trusted sources: ${trustedItems.length} headlines`);

    // Sort by source tier (official first)
    trustedItems.sort((a, b) => {
        const tierA = getSourceTier(a.source || a.link);
        const tierB = getSourceTier(b.source || b.link);
        return tierA - tierB;
    });

    // Extract concrete facts
    const facts = extractFacts(trustedItems);
    console.log(`   Extracted ${facts.length} concrete facts\n`);

    if (facts.length > 0) {
        for (const fact of facts) {
            console.log(`   📰 [${fact.source}] ${fact.matchedFact}: ${fact.text.slice(0, 60)}...`);
        }
        console.log('');
    }

    return {
        scrapedItems: facts,
        allHeadlines: trustedItems.map(i => i.title),
        searchedAt: new Date().toISOString(),
        hasNewUpdate: facts.length > 0
    };
}

/**
 * Check if search results are new (different from last time)
 */
export function areResultsNew(currentFacts, lastSearchHash, hashFunction) {
    const currentHash = hashFunction(currentFacts);
    return currentHash !== lastSearchHash;
}

export default {
    searchForNews,
    areResultsNew,
    TRUSTED_SOURCES
};
