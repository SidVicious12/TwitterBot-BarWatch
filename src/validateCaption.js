/**
 * Caption Validator - Hard rules enforcement
 * These are HARD FAILURES, not scores. Invalid = rejected.
 */

const HARD_RULES = {
    maxChars: 260,
    maxSentences: 2,
    minImageWidth: 600,
    minImageHeight: 600
};

// Banned meta-scaffold labels that bloat captions
const BANNED_PATTERNS = [
    /\b(POV:|Insider:|Question:|Statement:|Observation:)/i,
    /\bFACT:/i
];

// Date patterns that should never appear unless from scraped facts
const DATE_PATTERNS = [
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?\b/gi,
    /\b(May|Nov|Feb|Mar)\s+\d{1,4}\b/gi,
    /\b\d{1,2}:\d{2}\s*(AM|PM|PT|EST|PST)\b/gi
];

/**
 * Validate a caption against hard rules
 * Returns { ok: false, reason: string } if invalid
 * Returns { ok: true } if valid
 */
export function validateCaption(caption, options = {}) {
    const {
        maxChars = HARD_RULES.maxChars,
        maxSentences = HARD_RULES.maxSentences,
        hasFactFromBackend = false
    } = options;

    const text = caption.trim();

    // Rule 1: Character limit
    if (text.length > maxChars) {
        return { ok: false, reason: 'too_long', detail: `${text.length} > ${maxChars} chars` };
    }

    // Rule 2: Sentence count (max 2)
    const sentenceCount = countSentences(text);
    if (sentenceCount > maxSentences) {
        return { ok: false, reason: 'too_many_sentences', detail: `${sentenceCount} > ${maxSentences} sentences` };
    }

    // Rule 3: No meta-scaffold labels
    for (const pattern of BANNED_PATTERNS) {
        if (pattern.test(text)) {
            return { ok: false, reason: 'meta_scaffold_labels', detail: `Contains banned pattern: ${pattern}` };
        }
    }

    // Rule 4: No dates unless from backend facts
    if (!hasFactFromBackend) {
        for (const pattern of DATE_PATTERNS) {
            if (pattern.test(text)) {
                return { ok: false, reason: 'invented_date', detail: `Contains date without backend fact: ${text.match(pattern)?.[0]}` };
            }
        }
    }

    return { ok: true };
}

/**
 * Count sentences in text
 * Handles ellipses, abbreviations, and edge cases
 */
export function countSentences(text) {
    // Normalize ellipses to single period
    let normalized = text.replace(/\.{2,}/g, '.');

    // Remove common abbreviations that might confuse counting
    normalized = normalized.replace(/\b(Mr|Mrs|Ms|Dr|vs|etc|e\.g|i\.e)\./gi, '$1');

    // Split on sentence-ending punctuation followed by space or end
    const sentences = normalized
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    return sentences.length;
}

/**
 * Check if an image is low resolution
 */
export function isLowRes(width, height, minShortSide = HARD_RULES.minImageWidth) {
    const shortSide = Math.min(width || 0, height || 0);
    return shortSide < minShortSide;
}

/**
 * Strip invented dates from a caption (fallback sanitization)
 */
export function stripInventedDates(text) {
    let result = text;
    for (const pattern of DATE_PATTERNS) {
        result = result.replace(pattern, '');
    }
    // Clean up double spaces
    return result.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Explain why candidates were rejected (for debugging)
 */
export function explainRejections(rejected) {
    const reasons = {};
    for (const r of rejected) {
        reasons[r.reason] = (reasons[r.reason] || 0) + 1;
    }
    return reasons;
}

export default {
    validateCaption,
    isLowRes,
    stripInventedDates,
    countSentences,
    explainRejections,
    HARD_RULES
};
