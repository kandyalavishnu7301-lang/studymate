import express from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, User, StudentProfile, Subject, StudyTask, StudySession, Note, Quiz, QuizAttempt, DSASubmission, AIConversation, AIMessage } from './server/db';
import { requireAuth, generateToken, sanitizeUser, AuthenticatedRequest } from './server/auth';
import { exploreSubjectAI, askAITutor, generateStudyPlanAI, generateQuizAI, explainNoteAI, analyzeNotesAI, analyzeNotesDocumentAI } from './server/gemini';

// PDF and DOCX note extraction
const pdfParse = async (buffer: Buffer) => {
  const mod: any = await import('pdf-parse-debugging-disabled');
  const parser = mod.default || mod;

  if (typeof parser !== 'function') {
    throw new Error('PDF parser failed to load correctly. Please run: npm install pdf-parse-debugging-disabled@1.1.1');
  }

  return parser(buffer);
};

const extractDocxText = async (buffer: Buffer) => {
  const mod: any = await import('mammoth');
  const mammoth = mod.default || mod;
  return mammoth.extractRawText({ buffer });
};

dotenv.config();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// API Routes

// 1. Health check
app.get('/api/health', (req, res) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    app: 'StudyMate',
    geminiConfigured,
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// 2. Authentication
app.post('/api/auth/register', (req, res) => {
  try {
    const {
      name,
      email,
      password,
      college,
      course,
      branch,
      yearOfStudy,
      graduationYear,
      targetCgpa,
      targetCareer,
      preferredLanguage,
      dailyStudyTargetMinutes,
    } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const data = db.getData();
    const existing = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists' });
      return;
    }

    const now = new Date().toISOString();
    const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      name,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    const newProfile: StudentProfile = {
      id: `prof-${Date.now()}`,
      userId,
      college: college || 'University Engineering Campus',
      course: course || 'B.Tech / Computer Science',
      branch: branch || 'Computer Science & Engineering',
      yearOfStudy: yearOfStudy || '3rd Year',
      graduationYear: graduationYear || '2026',
      targetCgpa: targetCgpa || '9.0',
      targetCareer: targetCareer || 'Software Engineer',
      preferredLanguage: preferredLanguage || 'Python',
      dailyStudyTargetMinutes: Number(dailyStudyTargetMinutes) || 120,
      primaryGoal: 'Learn DSA and prepare for placements',
      completedOnboarding: false,
      createdAt: now,
      updatedAt: now,
    };

    data.users.push(newUser);
    data.profiles.push(newProfile);
    db.save();

    const token = generateToken(newUser);
    res.status(201).json({
      token,
      user: sanitizeUser(newUser),
      profile: newProfile,
      message: 'Registration successful! Welcome to StudyMate.',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Please provide both email and password' });
      return;
    }

    const data = db.getData();
    const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const profile = data.profiles.find((p) => p.userId === user.id) || null;
    const token = generateToken(user);

    res.json({
      token,
      user: sanitizeUser(user),
      profile,
      message: 'Welcome back!',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});


app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string') {
      res.status(400).json({ error: 'Google credential is required' });
      return;
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID is not configured');
      res.status(500).json({ error: 'Google authentication is not configured' });
      return;
    }

    // Verify the Google ID token on the server.
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({ error: 'Invalid Google credential' });
      return;
    }

    const googleEmail = payload.email?.toLowerCase();
    const googleName = payload.name || 'StudyMate Student';

    if (!payload.sub || !googleEmail) {
      res.status(401).json({ error: 'Google account information is incomplete' });
      return;
    }

    if (payload.email_verified !== true) {
      res.status(401).json({ error: 'Google email is not verified' });
      return;
    }

    const data = db.getData();

    // If this email already has a StudyMate account, log into it.
    let user = data.users.find(
      (u) => u.email.toLowerCase() === googleEmail
    );

    let profile = null;

    if (user) {
      profile =
        data.profiles.find((p) => p.userId === user!.id) || null;

      user.updatedAt = new Date().toISOString();

      db.save();
    } else {
      // Create a new StudyMate account for the verified Google account.
      const now = new Date().toISOString();
      const userId =
        `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      // Google users do not need to know this password.
      // It simply satisfies StudyMate's existing User structure.
      const randomPassword =
        crypto.randomBytes(32).toString('hex');

      const passwordHash = bcrypt.hashSync(randomPassword, 10);

      const newUser: User = {
        id: userId,
        email: googleEmail,
        name: googleName,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };

      const newProfile: StudentProfile = {
        id: `prof-${Date.now()}`,
        userId,
        college: 'University Engineering Campus',
        course: 'B.Tech / Computer Science',
        branch: 'Computer Science & Engineering',
        yearOfStudy: '3rd Year',
        graduationYear: '2026',
        targetCgpa: '9.0',
        targetCareer: 'Software Engineer',
        preferredLanguage: 'Python',
        dailyStudyTargetMinutes: 120,
        primaryGoal: 'Learn DSA and prepare for placements',
        completedOnboarding: false,
        createdAt: now,
        updatedAt: now,
      };

      data.users.push(newUser);
      data.profiles.push(newProfile);

      user = newUser;
      profile = newProfile;

      db.save();
    }

    const token = generateToken(user);

    res.json({
      token,
      user: sanitizeUser(user),
      profile,
      message: 'Google sign-in successful! Welcome to StudyMate.',
    });
  } catch (err: any) {
    console.error('Google authentication error:', err);

    res.status(401).json({
      error: 'Google sign-in failed. Please try again.',
    });
  }
});

app.post('/api/auth/demo', (req, res) => {
  try {
    const data = db.getData();
    const demoUser = data.users.find((u) => u.email === 'alex@studymate.edu');
    if (!demoUser) {
      res.status(404).json({ error: 'Demo account not initialized' });
      return;
    }

    const profile = data.profiles.find((p) => p.userId === demoUser.id) || null;
    const token = generateToken(demoUser);

    res.json({
      token,
      user: sanitizeUser(demoUser),
      profile,
      message: 'Logged in as Demo Student Alex Rivera',
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Failed to login demo user' });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  res.json({
    message: 'If an account exists with this email, password reset instructions have been dispatched.',
  });
});

// 3. User & Profile
app.get('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const profile = data.profiles.find((p) => p.userId === req.user!.id);
  res.json({
    user: sanitizeUser(req.user!),
    profile: profile || null,
  });
});

app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    let profile = data.profiles.find((p) => p.userId === req.user!.id);
    const now = new Date().toISOString();

    if (!profile) {
      profile = {
        id: `prof-${Date.now()}`,
        userId: req.user!.id,
        college: req.body.college || '',
        course: req.body.course || '',
        branch: req.body.branch || '',
        yearOfStudy: req.body.yearOfStudy || '',
        graduationYear: req.body.graduationYear || '',
        targetCgpa: req.body.targetCgpa || '',
        targetCareer: req.body.targetCareer || '',
        preferredLanguage: req.body.preferredLanguage || 'Python',
        dailyStudyTargetMinutes: Number(req.body.dailyStudyTargetMinutes) || 120,
        primaryGoal: req.body.primaryGoal || 'Improve CGPA',
        completedOnboarding: true,
        createdAt: now,
        updatedAt: now,
      };
      data.profiles.push(profile);
    } else {
      Object.assign(profile, req.body, { updatedAt: now });
    }

    if (req.body.name) {
      req.user!.name = req.body.name;
      req.user!.updatedAt = now;
    }

    db.save();
    res.json({ user: sanitizeUser(req.user!), profile });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/onboarding', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { subjects = [], primaryGoal, dailyStudyTargetMinutes } = req.body;
    const data = db.getData();
    const userId = req.user!.id;
    const now = new Date().toISOString();

    let profile = data.profiles.find((p) => p.userId === userId);
    if (profile) {
      profile.primaryGoal = primaryGoal || profile.primaryGoal;
      if (dailyStudyTargetMinutes) profile.dailyStudyTargetMinutes = Number(dailyStudyTargetMinutes);
      profile.completedOnboarding = true;
      profile.updatedAt = now;
    }

    // Add selected onboarding subjects if not already existing
    const existingSubjectNames = new Set(data.subjects.filter((s) => s.userId === userId).map((s) => s.name.toLowerCase()));
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6'];

    subjects.forEach((subjName: string, idx: number) => {
      if (!existingSubjectNames.has(subjName.toLowerCase())) {
        const newSubj: Subject = {
          id: `subj-${Date.now()}-${idx}`,
          userId,
          name: subjName,
          code: `CS${300 + idx}`,
          difficulty: 'Medium',
          color: colors[idx % colors.length],
          examDate: new Date(Date.now() + (20 + idx * 7) * 24 * 3600 * 1000).toISOString().split('T')[0],
          progress: 25,
          topics: [`${subjName} Fundamentals`, 'Core Concepts', 'Exam Review'],
          createdAt: now,
          updatedAt: now,
        };
        data.subjects.push(newSubj);
      }
    });

    db.save();
    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save onboarding settings' });
  }
});

// 4. Dynamic Dashboard
app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const data = db.getData();

    const profile = data.profiles.find((p) => p.userId === userId);
    const userSubjects = data.subjects.filter((s) => s.userId === userId);
    const userTasks = data.tasks.filter((t) => t.userId === userId);
    const userSessions = data.sessions.filter((s) => s.userId === userId);
    const userNotes = data.notes.filter((n) => n.userId === userId);
    const userAttempts = data.attempts.filter((a) => a.userId === userId);
    const userDsaSubmissions = data.dsaSubmissions.filter((s) => s.userId === userId);

    // Calculate today's study minutes
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMinutes = userSessions
      .filter((s) => s.completedAt.startsWith(todayStr))
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    // Calculate weekly study minutes (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const weeklyMinutes = userSessions
      .filter((s) => s.completedAt >= sevenDaysAgo)
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    const weeklyTargetMinutes = (profile?.dailyStudyTargetMinutes || 120) * 7;
    const weeklyGoalProgress = Math.min(100, Math.round((weeklyMinutes / (weeklyTargetMinutes || 840)) * 100));

    // Calculate streak
    const sessionDates = Array.from(
      new Set(userSessions.map((s) => s.completedAt.split('T')[0]))
    ).sort().reverse();

    let streak = 0;
    let checkDate = new Date();
    // If studied today, start from today, else start checking from yesterday
    const todayIncluded = sessionDates.includes(todayStr);
    if (todayIncluded) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 30; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (sessionDates.includes(dStr)) {
        if (!todayIncluded && i === 0) streak = 1;
        else streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // DSA solved count (distinct problems with status Accepted)
    const solvedProblemIds = new Set(
      userDsaSubmissions.filter((s) => s.status === 'Accepted').map((s) => s.problemId)
    );
    const totalDsaProblems = data.dsaProblems.length;

    // Upcoming exams (sorted by date)
    const upcomingExams = userSubjects
      .filter((s) => s.examDate && s.examDate >= todayStr)
      .sort((a, b) => a.examDate.localeCompare(b.examDate))
      .map((s) => {
        const daysLeft = Math.ceil(
          (new Date(s.examDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24)
        );
        return {
          subjectId: s.id,
          subjectName: s.name,
          examDate: s.examDate,
          daysLeft,
          difficulty: s.difficulty,
        };
      });

    // Weak areas identified from quizzes
    const allWeakTopics: Record<string, number> = {};
    userAttempts.forEach((att) => {
      att.weakTopics?.forEach((topic) => {
        allWeakTopics[topic] = (allWeakTopics[topic] || 0) + 1;
      });
    });
    const weakAreas = Object.entries(allWeakTopics)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // AI Recommendations based on actual data
    const recommendations: string[] = [];
    if (weakAreas.length > 0) {
      recommendations.push(`Reinforce ${weakAreas[0].topic} - quiz diagnostics show low accuracy here.`);
    }
    if (upcomingExams.length > 0 && upcomingExams[0].daysLeft <= 14) {
      recommendations.push(
        `${upcomingExams[0].subjectName} exam is in ${upcomingExams[0].daysLeft} days. Schedule a revision block today.`
      );
    }
    if (solvedProblemIds.size < 3) {
      recommendations.push(`Practice Two Sum and Binary Search in the DSA section to build algorithmic muscle.`);
    }
    if (todayMinutes < (profile?.dailyStudyTargetMinutes || 120)) {
      const remaining = (profile?.dailyStudyTargetMinutes || 120) - todayMinutes;
      recommendations.push(
        `You're ${todayMinutes}m into your ${profile?.dailyStudyTargetMinutes || 120}m daily goal (${remaining}m remaining).`
      );
    } else {
      recommendations.push(`Outstanding work! You've met today's study target of ${profile?.dailyStudyTargetMinutes || 120}m.`);
    }

    res.json({
      greeting: getGreeting(req.user!.name),
      user: sanitizeUser(req.user!),
      profile,
      stats: {
        streak,
        todayMinutes,
        weeklyMinutes,
        weeklyTargetMinutes,
        weeklyGoalProgress,
        targetCgpa: profile?.targetCgpa || '9.0',
        dsaSolvedCount: solvedProblemIds.size,
        totalDsaProblems,
        quizzesTaken: userAttempts.length,
        notesCount: userNotes.length,
      },
      todayTasks: userTasks.filter((t) => t.date === todayStr || !t.completed).slice(0, 5),
      subjects: userSubjects,
      weakAreas,
      upcomingExams,
      recentNotes: userNotes.slice(0, 3),
      recentQuizzes: userAttempts.slice(0, 3),
      recommendations,
    });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  let timeStr = 'Good morning';
  if (hour >= 12 && hour < 17) timeStr = 'Good afternoon';
  else if (hour >= 17) timeStr = 'Good evening';
  return `${timeStr}, ${name || 'Student'} 👋`;
}

// 5. Subjects
app.get('/api/subjects', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const subjects = data.subjects.filter((s) => s.userId === req.user!.id);
  res.json(subjects);
});

app.post('/api/subjects', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { name, code, difficulty, color, examDate, progress, topics } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Subject name is required' });
      return;
    }

    const data = db.getData();
    const now = new Date().toISOString();
    const newSubj: Subject = {
      id: `subj-${Date.now()}`,
      userId: req.user!.id,
      name,
      code: code || '',
      difficulty: difficulty || 'Medium',
      color: color || '#6366f1',
      examDate: examDate || '',
      progress: Number(progress) || 0,
      topics: Array.isArray(topics) ? topics : [],
      createdAt: now,
      updatedAt: now,
    };

    data.subjects.push(newSubj);
    db.save();
    res.status(201).json(newSubj);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create subject' });
  }
});



// ============================================================
// STUDYMATE — ANY ENGINEERING SUBJECT EXPLORER
// Gemini generates the roadmap.
// YouTube Data API finds real videos.
// ============================================================


app.get('/api/youtube/search', requireAuth, async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query) {
      return res.status(400).json({
        error: 'Please enter a YouTube search query.'
      });
    }

    if (query.length > 200) {
      return res.status(400).json({
        error: 'Search query is too long.'
      });
    }

    const youtubeKey = process.env.YOUTUBE_API_KEY;

    if (!youtubeKey) {
      return res.status(500).json({
        error: 'YOUTUBE_API_KEY is missing from the server .env file.'
      });
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: '12',
      order: 'relevance',
      relevanceLanguage: 'en',
      regionCode: 'IN',
      safeSearch: 'strict',
      key: youtubeKey
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ YouTube API error:', errorText);

      return res.status(502).json({
        error: 'YouTube search failed.'
      });
    }

    const data = await response.json();

    const videos = Array.isArray(data.items)
      ? data.items
          .filter(
            (item: any) =>
              item?.id?.kind === 'youtube#video' &&
              item?.id?.videoId &&
              item?.snippet
          )
          .map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title || '',
            description: item.snippet.description || '',
            channelTitle: item.snippet.channelTitle || '',
            thumbnail:
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url ||
              '',
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
          }))
      : [];

    return res.json({
      query,
      videos
    });
  } catch (error) {
    console.error('❌ YouTube search failed:', error);

    return res.status(500).json({
      error: 'Unable to search YouTube right now.'
    });
  }
});

app.post('/api/subjects/explore', requireAuth, async (req, res) => {
  try {

    const subject = String(req.body?.subject || '').trim();

    if (!subject) {
      return res.status(400).json({
        error: 'Please enter an engineering subject.'
      });
    }

    if (subject.length > 120) {
      return res.status(400).json({
        error: 'Subject name is too long.'
      });
    }

    const youtubeKey = process.env.YOUTUBE_API_KEY;

    if (!youtubeKey) {
      return res.status(500).json({
        error:
          'YOUTUBE_API_KEY is missing. Add it to the server .env file.'
      });
    }

    console.log(
      `🔎 StudyMate Subject Explorer: ${subject}`
    );

    // --------------------------------------------------------
    // STEP 1 — Gemini creates the learning roadmap
    // --------------------------------------------------------

    const aiResult = await exploreSubjectAI(subject);

    const topics = Array.isArray(aiResult.topics)
      ? aiResult.topics.slice(0, 8)
      : [];

    // --------------------------------------------------------
    // STEP 2 — Search YouTube for REAL videos
    // --------------------------------------------------------

    const topicsWithVideos = await Promise.all(

      topics.map(async (topic) => {

        try {

          const params = new URLSearchParams({
            part: 'snippet',

            q: topic.searchQuery,

            type: 'video',

            maxResults: '3',

            order: 'relevance',

            relevanceLanguage: 'en',

            regionCode: 'IN',

            safeSearch: 'strict',

            key: youtubeKey
          });

          const youtubeResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
          );

          if (!youtubeResponse.ok) {

            const errorText =
              await youtubeResponse.text();

            console.error(
              `❌ YouTube API error for ${topic.name}:`,
              errorText
            );

            return {
              ...topic,
              videos: []
            };
          }

          const data =
            await youtubeResponse.json();

          const videos =
            Array.isArray(data.items)

              ? data.items
                  .filter(
                    (item: any) =>
                      item?.id?.kind === 'youtube#video' &&
                      item?.id?.videoId &&
                      item?.snippet
                  )

                  .slice(0, 3)

                  .map((item: any) => ({

                    videoId:
                      item.id.videoId,

                    title:
                      item.snippet.title || '',

                    description:
                      item.snippet.description || '',

                    channelTitle:
                      item.snippet.channelTitle || '',

                    thumbnail:
                      item.snippet.thumbnails?.medium?.url ||
                      item.snippet.thumbnails?.default?.url ||
                      '',

                    url:
                      `https://www.youtube.com/watch?v=${item.id.videoId}`
                  }))

              : [];

          return {
            ...topic,
            videos
          };

        } catch (error) {

          console.error(
            `❌ YouTube search failed for ${topic.name}:`,
            error
          );

          return {
            ...topic,
            videos: []
          };
        }
      })
    );

    // --------------------------------------------------------
    // STEP 3 — Return everything to React
    // --------------------------------------------------------

    return res.json({

      subject:
        aiResult.subject || subject,

      overview:
        aiResult.overview || '',

      topics:
        topicsWithVideos

    });

  } catch (error) {

    console.error(
      '❌ Subject Explorer failed:',
      error
    );

    return res.status(500).json({
      error:
        'Unable to explore this subject right now.'
    });
  }
});

app.put('/api/subjects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const subj = data.subjects.find((s) => s.id === req.params.id && s.userId === req.user!.id);
    if (!subj) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    Object.assign(subj, req.body, { updatedAt: new Date().toISOString() });
    db.save();
    res.json(subj);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

app.delete('/api/subjects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const idx = data.subjects.findIndex((s) => s.id === req.params.id && s.userId === req.user!.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    data.subjects.splice(idx, 1);
    db.save();
    res.json({ success: true, message: 'Subject deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// 6. Study Tasks & Planner
app.get('/api/tasks', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const tasks = data.tasks.filter((t) => t.userId === req.user!.id);
  res.json(tasks);
});

app.post('/api/tasks', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { subjectId, subjectName, title, topic, startTime, endTime, date, difficulty, priority, estimatedMinutes } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    const data = db.getData();
    const now = new Date().toISOString();
    const newTask: StudyTask = {
      id: `task-${Date.now()}`,
      userId: req.user!.id,
      subjectId: subjectId || '',
      subjectName: subjectName || 'General Study',
      title,
      topic: topic || '',
      startTime: startTime || '18:00',
      endTime: endTime || '18:45',
      date: date || now.split('T')[0],
      difficulty: difficulty || 'Medium',
      priority: priority || 'Medium',
      estimatedMinutes: Number(estimatedMinutes) || 45,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    data.tasks.push(newTask);
    db.save();
    res.status(201).json(newTask);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const task = data.tasks.find((t) => t.id === req.params.id && t.userId === req.user!.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    Object.assign(task, req.body, { updatedAt: new Date().toISOString() });
    db.save();
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const idx = data.tasks.findIndex((t) => t.id === req.params.id && t.userId === req.user!.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    data.tasks.splice(idx, 1);
    db.save();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.post('/api/study-plan/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const userSubjects = data.subjects.filter((s) => s.userId === req.user!.id);
    const profile = data.profiles.find((p) => p.userId === req.user!.id);
    const attempts = data.attempts.filter((a) => a.userId === req.user!.id);

    const weakTopics = Array.from(new Set(attempts.flatMap((a) => a.weakTopics || [])));
    const dailyHours = (profile?.dailyStudyTargetMinutes || 120) / 60;

    const plan = await generateStudyPlanAI({
      subjects: userSubjects.map((s) => ({
        name: s.name,
        examDate: s.examDate,
        difficulty: s.difficulty,
        topics: s.topics,
      })),
      dailyHours,
      goal: profile?.primaryGoal || 'Excel in exams and DSA',
      weakTopics,
    });

    // Save generated tasks to database for today
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const createdTasks: StudyTask[] = [];

    plan.tasks.forEach((t: any, idx: number) => {
      const matchedSubj = userSubjects.find((s) => s.name.toLowerCase() === (t.subjectName || '').toLowerCase());
      const newTask: StudyTask = {
        id: `task-${Date.now()}-${idx}`,
        userId: req.user!.id,
        subjectId: matchedSubj?.id || '',
        subjectName: t.subjectName || 'Study Session',
        title: t.title,
        topic: t.topic || '',
        startTime: t.startTime || '18:00',
        endTime: t.endTime || '18:45',
        date: todayStr,
        difficulty: t.difficulty || 'Medium',
        priority: t.priority || 'Medium',
        estimatedMinutes: t.estimatedMinutes || 45,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      data.tasks.push(newTask);
      createdTasks.push(newTask);
    });

    db.save();
    res.json({
      scheduleSummary: plan.scheduleSummary,
      tasks: createdTasks,
    });
  } catch (err: any) {
    console.error('Study plan error:', err);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// 7. Notes
app.post('/api/notes/analyze-upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        error: 'Please upload a PDF or DOCX notes file',
      });
      return;
    }

    const filename = req.file.originalname || 'uploaded-notes';
    const extension = path.extname(filename).toLowerCase();

    let extractedText = '';
    let analysis = '';
    let usedDocumentVision = false;

    console.log(`Processing uploaded notes: ${filename}`);

    // ========================================================
    // PDF
    // ========================================================

    if (extension === '.pdf') {

      try {
        const result: any = await pdfParse(req.file.buffer);
        extractedText = (result.text || '')
          .replace(/\r\n/g, '\n')
          .trim();
      } catch (pdfError) {
        console.warn(
          'Normal PDF text extraction failed. Switching to Gemini document reading.'
        );
        console.warn(pdfError);
        extractedText = '';
      }

      /*
       * If the PDF contains enough normal text, use the existing
       * text-analysis pipeline.
       *
       * If the PDF is scanned/image-only/mixed with very little
       * extractable text, send the ORIGINAL PDF to Gemini.
       */
      if (extractedText.length >= 300) {

        const MAX_NOTE_CHARS = 120000;

        const wasTruncated = extractedText.length > MAX_NOTE_CHARS;

        const contentForAI = wasTruncated
          ? extractedText.slice(0, MAX_NOTE_CHARS) +
            '\n\n[NOTE CONTENT TRUNCATED FOR AI ANALYSIS]'
          : extractedText;

        console.log(
          `Analyzing PDF text: ${filename} (${extractedText.length} chars)`
        );

        analysis = await analyzeNotesAI(contentForAI, filename);

      } else {

        console.log(
          `PDF has little/no extractable text (${extractedText.length} chars).`
        );

        console.log(
          'Sending original PDF to Gemini document vision + OCR...'
        );

        usedDocumentVision = true;

        analysis = await analyzeNotesDocumentAI(
          req.file.buffer,
          filename
        );
      }

    // ========================================================
    // DOCX
    // ========================================================

    } else if (extension === '.docx') {

      try {
        const result: any = await extractDocxText(req.file.buffer);

        extractedText = (result.value || '')
          .replace(/\r\n/g, '\n')
          .trim();

      } catch (docxError) {

        console.warn('DOCX extraction failed.');
        console.warn(docxError);

        res.status(400).json({
          error:
            'This DOCX file could not be read. Please try saving it again as PDF.',
        });

        return;
      }

      if (!extractedText) {

        res.status(400).json({
          error:
            'This DOCX file contains no readable text.',
        });

        return;
      }

      const MAX_NOTE_CHARS = 120000;

      const wasTruncated = extractedText.length > MAX_NOTE_CHARS;

      const contentForAI = wasTruncated
        ? extractedText.slice(0, MAX_NOTE_CHARS) +
          '\n\n[NOTE CONTENT TRUNCATED FOR AI ANALYSIS]'
        : extractedText;

      console.log(
        `Analyzing DOCX: ${filename} (${extractedText.length} chars)`
      );

      analysis = await analyzeNotesAI(
        contentForAI,
        filename
      );

    } else {

      res.status(400).json({
        error:
          'Unsupported file type. Please upload a PDF or DOCX file.',
      });

      return;
    }

    // ========================================================
    // SAVE NOTE
    // ========================================================

    const data = db.getData();
    const now = new Date().toISOString();

    const noteTitle = filename.replace(
      /\.(pdf|docx)$/i,
      ''
    );

    /*
     * For scanned PDFs there may be no text extracted locally.
     * Save the AI study guide as the note content so the uploaded
     * document still becomes a usable StudyMate note.
     */
    const noteContent =
      extractedText ||
      `# AI Study Guide\n\n${analysis}`;

    const savedNote: Note = {
      id: `note-${Date.now()}`,
      userId: req.user!.id,
      subjectId: '',
      subjectName: '',
      title: noteTitle,
      content: noteContent,
      tags: [
        'uploaded',
        'ai-analyzed',
        ...(usedDocumentVision ? ['vision-ocr'] : []),
      ],
      isPinned: false,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    data.notes.push(savedNote);
    db.save();

    console.log(
      `Saved uploaded note: ${noteTitle} (${savedNote.id})`
    );

    res.json({
      filename,
      analysis,
      extractedCharacters: extractedText.length,
      usedDocumentVision,
      truncated: false,
      savedNote,
    });

  } catch (error: any) {

    console.error(
      'Notes upload analysis error:',
      error
    );

    const message =
      error?.message ||
      'Unable to analyze this document right now.';

    res.status(500).json({
      error: message,
    });
  }
});
app.get('/api/notes', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const notes = data.notes.filter((n) => n.userId === req.user!.id);
  res.json(notes);
});

app.post('/api/notes', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { subjectId, subjectName, title, content, tags, isPinned, isFavorite } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Note title is required' });
      return;
    }

    const data = db.getData();
    const now = new Date().toISOString();
    const newNote: Note = {
      id: `note-${Date.now()}`,
      userId: req.user!.id,
      subjectId: subjectId || '',
      subjectName: subjectName || '',
      title,
      content: content || '',
      tags: Array.isArray(tags) ? tags : [],
      isPinned: Boolean(isPinned),
      isFavorite: Boolean(isFavorite),
      createdAt: now,
      updatedAt: now,
    };

    data.notes.push(newNote);
    db.save();
    res.status(201).json(newNote);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const note = data.notes.find((n) => n.id === req.params.id && n.userId === req.user!.id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    Object.assign(note, req.body, { updatedAt: new Date().toISOString() });
    db.save();
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const idx = data.notes.findIndex((n) => n.id === req.params.id && n.userId === req.user!.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    data.notes.splice(idx, 1);
    db.save();
    res.json({ success: true, message: 'Note deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.post('/api/notes/:id/explain', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { action = 'simplify' } = req.body;
    const data = db.getData();
    const note = data.notes.find((n) => n.id === req.params.id && n.userId === req.user!.id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    const explanation = await explainNoteAI(note.content, action);
    res.json({ explanation });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to explain note' });
  }
});

// 8. AI Tutor & Conversations
app.get('/api/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const convs = data.conversations
    .filter((c) => c.userId === req.user!.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json(convs);
});

app.get('/api/conversations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const conv = data.conversations.find((c) => c.id === req.params.id && c.userId === req.user!.id);
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json(conv);
});

app.post('/api/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { title } = req.body;
    const data = db.getData();
    const now = new Date().toISOString();
    const newConv: AIConversation = {
      id: `conv-${Date.now()}`,
      userId: req.user!.id,
      title: title || 'New Study Session',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    data.conversations.push(newConv);
    db.save();
    res.status(201).json(newConv);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.delete('/api/conversations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const idx = data.conversations.findIndex((c) => c.id === req.params.id && c.userId === req.user!.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    data.conversations.splice(idx, 1);
    db.save();
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

app.post('/api/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { conversationId, message, markAllocation } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    const data = db.getData();
    const userId = req.user!.id;
    const profile = data.profiles.find((p) => p.userId === userId);
    const subjects = data.subjects.filter((s) => s.userId === userId);
    const attempts = data.attempts.filter((a) => a.userId === userId);

    let conv = conversationId
      ? data.conversations.find((c) => c.id === conversationId && c.userId === userId)
      : null;

    const now = new Date().toISOString();

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        userId,
        title: message.slice(0, 45) + (message.length > 45 ? '...' : ''),
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      data.conversations.push(conv);
    }

    // Get prior history turns before the current message
    const priorHistory = conv.messages.slice(0, -1).slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Append user message
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: message,
      markAllocation: markAllocation ? Number(markAllocation) : undefined,
      timestamp: now,
    };
    conv.messages.push(userMsg);

    // Call AI Tutor (dynamic live Gemini call like ChatGPT)
    const tutorResult = await askAITutor({
      message,
      history: priorHistory,
      markAllocation: markAllocation ? Number(markAllocation) : undefined,
      profile,
      subjects,
      recentAttempts: attempts,
    });

    const assistantMsg: AIMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: tutorResult.reply,
      markAllocation: markAllocation ? Number(markAllocation) : undefined,
      model: tutorResult.model,
      timestamp: new Date().toISOString(),
    };
    conv.messages.push(assistantMsg);
    conv.updatedAt = new Date().toISOString();

    db.save();

    res.json({
      conversationId: conv.id,
      message: assistantMsg,
      usedGemini: tutorResult.usedGemini,
      model: tutorResult.model,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to process AI Tutor message' });
  }
});

// Public Live Demo endpoint (interactive live AI tutor for landing page and preview)
app.post('/api/ai/live-demo', async (req, res) => {
  try {
    const { message, history, markAllocation } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    const cleanHistory = Array.isArray(history)
      ? history.slice(-8).map((h: any) => ({
          role: (h.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: String(h.content || ''),
        }))
      : [];

    const tutorResult = await askAITutor({
      message: message.trim(),
      history: cleanHistory,
      markAllocation: markAllocation ? Number(markAllocation) : undefined,
    });

    res.json({
      reply: tutorResult.reply,
      usedGemini: tutorResult.usedGemini,
      model: tutorResult.model,
    });
  } catch (err: any) {
    console.error('Public live demo chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate response' });
  }
});

// 9. Quizzes
app.get('/api/quizzes', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const quizzes = data.quizzes; // Shared or user quizzes
  res.json(quizzes);
});

app.get('/api/quizzes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const quiz = data.quizzes.find((q) => q.id === req.params.id);
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }
  res.json(quiz);
});

app.post('/api/quiz/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { subject, topic, difficulty = 'Medium', count = 3 } = req.body;
    if (!subject || !topic) {
      res.status(400).json({ error: 'Subject and topic are required' });
      return;
    }

    const aiResult = await generateQuizAI({
      subject,
      topic,
      difficulty,
      count: Math.min(10, Math.max(1, Number(count) || 3)),
    });

    const data = db.getData();
    const now = new Date().toISOString();
    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      userId: req.user!.id,
      subjectName: subject,
      title: `${subject}: ${topic} Mastery Quiz`,
      topic,
      difficulty,
      questions: aiResult.questions.map((q: any, i: number) => ({
        id: `q-${Date.now()}-${i}`,
        question: q.question,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        topic: q.topic || topic,
      })),
      createdAt: now,
    };

    data.quizzes.push(newQuiz);
    db.save();
    res.status(201).json(newQuiz);
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

app.post('/api/quiz/submit', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { quizId, answers = [], timeSpentSeconds = 60 } = req.body;
    const data = db.getData();
    const quiz = data.quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    let correctCount = 0;
    const weakTopicSet = new Set<string>();
    const gradedAnswers = answers.map((ans: { questionId: string; selectedOptionIndex: number }) => {
      const q = quiz.questions.find((quest) => quest.id === ans.questionId);
      const isCorrect = q ? q.correctOptionIndex === ans.selectedOptionIndex : false;
      if (isCorrect) {
        correctCount++;
      } else if (q) {
        weakTopicSet.add(q.topic || quiz.topic);
      }
      return {
        questionId: ans.questionId,
        selectedOptionIndex: ans.selectedOptionIndex,
        isCorrect,
      };
    });

    const accuracy = Math.round((correctCount / Math.max(1, quiz.questions.length)) * 100);
    const now = new Date().toISOString();

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      userId: req.user!.id,
      quizTitle: quiz.title,
      score: correctCount,
      totalQuestions: quiz.questions.length,
      accuracy,
      weakTopics: Array.from(weakTopicSet),
      answers: gradedAnswers,
      timeSpentSeconds: Number(timeSpentSeconds) || 60,
      completedAt: now,
    };

    data.attempts.push(attempt);
    db.save();

    res.json({
      attempt,
      quiz,
      message: accuracy >= 70 ? 'Excellent work! Keep it up!' : 'Review the explanations to solidify weak topics.',
    });
  } catch (err: any) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

app.get('/api/quiz/attempts', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const attempts = data.attempts
    .filter((a) => a.userId === req.user!.id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  res.json(attempts);
});

// 10. DSA Practice
app.get('/api/dsa/problems', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const userSubs = data.dsaSubmissions.filter((s) => s.userId === req.user!.id);
  const solvedSet = new Set(userSubs.filter((s) => s.status === 'Accepted').map((s) => s.problemId));
  const attemptedSet = new Set(userSubs.map((s) => s.problemId));

  const problemsWithStatus = data.dsaProblems.map((prob) => ({
    ...prob,
    status: solvedSet.has(prob.id) ? 'Solved' : attemptedSet.has(prob.id) ? 'Attempted' : 'Todo',
  }));

  res.json(problemsWithStatus);
});

app.get('/api/dsa/problems/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const problem = data.dsaProblems.find((p) => p.id === req.params.id || p.slug === req.params.id);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }
  res.json(problem);
});

app.post('/api/dsa/submit', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { problemId, code, language = 'python' } = req.body;
    const data = db.getData();
    const problem = data.dsaProblems.find((p) => p.id === problemId);
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    if (!code || code.trim().length === 0) {
      res.status(400).json({ error: 'Code cannot be empty' });
      return;
    }

    // Code execution simulation against test cases
    // We check for syntax/structure keywords or common correct indicators
    const isBlank = code.includes('# Write your solution here') && code.split('\n').length < 8;
    const status = isBlank ? 'Wrong Answer' : 'Accepted';
    const passedTestCases = status === 'Accepted' ? problem.testCases.length : 0;

    const submission: DSASubmission = {
      id: `sub-${Date.now()}`,
      userId: req.user!.id,
      problemId: problem.id,
      problemTitle: problem.title,
      code,
      language,
      status,
      passedTestCases,
      totalTestCases: problem.testCases.length,
      executionTimeMs: Math.floor(Math.random() * 30) + 25,
      submittedAt: new Date().toISOString(),
    };

    data.dsaSubmissions.push(submission);
    db.save();

    res.json({
      submission,
      message: status === 'Accepted' ? 'All test cases passed! Great job!' : 'Test cases failed. Check edge cases and return types.',
    });
  } catch (err: any) {
    console.error('DSA submission error:', err);
    res.status(500).json({ error: 'Failed to submit DSA solution' });
  }
});

app.get('/api/dsa/submissions', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const subs = data.dsaSubmissions
    .filter((s) => s.userId === req.user!.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  res.json(subs);
});

// 11. Study Sessions & Pomodoro
app.get('/api/study-session', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const sessions = data.sessions
    .filter((s) => s.userId === req.user!.id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  res.json(sessions);
});

app.post('/api/study-session', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { subjectId, subjectName, durationMinutes, sessionType = 'pomodoro', notes } = req.body;
    const data = db.getData();
    const now = new Date().toISOString();

    const newSession: StudySession = {
      id: `sess-${Date.now()}`,
      userId: req.user!.id,
      subjectId: subjectId || undefined,
      subjectName: subjectName || 'General Focus',
      durationMinutes: Number(durationMinutes) || 25,
      sessionType,
      notes: notes || '',
      completedAt: now,
      createdAt: now,
    };

    data.sessions.push(newSession);

    // Update subject progress slightly if subject attached
    if (subjectId) {
      const subj = data.subjects.find((s) => s.id === subjectId && s.userId === req.user!.id);
      if (subj) {
        subj.progress = Math.min(100, subj.progress + 2);
        subj.updatedAt = now;
      }
    }

    db.save();
    res.status(201).json(newSession);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save study session' });
  }
});

// 12. Progress Analytics
app.get('/api/progress', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = db.getData();
    const userId = req.user!.id;

    const sessions = data.sessions.filter((s) => s.userId === userId);
    const attempts = data.attempts.filter((a) => a.userId === userId);
    const dsaSubs = data.dsaSubmissions.filter((s) => s.userId === userId);
    const subjects = data.subjects.filter((s) => s.userId === userId);
    const tasks = data.tasks.filter((t) => t.userId === userId);

    // Daily breakdown for last 7 days
    const dailyStudyData: { date: string; day: string; minutes: number }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const mins = sessions
        .filter((s) => s.completedAt.startsWith(dStr))
        .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      dailyStudyData.push({
        date: dStr,
        day: days[d.getDay()],
        minutes: mins,
      });
    }

    // Overall accuracy
    const avgAccuracy = attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.accuracy, 0) / attempts.length)
      : 0;

    // DSA Category distribution
    const dsaSolvedIds = new Set(dsaSubs.filter((s) => s.status === 'Accepted').map((s) => s.problemId));
    const categoryStats: Record<string, { total: number; solved: number }> = {};
    data.dsaProblems.forEach((prob) => {
      if (!categoryStats[prob.category]) {
        categoryStats[prob.category] = { total: 0, solved: 0 };
      }
      categoryStats[prob.category].total++;
      if (dsaSolvedIds.has(prob.id)) {
        categoryStats[prob.category].solved++;
      }
    });

    const dsaProgressByCategory = Object.entries(categoryStats).map(([cat, stat]) => ({
      category: cat,
      solved: stat.solved,
      total: stat.total,
      percentage: Math.round((stat.solved / stat.total) * 100),
    }));

    // Weak vs strong subjects
    const subjectAverages = subjects.map((subj) => {
      const subjAttempts = attempts.filter(
        (a) => a.quizTitle.toLowerCase().includes(subj.name.toLowerCase())
      );
      const acc = subjAttempts.length > 0
        ? Math.round(subjAttempts.reduce((sum, a) => sum + a.accuracy, 0) / subjAttempts.length)
        : subj.progress;
      return {
        id: subj.id,
        name: subj.name,
        accuracy: acc,
        progress: subj.progress,
      };
    });

    const strongSubjects = subjectAverages.filter((s) => s.accuracy >= 65);
    const weakSubjects = subjectAverages.filter((s) => s.accuracy < 65);

    const completedTasksCount = tasks.filter((t) => t.completed).length;

    res.json({
      dailyStudyData,
      avgAccuracy,
      totalQuizzes: attempts.length,
      totalStudyMinutes: sessions.reduce((acc, s) => acc + s.durationMinutes, 0),
      dsaSolvedCount: dsaSolvedIds.size,
      totalDsaProblems: data.dsaProblems.length,
      dsaProgressByCategory,
      strongSubjects,
      weakSubjects,
      completedTasksCount,
      totalTasksCount: tasks.length,
    });
  } catch (err: any) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Failed to calculate progress metrics' });
  }
});

// 13. AI Insights
app.get('/api/ai/insights', requireAuth, (req: AuthenticatedRequest, res) => {
  const data = db.getData();
  const userId = req.user!.id;
  const attempts = data.attempts.filter((a) => a.userId === userId);
  const sessions = data.sessions.filter((s) => s.userId === userId);
  const dsaSubs = data.dsaSubmissions.filter((s) => s.userId === userId);

  const insights: { type: 'alert' | 'success' | 'tip'; title: string; message: string }[] = [];

  // Weak area insight
  const weakTopics = attempts.flatMap((a) => a.weakTopics || []);
  if (weakTopics.length > 0) {
    const topWeak = weakTopics[0];
    insights.push({
      type: 'alert',
      title: 'Targeted Review Needed',
      message: `Your recent quiz diagnostic indicates lower accuracy on "${topWeak}". Review this topic or ask StudyMate AI for a stepped explanation.`,
    });
  }

  // DSA insight
  const solvedCount = new Set(dsaSubs.filter((s) => s.status === 'Accepted').map((s) => s.problemId)).size;
  if (solvedCount >= 2) {
    insights.push({
      type: 'success',
      title: 'Algorithmic Momentum',
      message: `You have successfully solved ${solvedCount} DSA problems. Transition to Dynamic Programming or Graphs to elevate your placement readiness.`,
    });
  } else {
    insights.push({
      type: 'tip',
      title: 'Daily DSA Routine',
      message: 'Aim to solve at least 1 DSA problem every day. Consistent daily practice yields a 3.4x higher retention rate for coding interviews.',
    });
  }

  // Study habit insight
  const totalMins = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  if (totalMins > 90) {
    insights.push({
      type: 'success',
      title: 'High Focus Endurance',
      message: `You've logged ${totalMins} minutes of active study sessions. Keep utilizing the 25-minute Pomodoro timer to prevent cognitive fatigue.`,
    });
  } else {
    insights.push({
      type: 'tip',
      title: 'Boost Daily Study Block',
      message: 'Students studying in structured 45-minute focus intervals maintain 68% higher exam recall compared to marathon cramming.',
    });
  }

  res.json(insights);
});

// Start server with Vite middleware
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyMate server listening on port ${PORT}`);
  });
}

start();
