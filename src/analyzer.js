import Replicate from 'replicate';

/**
 * Replicate AI analyzer for bar exam news
 * Uses GPT-5 Nano to determine if Kim Kardashian passed the bar exam
 */

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

/**
 * Analyzes news headlines to determine bar exam status
 */
export async function analyzeBarExamStatus(headlines) {
  console.log('🤖 Analyzing headlines with Replicate AI (GPT-5 Nano)...\n');

  // Even if no headlines, we use LLM to generate a creative "waiting" tweet
  const hasNews = headlines && headlines.length > 0;
  const headlinesText = hasNews
    ? headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')
    : "No recent news headlines found.";

  // Use day of year as a seed for variety
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const toneOptions = ['sassy', 'supportive', 'delusional', 'chaotic', 'studious', 'impatient'];
  const todaysTone = toneOptions[dayOfYear % toneOptions.length];

  const prompt = `You are a social media manager for the "Kim Kardashian Bar Exam Tracker" account. You are a stan (super fan) but also a little unhinged and very funny.
  
CONTEXT:
- Kim Kardashian failed the California bar exam in July 2025 (her 4th attempt).
- She announced in November 2025 she would retake the bar exam in February 2026.
- She was seen crying while studying and mentioned a "mental breakdown" is normal.
- She blamed psychics who said she would pass, and there were jokes about her using ChatGPT.
- She is a licensed private investigator in California (yes, really).
- Today is ${new Date().toLocaleDateString()} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })}).
- February 2026 exam is coming up soon!

NEWS HEADLINES FOUND:
${headlinesText}

YOUR TONE TODAY: ${todaysTone.toUpperCase()}

TASK:
Determine if there is any REAL update.
- If YES (Passed/Failed): Write a BREAKING NEWS tweet. Use sirens 🚨.
- If NO (No news/Old news): Write a creative, funny, or "mood" tweet about the waiting game.

CRITICAL RULES:
1. **NEVER** repeat the same format or words like "Still waiting".
2. Today your tone is "${todaysTone}". Embrace it fully:
   - sassy: "Where are the results? asking for a friend (me)"
   - supportive: "Sending all my energy to Kim rn 💫"
   - delusional: "She already passed in my heart ❤️"
   - chaotic: "If Kim doesn't pass I'm suing the bar association"
   - studious: "Do not disturb mode activated 📵"
   - impatient: "Me refreshing the California Bar results page every 5 minutes"
3. Reference recent news/memes when possible (psychics, ChatGPT, mental breakdown, PI license).
4. Use hashtags: #KimKardashian #BarExam
5. Keep it under 280 chars.

OUTPUT JSON:
{
  "status": "PASSED" | "FAILED" | "PENDING" | "NO_NEWS",
  "confidence": 0.0-1.0,
  "shouldTweet": true,
  "message": "The tweet text",
  "imageKeyword": "sad" | "studying" | "confident" | "funny" | "waiting" | "chaos"
}
`;

  try {
    const output = await replicate.run(
      "openai/gpt-5-nano",
      {
        input: {
          prompt: prompt,
          max_tokens: 1024,
          temperature: 0.9 // High temperature for variety
        }
      }
    );

    const content = output.join('');
    console.log('📝 Replicate response:', content);

    // Parse JSON response
    // Sometimes LLMs add markdown code blocks, strip them
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

    console.log(`\n✅ Analysis complete:`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Message: ${result.message}\n`);

    return result;

  } catch (error) {
    console.error('❌ Replicate analysis failed', error);
    // Fallback if LLM fails
    return {
      status: 'NO_NEWS',
      shouldTweet: true,
      message: 'Still waiting on bar exam updates! 📚 #KimKardashian #BarExam',
      confidence: 1.0,
      imageKeyword: 'waiting'
    };
  }
}

export default {
  analyzeBarExamStatus
};
