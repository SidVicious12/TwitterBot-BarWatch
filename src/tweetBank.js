/**
 * Tweet Bank - Pre-written bangers organized by phase
 * The CA bar exam is Feb 24-25, 2026. Results typically ~6 weeks later (early April).
 *
 * Phases:
 *   countdown  – before exam day
 *   exam_week  – Feb 22-25, 2026
 *   exam_day   – Feb 24 or 25, 2026
 *   results_pending – after exam, before results
 *   passed     – if she passes
 *   failed     – if she fails again
 */

const EXAM_DATE_START = new Date('2026-02-24T00:00:00-08:00');
const EXAM_DATE_END = new Date('2026-02-25T23:59:59-08:00');
const EXAM_WEEK_START = new Date('2026-02-22T00:00:00-08:00');
const RESULTS_EXPECTED = new Date('2026-04-10T00:00:00-07:00');

const TWEETS = {
  countdown: [
    `The California Bar Exam is in {days} days and Kim Kardashian is somewhere highlighting a textbook worth more than my rent.\n\n#KimKardashian #BarWatch`,

    `{days} days until Kim K sits for the bar exam again. The psychics said she'd pass last time too.\n\n#KimKardashian #BarWatch #BarExam`,

    `Kim Kardashian retaking the bar in {days} days. At this point she has more attempts than some people have hobbies.\n\n#KimKardashian #BarWatch`,

    `Not me setting a calendar reminder for someone else's bar exam but here we are. {days} days.\n\n#KimKardashian #BarWatch`,

    `{days} days out. Kim K is either deep in Constitutional Law flash cards or getting a facial. No in between.\n\n#KimKardashian #BarWatch`,

    `The February bar exam has a 30% pass rate. Kim has the audacity and the highlighters. {days} days.\n\n#KimKardashian #BarWatch #BarExam`,

    `Kim's bar exam countdown: {days} days. Her study playlist probably goes harder than most lawyers' closing arguments.\n\n#KimKardashian #BarWatch`,

    `{days} days until the California Bar Exam. Kim failed attempt #4 in July. Attempt #5 is coming and I am INVESTED.\n\n#KimKardashian #BarWatch`,

    `Somewhere in Calabasas, Kim Kardashian is staring at a Evidence outline like it personally wronged her. {days} days to go.\n\n#KimKardashian #BarWatch`,

    `The bar exam is {days} days away and Kim already passed the MPRE. The ethics portion is handled. Now about the other 11 subjects...\n\n#KimKardashian #BarWatch`,

    `{days} days. She cried studying last time. She blamed psychics. She came back anyway. Say what you will but that's commitment.\n\n#KimKardashian #BarWatch`,

    `{days} days until Kim K either becomes a lawyer or the most famous person to fail the bar five times.\n\n#KimKardashian #BarWatch`,

    `Me refreshing Twitter for Kim Kardashian bar exam updates like it's MY career on the line. {days} days.\n\n#KimKardashian #BarWatch`,

    `{days} days. The February bar is statistically the hardest sitting. Kim chose violence.\n\n#KimKardashian #BarWatch #CaliforniaBar`,

    `Reminder that Kim Kardashian is also a licensed private investigator in California. The bar exam is just a side quest. {days} days.\n\n#KimKardashian #BarWatch`,

    `At this point I'm more nervous about Kim's bar exam than she is. {days} days and counting.\n\n#KimKardashian #BarWatch`,

    `{days} days out and somewhere a Barbri tutor is earning their entire salary prepping one client.\n\n#KimKardashian #BarWatch`,

    `Robert Kardashian defended OJ. Kim is trying to pass the bar. The legal drama runs in the family. {days} days.\n\n#KimKardashian #BarWatch`,

    `Every law student who passed on their first try is watching Kim's journey and feeling simultaneously better and worse about themselves. {days} days.\n\n#KimKardashian #BarWatch`,

    `{days} days. She said she's "all in" until she passes. We said we're all in until she passes. This is a shared trauma now.\n\n#KimKardashian #BarWatch`,
  ],

  exam_week: [
    `It's exam week. Kim Kardashian vs the California Bar Exam, Round 5. The vibes are tense.\n\n#KimKardashian #BarWatch #BarExam`,

    `The California Bar Exam starts this week. Kim K is either laser focused or having a tasteful meltdown. Both are valid.\n\n#KimKardashian #BarWatch`,

    `Exam week energy: Kim Kardashian has probably memorized more legal standards than most first-year associates. Let's see if the bar agrees.\n\n#KimKardashian #BarWatch`,

    `This is the week. February 2026 California Bar Exam. Kim Kardashian. Attempt number five. I need a documentary crew on this.\n\n#KimKardashian #BarWatch`,

    `Bar exam week and I genuinely cannot focus on my own job because I keep thinking about Kim K's Con Law essay.\n\n#KimKardashian #BarWatch`,
  ],

  exam_day: [
    `TODAY IS THE DAY. Kim Kardashian is sitting for the California Bar Exam right now. Sending chaotic energy only. 🚨\n\n#KimKardashian #BarWatch #BarExam`,

    `Kim Kardashian is taking the bar exam AS WE SPEAK. Somewhere a proctor is trying to act normal about it. 🚨\n\n#KimKardashian #BarWatch`,

    `The California Bar Exam is happening right now. Kim K is in there with a #2 pencil and a dream. 🚨\n\n#KimKardashian #BarWatch`,

    `Day 2 of the bar exam. Kim Kardashian woke up today and chose to fight the MBE. Respect. 🚨\n\n#KimKardashian #BarWatch #BarExam`,

    `Live footage of me pretending to work while Kim Kardashian takes the bar exam: 👀\n\n#KimKardashian #BarWatch`,
  ],

  results_pending: [
    `The bar exam is over. Now we wait. Kim Kardashian is either celebrating or spiraling and we won't know for weeks.\n\n#KimKardashian #BarWatch`,

    `Kim K finished the February bar exam. Results come out in about 6 weeks. The waiting game begins.\n\n#KimKardashian #BarWatch #CaliforniaBar`,

    `Petition to make California release bar exam results faster because some of us have parasocial anxiety about Kim Kardashian's legal career.\n\n#KimKardashian #BarWatch`,

    `The bar exam is done. Kim is probably at a spa. I am refreshing calbar.ca.gov. We are not the same.\n\n#KimKardashian #BarWatch`,

    `Still waiting on February bar exam results. No news is no news. The State Bar does not care about our timeline.\n\n#KimKardashian #BarWatch`,

    `Every day I check for California bar results and every day the State Bar reminds me that patience is a legal virtue or something.\n\n#KimKardashian #BarWatch`,

    `Week {weeks} of waiting for Kim K's bar exam results. I've developed a refresh habit that borders on clinical.\n\n#KimKardashian #BarWatch`,

    `Still no bar exam results. At this point I think the California State Bar is doing this for dramatic effect.\n\n#KimKardashian #BarWatch`,

    `The suspense of waiting for Kim's bar results is genuinely worse than any reality TV cliffhanger she's ever produced.\n\n#KimKardashian #BarWatch`,

    `If Kim Kardashian passed the February bar exam, she'll be the most famous lawyer since her own dad. No pressure.\n\n#KimKardashian #BarWatch`,
  ],

  passed: [
    `🚨 BREAKING: Kim Kardashian PASSED the California Bar Exam on attempt #5.\n\nShe actually did it. Attorney Kardashian is real.\n\n#KimKardashian #BarWatch #BarExam`,

    `🚨 KIM KARDASHIAN IS A LAWYER.\n\nFailed 4 times. Cried studying. Blamed psychics. Passed the hardest bar in the country.\n\nWhat a saga. What an ending.\n\n#KimKardashian #BarWatch`,
  ],

  failed: [
    `Kim Kardashian did not pass the February 2026 California Bar Exam.\n\nAttempt #5 is in the books. The question now: attempt #6?\n\n#KimKardashian #BarWatch #BarExam`,

    `Kim K failed the bar again. The February sitting has a 30% pass rate so she's in the majority. The comeback arc continues.\n\n#KimKardashian #BarWatch`,
  ],
};

/**
 * Determine which phase we're in based on current date
 */
export function getCurrentPhase(now = new Date()) {
  if (now >= EXAM_DATE_START && now <= EXAM_DATE_END) return 'exam_day';
  if (now >= EXAM_WEEK_START && now < EXAM_DATE_START) return 'exam_week';
  if (now < EXAM_WEEK_START) return 'countdown';
  if (now > EXAM_DATE_END && now < RESULTS_EXPECTED) return 'results_pending';
  return 'results_pending';
}

/**
 * Get days until exam
 */
export function getDaysUntilExam(now = new Date()) {
  const diff = EXAM_DATE_START - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Get weeks since exam ended (for results_pending phase)
 */
export function getWeeksSinceExam(now = new Date()) {
  const diff = now - EXAM_DATE_END;
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
}

/**
 * Pick a tweet for today — deterministic by day-of-year so no repeats within a phase
 * @param {string} phase - Override phase (for breaking news like passed/failed)
 * @returns {{ tweet: string, phase: string }}
 */
export function pickTweet(phase = null, now = new Date()) {
  const activePhase = phase || getCurrentPhase(now);
  const pool = TWEETS[activePhase];

  if (!pool || pool.length === 0) {
    return { tweet: `BarWatch update: still tracking. #KimKardashian #BarWatch`, phase: activePhase };
  }

  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % pool.length;
  let tweet = pool[index];

  const days = getDaysUntilExam(now);
  const weeks = getWeeksSinceExam(now);
  tweet = tweet.replace(/\{days\}/g, String(days));
  tweet = tweet.replace(/\{weeks\}/g, String(weeks));

  return { tweet, phase: activePhase, index, poolSize: pool.length };
}

export { TWEETS, EXAM_DATE_START, EXAM_DATE_END, RESULTS_EXPECTED };
