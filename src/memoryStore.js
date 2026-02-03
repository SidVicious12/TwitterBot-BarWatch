import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Memory Store for anti-repetition tracking
 * Persists last 10 captions, search results, and used images
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE = path.join(__dirname, '../data/memory.json');

// Default memory structure
const DEFAULT_MEMORY = {
    recentCaptions: [],        // Last 10 captions
    lastSearchHash: null,      // Hash of last search results (for dedup)
    usedImages: [],            // Last 10 image IDs/URLs
    metaphorsUsed: [],         // Metaphors in last 10 captions
    hashtagCombos: [],         // Last 3 hashtag combos
    lastStructure: null        // Last caption structure type
};

/**
 * Load memory from disk
 */
export function loadMemory() {
    try {
        if (fs.existsSync(MEMORY_FILE)) {
            const data = fs.readFileSync(MEMORY_FILE, 'utf-8');
            return { ...DEFAULT_MEMORY, ...JSON.parse(data) };
        }
    } catch (error) {
        console.warn('⚠️ Could not load memory, using defaults:', error.message);
    }
    return { ...DEFAULT_MEMORY };
}

/**
 * Save memory to disk
 */
export function saveMemory(memory) {
    try {
        const dir = path.dirname(MEMORY_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
    } catch (error) {
        console.error('❌ Failed to save memory:', error.message);
    }
}

/**
 * Add a caption to memory and update tracking
 */
export function addCaption(memory, caption, metadata = {}) {
    const { metaphor, hashtagCombo, structure, imageId } = metadata;

    // Add caption (keep last 10)
    memory.recentCaptions.unshift(caption);
    if (memory.recentCaptions.length > 10) {
        memory.recentCaptions.pop();
    }

    // Track metaphor
    if (metaphor) {
        memory.metaphorsUsed.unshift(metaphor);
        if (memory.metaphorsUsed.length > 10) {
            memory.metaphorsUsed.pop();
        }
    }

    // Track hashtag combo
    if (hashtagCombo) {
        memory.hashtagCombos.unshift(hashtagCombo);
        if (memory.hashtagCombos.length > 3) {
            memory.hashtagCombos.pop();
        }
    }

    // Track structure
    memory.lastStructure = structure || null;

    // Track used image
    if (imageId) {
        memory.usedImages.unshift(imageId);
        if (memory.usedImages.length > 10) {
            memory.usedImages.pop();
        }
    }

    saveMemory(memory);
    return memory;
}

/**
 * Check if a caption would be repetitive
 */
export function checkRepetition(memory, proposedCaption, metadata = {}) {
    const issues = [];

    // Check opening phrase (first 5 words)
    const proposedOpening = proposedCaption.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
    for (const recent of memory.recentCaptions) {
        const recentOpening = recent.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
        if (proposedOpening === recentOpening) {
            issues.push(`Same opening phrase: "${proposedOpening}"`);
            break;
        }
    }

    // Check metaphor reuse
    if (metadata.metaphor && memory.metaphorsUsed.includes(metadata.metaphor)) {
        issues.push(`Metaphor already used: "${metadata.metaphor}"`);
    }

    // Check hashtag combo (max 2 in a row)
    if (metadata.hashtagCombo) {
        const lastTwo = memory.hashtagCombos.slice(0, 2);
        if (lastTwo.every(combo => combo === metadata.hashtagCombo)) {
            issues.push(`Same hashtag combo 3 times in a row`);
        }
    }

    // Check structure (no back-to-back)
    if (metadata.structure && metadata.structure === memory.lastStructure) {
        issues.push(`Same structure back-to-back: "${metadata.structure}"`);
    }

    return {
        isRepetitive: issues.length > 0,
        issues
    };
}

/**
 * Check if an image was recently used
 */
export function wasImageUsedRecently(memory, imageId) {
    return memory.usedImages.includes(imageId);
}

/**
 * Update search hash (for deduplication)
 */
export function updateSearchHash(memory, hash) {
    const wasNew = memory.lastSearchHash !== hash;
    memory.lastSearchHash = hash;
    saveMemory(memory);
    return wasNew;
}

/**
 * Create hash from search results
 */
export function hashSearchResults(results) {
    if (!results || results.length === 0) return 'empty';
    const str = results.map(r => `${r.text}|${r.source}`).sort().join('||');
    // Simple hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

export default {
    loadMemory,
    saveMemory,
    addCaption,
    checkRepetition,
    wasImageUsedRecently,
    updateSearchHash,
    hashSearchResults
};
