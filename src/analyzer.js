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

  const prompt = `You are a social media manager for a dedicated Kim Kardashian Bar Exam tracker account.
  
CONTEXT:
- Kim Kardashian failed the California bar exam in July 2025.
- She is expected to retake the bar exam in February 2026.
- Results typically come out 4-6 weeks after the exam.
- Today is ${new Date().toLocaleDateString()}.
- You have access to a vault of memes/images to attach.

NEWS HEADLINES:
${headlinesText}

TASK:
Determine if there is any REAL update.
- If YES (Passed/Failed): Write a breaking news tweet.
- If NO (No news/Old news): Write a creative, funny, or supportive "Still waiting" or "Study mode" tweet. **Make it different every time.**

OUTPUT JSON:
{
  "status": "PASSED" | "FAILED" | "PENDING" | "NO_NEWS",
  "confidence": 0.0-1.0,
  "shouldTweet": true,
  "message": "The tweet text (max 280 chars). Use hashtags #KimKardashian #BarExam.",
  "imageKeyword": "sad" | "studying" | "confident" | "funny" | "waiting"
}

GUIDELINES:
- Be witty or supportive.
- VARY the "No News" tweets. Don't just say "No news yet". Mention the countdown, study vibes, or community support.
- If NO_NEWS, status should be NO_NEWS.
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
