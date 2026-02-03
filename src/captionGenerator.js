import Replicate from 'replicate';
import { loadMemory, addCaption, checkRepetition, hashSearchResults, updateSearchHash } from './memoryStore.js';
import { extractVisualAnchors } from './imageFetcher.js';

/**
 * Caption Generator - Produces witty, snarky, image-aligned captions
 * ≤260 chars, non-repetitive, references visual content
 */

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN
});

// Caption structure types for anti-repetition
const STRUCTURE_TYPES = ['pov', 'observation', 'question', 'statement', 'comparison', 'quote_riff'];

// Forced hashtags
const FORCED_HASHTAGS = ['#KimKardashian', '#BarExam'];
const OPTIONAL_HASHTAGS = ['#LawSchool', '#RealityTV', '#CaliforniaBar', '#BarResults'];

/**
 * Generate a caption for the given inputs
 */
export async function generateCaption(inputs) {
    const {
        imageDescription,
        imageCandidates,
        scrapedItems = [],
        hasNewUpdate = false
    } = inputs;

    console.log('✍️ Generating caption...\n');

    // Load memory for anti-repetition
    const memory = loadMemory();
    const recentCaptions = memory.recentCaptions || [];

    // Extract visual anchors from image
    const visualAnchors = extractVisualAnchors(imageDescription);
    console.log(`   Visual anchors: ${visualAnchors.length > 0 ? visualAnchors.join(', ') : 'none detected'}`);

    // Check if search results are new
    const searchHash = hashSearchResults(scrapedItems);
    const isNewSearch = updateSearchHash(memory, searchHash);

    // Build context for LLM
    const factsContext = scrapedItems.length > 0
        ? scrapedItems.map(f => `- ${f.matchedFact || f.text} (${f.source})`).join('\n')
        : 'No new facts available.';

    const anchorsContext = visualAnchors.length > 0
        ? `Image shows: ${visualAnchors.join(', ')}`
        : 'Image description: ' + (imageDescription || 'generic Kim Kardashian image');

    const recentContext = recentCaptions.slice(0, 5).length > 0
        ? `AVOID THESE RECENT OPENINGS:\n${recentCaptions.slice(0, 5).map(c => `- "${c.split(/\s+/).slice(0, 5).join(' ')}..."`).join('\n')}`
        : '';

    // Pick a structure to avoid repeating last one
    const availableStructures = STRUCTURE_TYPES.filter(s => s !== memory.lastStructure);
    const suggestedStructure = availableStructures[Math.floor(Math.random() * availableStructures.length)];

    // Pick optional hashtag (avoid repeating combo)
    const optionalTag = selectOptionalHashtag(memory.hashtagCombos);

    const prompt = buildPrompt({
        anchorsContext,
        factsContext,
        recentContext,
        hasNewUpdate: hasNewUpdate && isNewSearch,
        suggestedStructure,
        optionalTag,
        visualAnchors
    });

    try {
        // Call Replicate LLM
        const output = await replicate.run(
            "openai/gpt-5-nano",
            {
                input: {
                    prompt,
                    max_tokens: 512,
                    temperature: 0.9
                }
            }
        );

        const content = output.join('');
        console.log('   Raw LLM response received');

        // Parse response
        const result = parseResponse(content);

        if (!result || !result.caption) {
            throw new Error('Failed to parse LLM response');
        }

        // Validate and fix caption
        let caption = result.caption;

        // Ensure under 260 chars
        if (caption.length > 260) {
            caption = truncateCaption(caption, 260);
        }

        // Check for repetition
        const repetitionCheck = checkRepetition(memory, caption, {
            metaphor: result.metaphor,
            hashtagCombo: result.hashtags?.join(' '),
            structure: result.structure || suggestedStructure
        });

        if (repetitionCheck.isRepetitive) {
            console.log(`   ⚠️ Repetition detected: ${repetitionCheck.issues.join(', ')}`);
            // Could retry here, but for now just log
        }

        // Save to memory
        addCaption(memory, caption, {
            metaphor: result.metaphor,
            hashtagCombo: result.hashtags?.join(' '),
            structure: result.structure || suggestedStructure,
            imageId: result.imageId
        });

        console.log(`\n   ✅ Caption generated (${caption.length} chars)`);

        return {
            caption,
            hashtags: result.hashtags || [...FORCED_HASHTAGS, optionalTag].filter(Boolean),
            imageKeyword: result.imageKeyword || 'waiting',
            structure: result.structure || suggestedStructure,
            success: true
        };

    } catch (error) {
        console.error('❌ Caption generation failed:', error.message);

        // Fallback caption
        const fallback = generateFallbackCaption(visualAnchors, hasNewUpdate);

        return {
            caption: fallback,
            hashtags: FORCED_HASHTAGS,
            imageKeyword: 'waiting',
            structure: 'fallback',
            success: false,
            error: error.message
        };
    }
}

/**
 * Build the LLM prompt
 */
function buildPrompt({ anchorsContext, factsContext, recentContext, hasNewUpdate, suggestedStructure, optionalTag, visualAnchors }) {
    return `You are a witty, snarky social media manager for a Kim Kardashian Bar Exam tracker account. You are NOT supportive of Kim—you find the whole saga amusing and slightly absurd.

CONTEXT:
- Kim Kardashian failed the California bar exam in July 2025 (her 4th attempt).
- She's attempting again in February 2026.
- Results expected: May 1, 2026, 5:00 PM PT.
- Running jokes: psychics who said she'd pass, using ChatGPT, "mental breakdown," licensed PI.
- Today is ${new Date().toLocaleDateString()} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })}).

${anchorsContext}

FRESH FACTS (use ONE if available):
${factsContext}

${recentContext}

YOUR TASK:
${hasNewUpdate
            ? 'There IS new news. Write a BREAKING-style caption with 🚨.'
            : 'There is NO new news. Write a funny/snarky waiting/anticipation caption.'}

RULES:
1. Caption MUST reference something from the image: ${visualAnchors.length > 0 ? visualAnchors.join(' or ') : 'any visual element'}
2. MAX 260 characters (CRITICAL - this is a hard limit)
3. Tone: witty, snarky, non-supportive, slightly dramatic
4. Use structure: "${suggestedStructure}" (pov=POV joke, observation=insider comment, question=rhetorical, comparison=like/as comparison, quote_riff=play on a quote)
5. Include hashtags: #KimKardashian #BarExam${optionalTag ? ' ' + optionalTag : ''}
6. Do NOT use these phrases: "still waiting", "tick tock", "any day now", "stay tuned"
7. If image has quote text, riff on that quote

OUTPUT JSON:
{
  "caption": "The full tweet text including hashtags",
  "metaphor": "key metaphor used or null",
  "structure": "${suggestedStructure}",
  "imageKeyword": "studying|crying|waiting|chaos|results"
}`;
}

/**
 * Parse LLM response
 */
function parseResponse(content) {
    try {
        // Strip markdown code blocks if present
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        // Try to extract caption from plain text
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
            return { caption: lines[0].trim() };
        }
        return null;
    }
}

/**
 * Truncate caption intelligently
 */
function truncateCaption(caption, maxLength) {
    if (caption.length <= maxLength) return caption;

    // Find last space before limit
    const truncated = caption.slice(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength - 50) {
        return truncated.slice(0, lastSpace) + '...';
    }

    return truncated + '...';
}

/**
 * Select optional hashtag avoiding recent combos
 */
function selectOptionalHashtag(recentCombos) {
    // If last 2 combos had same optional tag, pick different one
    if (recentCombos.length >= 2) {
        for (const tag of OPTIONAL_HASHTAGS) {
            if (!recentCombos[0]?.includes(tag) || !recentCombos[1]?.includes(tag)) {
                return tag;
            }
        }
    }
    // Random selection
    return OPTIONAL_HASHTAGS[Math.floor(Math.random() * OPTIONAL_HASHTAGS.length)];
}

/**
 * Generate fallback caption when LLM fails
 */
function generateFallbackCaption(visualAnchors, hasNewUpdate) {
    const anchor = visualAnchors[0] || 'the grind';

    const fallbacks = [
        `${anchor.charAt(0).toUpperCase() + anchor.slice(1)}. The saga continues. #KimKardashian #BarExam`,
        `Another day, another ${anchor} moment. #KimKardashian #BarExam`,
        `The ${anchor} says it all. #KimKardashian #BarExam`
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export default {
    generateCaption,
    FORCED_HASHTAGS,
    OPTIONAL_HASHTAGS
};
