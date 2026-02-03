import Replicate from 'replicate';
import { loadMemory, addCaption, checkRepetition, hashSearchResults, updateSearchHash } from './memoryStore.js';
import { extractVisualAnchors } from './imageFetcher.js';
import { validateCaption, stripInventedDates, countSentences, explainRejections } from './validateCaption.js';

/**
 * Caption Generator v2.1 - Hard rule enforcement
 * 1-2 sentences max, no invented dates, image-aligned, ≤260 chars
 */

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN
});

// Caption structure types for anti-repetition
const STRUCTURE_TYPES = ['observation', 'question', 'comparison', 'quote_riff'];

// Forced hashtags
const FORCED_HASHTAGS = ['#KimKardashian', '#BarExam'];
const OPTIONAL_HASHTAGS = ['#LawSchool', '#RealityTV', '#CaliforniaBar', '#BarResults'];

// Max retries for LLM
const MAX_RETRIES = 3;

/**
 * Generate a caption for the given inputs
 */
export async function generateCaption(inputs) {
    const {
        imageDescription,
        scrapedItems = [],
        hasNewUpdate = false,
        isLowResImage = false
    } = inputs;

    console.log('✍️ Generating caption...\n');

    // Load memory for anti-repetition
    const memory = loadMemory();
    const recentCaptions = memory.recentCaptions || [];

    // Extract visual anchors from image
    const visualAnchors = extractVisualAnchors(imageDescription);
    console.log(`   Visual anchors: ${visualAnchors.length > 0 ? visualAnchors.join(', ') : 'none detected'}`);

    // FACT GATING: Only use facts if they exist in scrapedItems
    const chosenFact = scrapedItems.length > 0 ? scrapedItems[0] : null;
    const hasFactFromBackend = chosenFact !== null;

    console.log(`   Backend facts: ${hasFactFromBackend ? chosenFact.text : 'NONE (dates will be stripped)'}`);

    // Check if search results are new
    const searchHash = hashSearchResults(scrapedItems);
    const isNewSearch = updateSearchHash(memory, searchHash);

    // Pick a structure to avoid repeating last one
    const availableStructures = STRUCTURE_TYPES.filter(s => s !== memory.lastStructure);
    const suggestedStructure = availableStructures[Math.floor(Math.random() * availableStructures.length)];

    // Pick optional hashtag (avoid repeating combo)
    const optionalTag = selectOptionalHashtag(memory.hashtagCombos);

    const prompt = buildPrompt({
        imageDescription,
        visualAnchors,
        chosenFact,
        hasFactFromBackend,
        recentCaptions: recentCaptions.slice(0, 5),
        hasNewUpdate: hasNewUpdate && isNewSearch,
        suggestedStructure,
        optionalTag,
        isLowResImage
    });

    let attempts = [];
    let validCaption = null;

    // Try up to MAX_RETRIES times to get a valid caption
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`   Attempt ${attempt}/${MAX_RETRIES}...`);

            const output = await replicate.run(
                "openai/gpt-5-nano",
                {
                    input: {
                        prompt: attempt > 1 ? prompt + `\n\nPREVIOUS ATTEMPT REJECTED. BE SHORTER. MAX 2 SENTENCES.` : prompt,
                        max_tokens: 256,
                        temperature: 0.8 + (attempt * 0.1)
                    }
                }
            );

            const content = output.join('');
            const result = parseResponse(content);

            if (!result || !result.caption) {
                attempts.push({ text: content, reason: 'parse_failed' });
                continue;
            }

            // Strip any hashtags from LLM output (we'll add forced ones later)
            let caption = result.caption.trim().replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();

            // HARD VALIDATION
            const validation = validateCaption(caption, {
                maxChars: 260,
                maxSentences: 2,
                hasFactFromBackend
            });

            if (!validation.ok) {
                console.log(`   ❌ Rejected: ${validation.reason} - ${validation.detail}`);
                attempts.push({ text: caption, reason: validation.reason, detail: validation.detail });

                // If too long or has invented dates, try to fix
                if (validation.reason === 'invented_date') {
                    caption = stripInventedDates(caption);
                    const recheck = validateCaption(caption, { maxChars: 260, maxSentences: 2, hasFactFromBackend: true });
                    if (recheck.ok) {
                        validCaption = caption;
                        break;
                    }
                }
                continue;
            }

            // Caption passed validation
            validCaption = caption;
            break;

        } catch (error) {
            console.error(`   Attempt ${attempt} error:`, error.message);
            attempts.push({ text: '', reason: 'api_error', detail: error.message });
        }
    }

    // Debug: explain rejections
    if (attempts.length > 0) {
        console.log(`   Rejection reasons:`, explainRejections(attempts));
    }

    // Fallback if all attempts failed
    if (!validCaption) {
        console.log('   ⚠️ All attempts failed, using fallback');
        validCaption = generateFallbackCaption(visualAnchors, isLowResImage, optionalTag);
    }

    // Final sentence count check
    const finalSentences = countSentences(validCaption);
    console.log(`\n   ✅ Caption generated (${validCaption.length} chars, ${finalSentences} sentences)`);

    // Check for repetition
    const repetitionCheck = checkRepetition(memory, validCaption, {
        hashtagCombo: `${FORCED_HASHTAGS.join(' ')} ${optionalTag}`,
        structure: suggestedStructure
    });

    if (repetitionCheck.isRepetitive) {
        console.log(`   ⚠️ Repetition warning: ${repetitionCheck.issues.join(', ')}`);
    }

    // Save to memory
    addCaption(memory, validCaption, {
        hashtagCombo: `${FORCED_HASHTAGS.join(' ')} ${optionalTag}`,
        structure: suggestedStructure
    });

    // CRITICAL: Force hashtags to appear in caption
    const finalCaption = `${validCaption} ${FORCED_HASHTAGS.join(' ')} ${optionalTag}`.trim();

    console.log(`   With hashtags: ${finalCaption}`);

    return {
        caption: finalCaption,
        hashtags: [...FORCED_HASHTAGS, optionalTag],
        structure: suggestedStructure,
        sentenceCount: finalSentences,
        charCount: finalCaption.length,
        rejectedAttempts: attempts.length,
        success: true
    };
}

/**
 * Build the LLM prompt - NO DEFAULT DATES
 */
function buildPrompt({ imageDescription, visualAnchors, chosenFact, hasFactFromBackend, recentCaptions, hasNewUpdate, suggestedStructure, optionalTag, isLowResImage }) {

    const anchorList = visualAnchors.length > 0
        ? visualAnchors.join(', ')
        : (imageDescription || 'Kim Kardashian meme');

    const factInstruction = hasFactFromBackend
        ? `USE THIS FACT: "${chosenFact.text}" (from ${chosenFact.source})`
        : `NO FACTS AVAILABLE. Do NOT mention any dates, times, or specific results. Focus on humor/snark only.`;

    const lowResNote = isLowResImage
        ? `The image is LOW RESOLUTION (blurry). Acknowledge the pixels humorously.`
        : '';

    const recentOpenings = recentCaptions.length > 0
        ? `AVOID these opening words: ${recentCaptions.map(c => `"${c.split(/\s+/).slice(0, 3).join(' ')}..."`).join(', ')}`
        : '';

    return `You write VERY SHORT, snarky tweets about Kim Kardashian's bar exam saga.

IMAGE CONTENT: ${anchorList}
${lowResNote}

${factInstruction}

HARD RULES (MUST FOLLOW):
1. MAXIMUM 2 SENTENCES. No more.
2. MAXIMUM 260 characters total (including hashtags).
3. Do NOT invent dates, times, or results.
4. Do NOT use labels like "POV:" or "Insider:" in the text.
5. Reference the image content: ${anchorList}
6. End with: #KimKardashian #BarExam ${optionalTag}

${recentOpenings}

STYLE: ${suggestedStructure} - be snarky, amused, not supportive.

${hasNewUpdate ? 'This IS breaking news. Use 🚨.' : 'No news. Be funny about the waiting.'}

OUTPUT JSON ONLY:
{"caption": "Your tweet here with hashtags", "structure": "${suggestedStructure}"}`;
}

/**
 * Parse LLM response
 */
function parseResponse(content) {
    try {
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        // Extract first sentence if JSON fails
        const match = content.match(/["']?caption["']?\s*:\s*["']([^"']+)["']/i);
        if (match) {
            return { caption: match[1] };
        }
        return null;
    }
}

/**
 * Select optional hashtag avoiding recent combos
 */
function selectOptionalHashtag(recentCombos) {
    if (recentCombos && recentCombos.length >= 2) {
        for (const tag of OPTIONAL_HASHTAGS) {
            if (!recentCombos[0]?.includes(tag) || !recentCombos[1]?.includes(tag)) {
                return tag;
            }
        }
    }
    return OPTIONAL_HASHTAGS[Math.floor(Math.random() * OPTIONAL_HASHTAGS.length)];
}

/**
 * Generate fallback caption - guaranteed valid (NO hashtags, they are appended later)
 */
function generateFallbackCaption(visualAnchors, isLowResImage, optionalTag) {
    const anchor = visualAnchors[0] || 'this meme';

    const fallbacks = isLowResImage
        ? [
            `The pixels are blurry but the cope is crystal clear.`,
            `Low-res image, high-res drama.`,
            `Can't unsee ${anchor}, even at 144p.`
        ]
        : [
            `${anchor.charAt(0).toUpperCase() + anchor.slice(1)} says it all.`,
            `The ${anchor} energy is unmatched.`,
            `Nobody does ${anchor} quite like this.`
        ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export default {
    generateCaption,
    FORCED_HASHTAGS,
    OPTIONAL_HASHTAGS
};
