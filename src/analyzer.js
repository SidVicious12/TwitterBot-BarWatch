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

  if (!headlines || headlines.length === 0) {
    return {
      status: 'NO_NEWS',
      message: 'Did Kim Kardashian pass the bar? Still waiting for news... 📚\nBar exam scheduled for February 2026\n#KimKardashian #BarExam #Law',
      confidence: 1.0,
      shouldTweet: true
    };
  }

  const prompt = `You are analyzing news headlines to determine if Kim Kardashian has passed the California Bar Exam.

CONTEXT:
- Kim Kardashian failed the California bar exam in July 2025
- She is retaking the bar exam in February 2026
- Results typically come out 4-6 weeks after the exam
- She passed the MPRE (ethics exam) in March 2025

NEWS HEADLINES:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

TASK:
Analyze these headlines and determine:
1. Has she PASSED the bar exam? (clear confirmation needed)
2. Has she FAILED another attempt? (clear confirmation needed)
3. Is there SIGNIFICANT NEWS about her bar exam journey?
4. Or is this just old news/speculation?

Respond in JSON format:
{
  "status": "PASSED" | "FAILED" | "PENDING" | "NO_NEWS",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "shouldTweet": true/false,
  "message": "tweet text if shouldTweet is true (max 280 chars)"
}

Guidelines for message:
- If PASSED: Congratulatory message with emoji
- If FAILED: Supportive message about trying again
- If PENDING: Update about waiting for results
- If NO_NEWS: Don't tweet
- Always include #KimKardashian #BarExam
- Keep under 280 characters`;

  try {
    const output = await replicate.run(
      "openai/gpt-5-nano",
      {
        input: {
          prompt: prompt,
          max_tokens: 1024,
          temperature: 0.7
        }
      }
    );

    const content = output.join('');
    console.log('📝 Replicate response:', content);

    // Parse JSON response
    const result = JSON.parse(content);

    console.log(`\n✅ Analysis complete:`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`   Should tweet: ${result.shouldTweet ? 'Yes' : 'No'}`);
    if (result.shouldTweet) {
      console.log(`   Message: ${result.message}\n`);
    }

    return result;

  } catch (error) {
    console.error('❌ Replicate analysis failed');
    console.error('   Error message:', error.message);
    console.error('   Status code:', error.response?.status || error.statusCode || 'N/A');
    
    if (error.response?.data) {
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.data) {
      console.error('   Error data:', JSON.stringify(error.data, null, 2));
    }
    
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }

    // Fallback: simple keyword detection
    return fallbackAnalysis(headlines);
  }
}

/**
 * Fallback analysis using simple keyword detection
 */
function fallbackAnalysis(headlines) {
  console.log('⚠️  Using fallback analysis...\n');

  const headlinesText = headlines.join(' ').toLowerCase();

  // Check for "passed" keywords
  if (headlinesText.includes('passed') || headlinesText.includes('attorney')) {
    return {
      status: 'PASSED',
      confidence: 0.7,
      reasoning: 'Keywords suggest she passed',
      shouldTweet: true,
      message: '🎉 BREAKING: Kim Kardashian passed the bar! 👩‍⚖️\n#KimKardashian #BarExam #Lawyer'
    };
  }

  // Check for "failed" keywords
  if (headlinesText.includes('failed') || headlinesText.includes('did not pass')) {
    return {
      status: 'FAILED',
      confidence: 0.7,
      reasoning: 'Keywords suggest she failed',
      shouldTweet: true,
      message: 'Update: Not this attempt, but she\'s committed to trying again. 💪\n#KimKardashian #BarExam'
    };
  }

  // Check for exam-related news
  if (headlinesText.includes('bar exam') || headlinesText.includes('studying')) {
    return {
      status: 'PENDING',
      confidence: 0.6,
      reasoning: 'General bar exam news found',
      shouldTweet: true,
      message: 'Kim Kardashian preparing for bar exam in February 2026! 📚\n#KimKardashian #BarExam #Law'
    };
  }

  // No relevant news
  return {
    status: 'NO_NEWS',
    confidence: 0.5,
    reasoning: 'No significant bar exam news found',
    shouldTweet: false,
    message: null
  };
}

/**
 * Gets a countdown message for the upcoming exam
 */
export function getCountdownMessage() {
  const examDate = new Date('2026-02-24'); // February 2026 bar exam
  const today = new Date();
  const daysUntil = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 0) {
    return 'Kim Kardashian\'s bar exam is happening now! 📚\nResults expected in 4-6 weeks.\n#KimKardashian #BarExam';
  }

  if (daysUntil <= 7) {
    return `⏰ ${daysUntil} days until Kim Kardashian takes the bar exam!\nFebruary 2026 attempt coming soon.\n#KimKardashian #BarExam`;
  }

  if (daysUntil <= 30) {
    return `Kim Kardashian's bar exam in ${daysUntil} days! 📚\nShe's preparing for February 2026.\n#KimKardashian #BarExam #Law`;
  }

  return 'Did Kim Kardashian pass the bar? Still waiting for news... 📚\nBar exam scheduled for February 2026\n#KimKardashian #BarExam #Law';
}

export default {
  analyzeBarExamStatus,
  getCountdownMessage
};
