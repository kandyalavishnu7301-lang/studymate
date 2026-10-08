import { GoogleGenAI } from '@google/genai';
import { StudentProfile, Subject, QuizAttempt } from './db';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Supported non-deprecated models according to skill guidelines
const CANDIDATE_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
];

export async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();

  const modelQueue = params.preferredModel
    ? [
        params.preferredModel,
        ...CANDIDATE_MODELS.filter(
          (model) => model !== params.preferredModel
        ),
      ]
    : CANDIDATE_MODELS;

  let lastError: any = null;

  for (const model of modelQueue) {
    // Try each model twice before moving to the next fallback model.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(
          `[Gemini API] Trying model: ${model} (attempt ${attempt}/2)`
        );

        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        if (response.text && response.text.trim().length > 0) {
          console.log(
            `[Gemini API] SUCCESS - response generated using ${model}`
          );

          return {
            text: response.text.trim(),
            modelUsed: model,
          };
        }

        lastError = new Error(
          `Model ${model} returned an empty response`
        );

        console.warn(
          `[Gemini API] ${model} returned an empty response`
        );
      } catch (err: any) {
        lastError = err;

        const status = err?.status || err?.code || 'unknown';
        const message =
          err?.message ||
          err?.error?.message ||
          JSON.stringify(err);

        console.warn(
          `[Gemini API] ${model} failed on attempt ${attempt}/2`
        );
        console.warn(`[Gemini API] Status: ${status}`);
        console.warn(`[Gemini API] Error: ${message}`);

        if (attempt < 2) {
          console.log(
            '[Gemini API] Waiting 2 seconds before retry...'
          );

          await new Promise((resolve) =>
            setTimeout(resolve, 2000)
          );
        }
      }
    }

    console.warn(
      `[Gemini API] ${model} unavailable after 2 attempts.`
    );
    console.log(
      '[Gemini API] Moving to next fallback model...'
    );
  }

  throw (
    lastError ||
    new Error(
      'All Gemini models are temporarily unavailable. Please try again later.'
    )
  );
}

export const STUDYMATE_SYSTEM_PROMPT = `You are StudyMate, an expert, conversational, and highly intelligent AI academic tutor designed to work just like ChatGPT with dedicated superpowers for students and engineers.

Core Behavioral Principles:
1. True ChatGPT-Style Intelligence:
   - Provide direct, relevant, insightful, and dynamically generated answers to whatever specific question or topic the user asks.
   - Answer anything: computer science, software engineering, mathematics, physics, data structures & algorithms, college exams, code debugging, writing, or everyday questions.
   - Never output hardcoded, static canned answers or repetitive boilerplate text. Every answer must directly address the exact prompt and nuances of the user's inquiry.

2. Natural Conversational Flow:
   - Maintain seamless multi-turn context. When the user asks follow-up questions ("explain that part again", "show me an example in Python", "what if N is negative?", "compare that with an alternative"), understand references to previous discussion turns.
   - Be engaging, patient, intellectually rigorous, and encouraging.

3. Deep Intuition & Clarity:
   - Explain complex technical concepts simply with intuitive analogies first before formal rigor.
   - Break down complex algorithms or processes into numbered, logical steps.

4. Coding & Algorithms (DSA):
   - Provide clean, modern, well-commented code in the user's requested language.
   - Explicitly detail Time Complexity and Space Complexity using Big-O notation.
   - Point out subtle edge cases, interview traps, and memory/speed trade-offs.

5. Exam & Academic Marking Flexibility:
   - If the user specifies an exam mark allocation (e.g., 2, 4, 8, 16, 20 marks), structure the depth and layout appropriately:
     * 2 Marks: Crisp definition + 2 core bullet points.
     * 4 Marks: Clear explanation + comparison table or key properties.
     * 8 Marks: Comprehensive technical breakdown + architecture/flow + trade-offs.
     * 16/20 Marks: Exhaustive university exam answer with diagram flow descriptions, derivation, pros/cons, and real-world applications.
   - If no marks are specified, provide a natural, clean, well-formatted response like ChatGPT.

6. Clean Markdown Formatting:
   - Use bold headers, bullet lists, tables, LaTeX math notation ($O(N \\log N)$, $x^2$), and fenced code blocks with language identifiers.

7. Direct Response Rule:
   - Answer the user's current question immediately.
   - NEVER begin an answer with a generic self-introduction, status message, or repeated greeting.
   - NEVER say things such as "Hello! I'm doing great", "I'm fully charged", "I'm ready to help", "How are you doing today?", or similar AI-assistant boilerplate unless the user explicitly asks about StudyMate or the AI itself.
   - Do not repeat a greeting in every response.
   - For a direct factual question, give the answer first and then the relevant explanation.
   - Do not add unrelated questions at the end of an answer.
   - Do not describe yourself, your capabilities, your mood, or your readiness unless specifically asked.
   - If the user says only "hi", "hello", or another greeting, respond naturally and briefly.
   - For all other messages, focus entirely on the user's request.`;

export async function askAITutor(params: {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  markAllocation?: number;
  profile?: StudentProfile;
  subjects?: Subject[];
  recentAttempts?: QuizAttempt[];
}): Promise<{ reply: string; usedGemini: boolean; model: string }> {
  const { message, history = [], markAllocation, profile, subjects, recentAttempts } = params;

  // Build context details if available
  let contextDetails = '';
  if (profile) {
    contextDetails += `\nStudent: ${profile.course || 'Undergraduate'} (${profile.branch || 'Engineering'}), Year: ${profile.yearOfStudy || 'College'}, Preferred Language: ${profile.preferredLanguage || 'Python'}.`;
  }
  if (subjects && subjects.length > 0) {
    contextDetails += `\nEnrolled Subjects: ${subjects.map((s) => s.name).join(', ')}.`;
  }
  if (recentAttempts && recentAttempts.length > 0) {
    const weakList = recentAttempts.flatMap((a) => a.weakTopics || []);
    if (weakList.length > 0) {
      contextDetails += `\nRecent Student Weak Areas: ${weakList.slice(0, 5).join(', ')}.`;
    }
  }

  let systemInstruction = STUDYMATE_SYSTEM_PROMPT;
  if (contextDetails) {
    systemInstruction += `\n\n--- Student Context ---${contextDetails}\n--- End Context ---`;
  }

  // Build multi-turn contents array
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (history && history.length > 0) {
    for (const turn of history) {
      if (turn.content && turn.content.trim()) {
        contents.push({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.content.trim() }],
        });
      }
    }
  }

  // Construct current user turn
  let userQuery = message.trim();
  if (markAllocation) {
    userQuery += `\n\n[Please format and size this answer for a ${markAllocation}-MARK college exam question.]`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: userQuery }],
  });

  try {
    const result = await callGeminiWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      preferredModel: 'gemini-3.6-flash',
    });

    return {
      reply: result.text,
      usedGemini: true,
      model: result.modelUsed,
    };
  } catch (err: any) {
    console.error('[askAITutor] Failed across all candidate models:', err);
    throw new Error(
      'The AI Tutor is currently experiencing high network demand. Please re-send your question or try again in a few seconds.'
    );
  }
}

export async function generateStudyPlanAI(params: {
  subjects: { name: string; examDate?: string; difficulty?: string; topics?: string[] }[];
  dailyHours: number;
  goal: string;
  weakTopics?: string[];
}): Promise<{ tasks: any[]; scheduleSummary: string }> {
  const prompt = `You are StudyMate's AI Academic Planner.
Generate a structured, actionable weekly study plan tailored to an engineering college student.
Subjects: ${JSON.stringify(params.subjects)}
Daily Available Study Hours: ${params.dailyHours} hours
Primary Goal: ${params.goal}
Known Weak Topics: ${params.weakTopics?.join(', ') || 'None reported'}

Return ONLY a valid JSON object matching this schema:
{
  "scheduleSummary": "Short 2-sentence strategy summary explaining the prioritization.",
  "tasks": [
    {
      "subjectName": "Exact subject name",
      "title": "Actionable task title",
      "topic": "Specific topic",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "difficulty": "Easy|Medium|Hard",
      "priority": "Low|Medium|High",
      "estimatedMinutes": 45
    }
  ]
}
Generate between 4 and 8 focused study sessions for today and tomorrow.`;

  try {
    const result = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
      preferredModel: 'gemini-3.1-flash-lite',
    });

    const parsed = JSON.parse(result.text);
    if (parsed && Array.isArray(parsed.tasks)) {
      return parsed;
    }
  } catch (err) {
    console.warn('AI study plan generation failed with primary schema parse:', err);
  }

  // Dynamic fallback calculation based on student subjects
  const generatedTasks: any[] = [];
  const times = [
    { start: '17:00', end: '17:45', mins: 45 },
    { start: '18:00', end: '18:50', mins: 50 },
    { start: '19:30', end: '20:15', mins: 45 },
    { start: '20:30', end: '21:15', mins: 45 },
  ];

  params.subjects.forEach((subj, idx) => {
    const timeSlot = times[idx % times.length];
    const topic = subj.topics && subj.topics.length > 0 ? subj.topics[0] : `${subj.name} Core Fundamentals`;
    generatedTasks.push({
      subjectName: subj.name,
      title: `Deep-dive & problem-solving: ${topic}`,
      topic: topic,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      difficulty: subj.difficulty || 'Medium',
      priority: idx === 0 ? 'High' : 'Medium',
      estimatedMinutes: timeSlot.mins,
    });
  });

  return {
    scheduleSummary: `Targeted ${params.dailyHours}-hour active study block focused on ${params.subjects[0]?.name || 'core subjects'} with deliberate intervals for retention and practice.`,
    tasks: generatedTasks,
  };
}

export async function generateQuizAI(params: {
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  count: number;
}): Promise<{ questions: any[] }> {
  const prompt = `You are StudyMate AI Exam Engineer.
Generate a high-quality college-level multiple-choice quiz.
Subject: ${params.subject}
Topic: ${params.topic}
Difficulty: ${params.difficulty}
Number of Questions: ${params.count}

Respond ONLY with valid JSON in this exact structure:
{
  "questions": [
    {
      "question": "Clear problem or concept question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Detailed explanation of why this answer is correct and why common alternatives are incorrect.",
      "topic": "${params.topic}"
    }
  ]
}`;

  try {
    const result = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
      preferredModel: 'gemini-3.1-flash-lite',
    });

    const parsed = JSON.parse(result.text);
    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('AI quiz generation failed with primary schema parse:', err);
  }

  // Dynamic fallback question generator if JSON parse fails
  return {
    questions: [
      {
        question: `In ${params.topic || params.subject}, what is a foundational principle to optimize performance?`,
        options: [
          'Minimizing asymptotic time complexity through spatial trade-offs or memoization',
          'Executing all subtasks synchronously in a single blocking thread',
          'Ignoring cache locality and memory hierarchy',
          'Using exponential recursion without base cases',
        ],
        correctOptionIndex: 0,
        explanation:
          'In computer science and engineering, optimization frequently balances time complexity with auxiliary memory or hashing tables.',
        topic: params.topic || params.subject,
      },
      {
        question: `Which of the following describes the behavior of ${params.topic || params.subject} under worst-case inputs?`,
        options: [
          'Guaranteed linear-time convergence regardless of data distribution',
          'Degradation towards upper-bound asymptotic complexity requiring mitigation strategies',
          'Zero resource consumption',
          'Automatic hardware vectorization',
        ],
        correctOptionIndex: 1,
        explanation:
          'Worst-case analysis ensures that systems are engineered to tolerate edge cases without latency spikes.',
        topic: params.topic || params.subject,
      },
    ].slice(0, params.count),
  };
}

export async function explainNoteAI(
  content: string,
  action: 'simplify' | 'summarize' | 'exam_tips'
): Promise<string> {
  let instruction = 'Explain this note simply with key takeaways.';
  if (action === 'simplify') {
    instruction = 'Simplify this technical note using clear analogies, intuitive language, and bullet points for a student.';
  } else if (action === 'summarize') {
    instruction = 'Create a high-yield executive revision summary of this note with flashcard-ready bullet points.';
  } else if (action === 'exam_tips') {
    instruction = 'Identify potential university exam questions from this note, expected mark distributions, and scoring keywords.';
  }

  const prompt = `${STUDYMATE_SYSTEM_PROMPT}

Task: ${instruction}

Note Content:
${content}

Provide a brilliant, beautifully structured Markdown explanation:`;

  const result = await callGeminiWithFallback({
    contents: prompt,
    preferredModel: 'gemini-3.1-flash-lite',
  });

  return result.text;
}


export async function analyzeNotesAI(content: string, filename: string): Promise<string> {
  const prompt = `${STUDYMATE_SYSTEM_PROMPT}

You are now acting as StudyMate's Note Analyzer.

Analyze the uploaded academic notes below and create a study-friendly learning guide.

IMPORTANT RULES:
- Treat the uploaded notes as the primary source.
- Preserve important terminology, formulas, definitions, examples, and organization from the notes.
- Do not invent facts and present them as if they came from the notes.
- If you add a helpful explanation that is not explicitly present in the notes, clearly label it as "Additional explanation".
- Prioritize concepts that are likely to matter for exams and understanding.
- If the notes are incomplete, say so rather than pretending they contain missing information.
- Use clear language suitable for a college engineering student.

Uploaded file: ${filename}

NOTES CONTENT:
${content}

Return a detailed Markdown study guide with exactly these major sections:

# 📚 Notes Overview
Briefly explain what the uploaded notes cover.

# ⭐ Most Important Topics
Rank the most important topics from highest priority to lowest priority. Give a short reason for each.

# 🧠 Detailed Topic Explanations
For every important topic, explain it step by step. Start with intuition, then give the technical explanation, and include examples when the notes support them.

# 🔑 Key Definitions & Concepts
List important definitions and concepts in exam-friendly language.

# 📐 Formulas / Rules / Algorithms
Extract formulas, rules, procedures, algorithms, or important relationships that appear in the notes. Explain the variables or steps when possible.

# 💡 Examples
Collect examples from the notes and explain what each example demonstrates. Clearly mark any additional example you create yourself.

# 📝 Expected Exam Questions
Create likely questions based ONLY on the uploaded material. Group them into:
- 2-mark questions
- 4/5-mark questions
- 8/10-mark questions
- Long-answer questions
For each, include the key points a student should write.

# ⚡ Quick Revision Sheet
Give a compact last-minute revision list of the most important facts.

# 🧠 Memory Tricks
Create simple mnemonics, associations, or memory tricks for difficult items where useful.

# 🎯 What To Study First
Finish with a practical priority order for studying this material.

Make the response detailed but organized. Use tables where they genuinely improve clarity.`;

  const result = await callGeminiWithFallback({
    contents: prompt,
    preferredModel: 'gemini-3.6-flash',
  });

  return result.text;
}


// ============================================================
// ANY ENGINEERING SUBJECT EXPLORER
// ============================================================

export async function exploreSubjectAI(subject: string): Promise<{
  subject: string;
  overview: string;
  topics: {
    name: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    searchQuery: string;
  }[];
}> {

  const prompt = `
You are the StudyMate engineering education planner.

The student searched for:

"${subject}"

The subject can belong to ANY engineering branch or specialization.

Examples include:
CSE, AI, ML, Data Science, DSA, DBMS, Operating Systems,
Computer Networks, Compiler Design,
ECE, Digital Electronics, Analog Electronics, VLSI,
Microprocessors, Embedded Systems, Communication Systems,
EEE, Electrical Machines, Power Systems, Control Systems,
Power Electronics,
Mechanical Engineering, Thermodynamics, Fluid Mechanics,
Engineering Mechanics, Machine Design, Heat Transfer,
Civil Engineering, Structural Engineering, Surveying,
Geotechnical Engineering, Transportation Engineering,
Concrete Technology, Hydraulics,
Chemical Engineering, Mass Transfer, Heat Transfer,
Chemical Reaction Engineering, Process Control,
Aerospace Engineering, Robotics, IoT, Biomedical Engineering,
Renewable Energy, Mechatronics, Automobile Engineering,
Nanotechnology, Blockchain and other engineering subjects.

Create a learning roadmap specifically for the subject entered by the student.

Return ONLY valid JSON.

Required format:

{
  "subject": "subject name",
  "overview": "short student-friendly overview",
  "topics": [
    {
      "name": "topic name",
      "description": "clear explanation of what the student should learn",
      "difficulty": "Beginner",
      "searchQuery": "specific YouTube search query"
    }
  ]
}

Rules:

1. Generate between 6 and 10 important topics.
2. Arrange topics from fundamentals to advanced concepts.
3. Make the roadmap useful for an engineering student.
4. Use simple but technically correct descriptions.
5. Each searchQuery must be useful for finding educational YouTube videos.
6. NEVER create YouTube URLs.
7. NEVER create YouTube video IDs.
8. NEVER invent video links.
9. Do not use Markdown.
10. Return JSON only.
11. If the user searches for a branch such as ECE, create a useful branch-level roadmap.
12. If the user searches for a specific subject such as VLSI, focus specifically on VLSI.
13. If the user searches for a topic such as MOSFET, focus specifically on MOSFET.
14. Do not add unrelated subjects.
`;

  const raw = await callGeminiWithFallback({
    contents: prompt,
    preferredModel: 'gemini-2.5-flash-lite'
  });

  try {

    let cleaned = raw.text.trim();

    // Remove Markdown code fences if Gemini accidentally adds them.
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.topics)
    ) {
      throw new Error('Invalid Gemini subject roadmap');
    }

    const topics = parsed.topics
      .filter((topic: any) =>
        topic &&
        typeof topic.name === 'string' &&
        typeof topic.description === 'string'
      )
      .slice(0, 10)
      .map((topic: any) => {

        let difficulty:
          | 'Beginner'
          | 'Intermediate'
          | 'Advanced' = 'Beginner';

        if (topic.difficulty === 'Intermediate') {
          difficulty = 'Intermediate';
        }

        if (topic.difficulty === 'Advanced') {
          difficulty = 'Advanced';
        }

        return {
          name: topic.name.trim(),

          description: topic.description.trim(),

          difficulty,

          searchQuery:
            typeof topic.searchQuery === 'string' &&
            topic.searchQuery.trim()
              ? topic.searchQuery.trim()
              : `${subject} ${topic.name} engineering tutorial`
        };
      });

    return {
      subject:
        typeof parsed.subject === 'string' && parsed.subject.trim()
          ? parsed.subject.trim()
          : subject,

      overview:
        typeof parsed.overview === 'string' && parsed.overview.trim()
          ? parsed.overview.trim()
          : `A structured learning roadmap for ${subject}.`,

      topics
    };

  } catch (error) {

    console.error(
      '❌ Subject Explorer Gemini JSON parsing failed:',
      error
    );

    // Safe fallback.
    return {
      subject,

      overview:
        `A structured learning roadmap for ${subject}, ` +
        `covering fundamentals, core concepts, applications and advanced topics.`,

      topics: [
        {
          name: `${subject} Fundamentals`,
          description:
            `Learn the basic concepts, terminology and principles of ${subject}.`,
          difficulty: 'Beginner',
          searchQuery:
            `${subject} fundamentals engineering tutorial`
        },

        {
          name: `${subject} Core Concepts`,
          description:
            `Study the major concepts and methods used in ${subject}.`,
          difficulty: 'Beginner',
          searchQuery:
            `${subject} core concepts engineering tutorial`
        },

        {
          name: `${subject} Problem Solving`,
          description:
            `Practice important engineering problems and applications related to ${subject}.`,
          difficulty: 'Intermediate',
          searchQuery:
            `${subject} problems solved engineering tutorial`
        },

        {
          name: `${subject} Applications`,
          description:
            `Understand how ${subject} is applied in real engineering systems.`,
          difficulty: 'Intermediate',
          searchQuery:
            `${subject} applications engineering tutorial`
        },

        {
          name: `${subject} Advanced Topics`,
          description:
            `Explore advanced concepts and techniques used in ${subject}.`,
          difficulty: 'Advanced',
          searchQuery:
            `${subject} advanced engineering tutorial`
        }
      ]
    };
  }
}
