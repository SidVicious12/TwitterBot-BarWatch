import { pickTweet, getCurrentPhase, getDaysUntilExam, getWeeksSinceExam } from './tweetBank.js';
import { loadMemory, addCaption, checkRepetition } from './memoryStore.js';

/**
 * Caption Generator v3.0 - Tweet-bank-first approach
 * Uses pre-written bangers with day-of-year rotation.
 * No more flaky LLM calls for daily content.
 */

const FORCED_HASHTAGS = ['#KimKardashian', '#BarWatch'];

/**
 * Generate a caption for today's tweet
 * @param {Object} inputs - { scrapedItems, hasNewUpdate, overridePhase }
 */
export async function generateCaption(inputs = {}) {
    const { scrapedItems = [], hasNewUpdate = false, overridePhase = null } = inputs;

    console.log('✍️ Generating caption (v3 - tweet bank)...\n');

    const now = new Date();
    const phase = overridePhase || getCurrentPhase(now);
    const days = getDaysUntilExam(now);
    const weeks = getWeeksSinceExam(now);

    console.log(`   Phase: ${phase}`);
    console.log(`   Days to exam: ${days}`);

    // Check if news search found a PASS or FAIL result
    const breakingPhase = detectBreakingNews(scrapedItems);
    const effectivePhase = breakingPhase || phase;

    if (breakingPhase) {
        console.log(`   🚨 BREAKING NEWS detected: ${breakingPhase}`);
    }

    // Pick tweet from bank
    const { tweet, index, poolSize } = pickTweet(effectivePhase, now);

    console.log(`   Selected tweet #${index + 1}/${poolSize} from "${effectivePhase}" pool`);
    console.log(`   Length: ${tweet.length} chars`);

    // Anti-repetition check against memory
    const memory = loadMemory();
    const repetitionCheck = checkRepetition(memory, tweet, { structure: effectivePhase });

    if (repetitionCheck.isRepetitive) {
        console.log(`   ⚠️ Repetition detected, shifting index...`);
        const shifted = pickTweet(effectivePhase, new Date(now.getTime() + 86400000));
        console.log(`   Using shifted tweet #${shifted.index + 1} instead`);

        addCaption(memory, shifted.tweet, { structure: effectivePhase });

        return {
            caption: shifted.tweet,
            phase: effectivePhase,
            charCount: shifted.tweet.length,
            success: true
        };
    }

    addCaption(memory, tweet, { structure: effectivePhase });

    return {
        caption: tweet,
        phase: effectivePhase,
        charCount: tweet.length,
        success: true
    };
}

/**
 * Scan scraped headlines for definitive PASS or FAIL news
 */
function detectBreakingNews(scrapedItems) {
    if (!scrapedItems || scrapedItems.length === 0) return null;

    for (const item of scrapedItems) {
        const text = (item.text || '').toLowerCase();
        if (text.includes('passed') && text.includes('bar')) return 'passed';
        if (text.includes('failed') && text.includes('bar')) return 'failed';
    }
    return null;
}

export default { generateCaption, FORCED_HASHTAGS };
