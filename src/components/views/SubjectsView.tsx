import React, { useEffect, useState } from 'react';

import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  FileText,
  Search,
  Sparkles,
  Play,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

import { api } from '../../api/client';
import { Subject, Note, QuizAttempt } from '../../types';
import { Modal } from '../common/Modal';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

type Video = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
};

type ExploredTopic = {
  name: string;
  description: string;
  difficulty: Difficulty;
  searchQuery: string;
  videos: Video[];
};

type ExplorationResult = {
  subject: string;
  overview: string;
  topics: ExploredTopic[];
};

export const SubjectsView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------
  // Existing Subject Modal
  // ----------------------------------------------------------

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] =
    useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [difficulty, setDifficulty] =
    useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [examDate, setExamDate] = useState('');
  const [progress, setProgress] = useState(45);
  const [topicsInput, setTopicsInput] = useState('');

  // ----------------------------------------------------------
  // AI Subject Explorer
  // ----------------------------------------------------------

  const [searchSubject, setSearchSubject] = useState('');
  const [exploring, setExploring] = useState(false);
  const [exploration, setExploration] =
    useState<ExplorationResult | null>(null);

  const [expandedTopic, setExpandedTopic] =
    useState<number | null>(null);

  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState<Video[]>([]);
  const [youtubeSearching, setYoutubeSearching] = useState(false);
  const [youtubeSearchedTopic, setYoutubeSearchedTopic] =
    useState<number | null>(null);

  // ----------------------------------------------------------
  // Load existing data
  // ----------------------------------------------------------

  const fetchData = async () => {
    try {
      setLoading(true);

      const [subjectsData, notesData, attemptsData] =
        await Promise.all([
          api.getSubjects(),
          api.getNotes(),
          api.getQuizAttempts(),
        ]);

      setSubjects(subjectsData || []);
      setNotes(notesData || []);
      setAttempts(attemptsData || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----------------------------------------------------------
  // AI Explorer
  // ----------------------------------------------------------

  const handleExplore = async () => {
    const subject = searchSubject.trim();

    if (!subject || exploring) {
      return;
    }

    try {
      setExploring(true);
      setExploration(null);
      setExpandedTopic(null);

      const result = await api.exploreSubject(subject);

      setExploration(result);
    } catch (error: any) {
      console.error('Subject exploration failed:', error);

      alert(
        error?.message ||
        'Unable to explore this subject. Please try again.'
      );
    } finally {
      setExploring(false);
    }
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      handleExplore();
    }
  };

  const handleTopicToggle = (index: number) => {
    const nextTopic = expandedTopic === index ? null : index;

    setExpandedTopic(nextTopic);
    setYoutubeSearchQuery('');
    setYoutubeResults([]);
    setYoutubeSearchedTopic(null);
  };

  const handleYoutubeSearch = async () => {
    const query = youtubeSearchQuery.trim();

    if (!query || youtubeSearching) return;

    try {
      setYoutubeSearching(true);
      setYoutubeResults([]);

      const result = await api.youtubeSearch(query);

      setYoutubeResults(result.videos || []);
      setYoutubeSearchedTopic(expandedTopic);
    } catch (error: any) {
      console.error('YouTube search failed:', error);

      alert(
        error?.message ||
        'Unable to search YouTube right now. Please try again.'
      );
    } finally {
      setYoutubeSearching(false);
    }
  };

  const handleYoutubeSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      handleYoutubeSearch();
    }
  };

  const clearExplorer = () => {
    setSearchSubject('');
    setExploration(null);
    setExpandedTopic(null);
  };

  const searchExample = (subject: string) => {
    setSearchSubject(subject);
  };

  // ----------------------------------------------------------
  // Existing CRUD
  // ----------------------------------------------------------

  const handleOpenAdd = () => {
    setEditingSubjectId(null);
    setName('');
    setCode('');
    setDifficulty('Medium');
    setExamDate('');
    setProgress(45);
    setTopicsInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setName(subject.name || '');
    setCode(subject.code || '');
    setDifficulty(
      (subject.difficulty as 'Easy' | 'Medium' | 'Hard') ||
      'Medium'
    );
    setExamDate(subject.examDate || '');
    setProgress(subject.progress || 0);

    const topics =
      Array.isArray(subject.topics)
        ? subject.topics.join(', ')
        : '';

    setTopicsInput(topics);

    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this subject?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteSubject(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete subject:', error);
      alert('Failed to delete subject.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a subject name.');
      return;
    }

    try {
      const topics = topicsInput
        .split(',')
        .map((topic) => topic.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        code: code.trim(),
        difficulty,
        examDate: examDate || '',
        progress,
        topics,
      };

      if (editingSubjectId) {
        await api.updateSubject(editingSubjectId, payload);
      } else {
        await api.createSubject(payload);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Failed to save subject:', error);
      alert('Failed to save subject.');
    }
  };

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  const getDifficultyStyle = (level: Difficulty) => {
    if (level === 'Beginner') {
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    }

    if (level === 'Intermediate') {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }

    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const getSubjectDifficultyStyle = (
    level: 'Easy' | 'Medium' | 'Hard'
  ) => {
    if (level === 'Easy') {
      return 'bg-green-500/10 text-green-400';
    }

    if (level === 'Hard') {
      return 'bg-red-500/10 text-red-400';
    }

    return 'bg-yellow-500/10 text-yellow-400';
  };

  const getTopicNumber = (index: number) =>
    String(index + 1).padStart(2, '0');

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />

              <span className="text-sm font-medium text-primary">
                AI ENGINEERING EXPLORER
              </span>
            </div>

            <h1 className="text-3xl font-bold text-white">
              Subjects & Learning Roadmaps
            </h1>

            <p className="text-gray-400 mt-2">
              Explore any engineering subject with AI-generated topics
              and real YouTube learning resources.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-black font-semibold hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            Add Subject
          </button>
        </div>
      </div>


      {/* ======================================================
          AI SEARCH
      ====================================================== */}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-7">

        <div className="flex items-center gap-2 mb-2">
          <Search className="w-5 h-5 text-primary" />

          <h2 className="text-xl font-semibold text-white">
            Search Any Engineering Subject
          </h2>
        </div>

        <p className="text-sm text-gray-400 mb-5">
          Search CSE, ECE, EEE, Mechanical, Civil, Chemical,
          Aerospace, Robotics, VLSI, AI/ML or any other engineering topic.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">

          <div className="relative flex-1">

            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />

            <input
              value={searchSubject}
              onChange={(event) =>
                setSearchSubject(event.target.value)
              }
              onKeyDown={handleSearchKeyDown}
              placeholder="Example: VLSI, Thermodynamics, DBMS, Digital Electronics..."
              className="w-full pl-12 pr-12 py-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-primary/60 transition"
            />

            {searchSubject && (
              <button
                onClick={clearExplorer}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={18} />
              </button>
            )}

          </div>

          <button
            onClick={handleExplore}
            disabled={!searchSubject.trim() || exploring}
            className="px-7 py-4 rounded-xl bg-primary text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition inline-flex items-center justify-center gap-2"
          >
            {exploring ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exploring...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Explore with AI
              </>
            )}
          </button>

        </div>

        <div className="flex flex-wrap gap-2 mt-4">

          <span className="text-xs text-gray-500 mr-1 py-2">
            Try:
          </span>

          {[
            'VLSI',
            'DBMS',
            'Thermodynamics',
            'Digital Electronics',
            'Power Systems',
            'Robotics',
            'Structural Engineering',
          ].map((example) => (
            <button
              key={example}
              onClick={() => searchExample(example)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-primary/40 transition"
            >
              {example}
            </button>
          ))}

        </div>
      </section>


      {/* ======================================================
          AI ROADMAP
      ====================================================== */}

      {exploring && (
        <section className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-8">

          <div className="flex flex-col items-center justify-center text-center py-10">

            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>

            <h2 className="text-xl font-semibold text-white">
              Building your learning roadmap...
            </h2>

            <p className="text-gray-400 mt-2 max-w-lg">
              Gemini is creating the important topics, then StudyMate
              searches YouTube for real learning resources.
            </p>

            <div className="flex items-center gap-2 mt-5 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Finding topics and videos
            </div>

          </div>

        </section>
      )}


      {exploration && !exploring && (
        <section className="space-y-5">

          {/* Overview */}

          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-6">

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

              <div>

                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />

                  <span className="text-sm font-medium text-primary">
                    AI-GENERATED ROADMAP
                  </span>
                </div>

                <h2 className="text-3xl font-bold text-white">
                  {exploration.subject}
                </h2>

                <p className="text-gray-300 mt-3 max-w-4xl leading-relaxed">
                  {exploration.overview}
                </p>

              </div>

              <button
                onClick={clearExplorer}
                className="self-start px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                Clear
              </button>

            </div>

          </div>


          {/* Topics */}

          <div>

            <div className="flex items-center justify-between mb-4">

              <div>
                <h3 className="text-xl font-semibold text-white">
                  Learning Roadmap
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Start from the fundamentals and progress through the topics.
                </p>
              </div>

              <span className="text-sm text-gray-500">
                {exploration.topics.length} topics
              </span>

            </div>


            <div className="space-y-4">

              {exploration.topics.map((topic, index) => {

                const isExpanded =
                  expandedTopic === index;

                return (
                  <div
                    key={`${topic.name}-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden"
                  >

                    {/* Topic Header */}

                    <button
                      onClick={() =>
                        handleTopicToggle(index)
                      }
                      className="w-full text-left p-5 md:p-6 hover:bg-white/[0.025] transition"
                    >

                      <div className="flex items-start gap-4">

                        <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {getTopicNumber(index)}
                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h4 className="text-lg font-semibold text-white">
                              {topic.name}
                            </h4>

                            <span
                              className={`text-xs px-2.5 py-1 rounded-full border ${getDifficultyStyle(topic.difficulty)}`}
                            >
                              {topic.difficulty}
                            </span>

                          </div>

                          <p className="text-gray-400 text-sm mt-2">
                            {topic.description}
                          </p>

                        </div>

                        <div className="text-gray-500 pt-1">

                          {isExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}

                        </div>

                      </div>

                    </button>



                    {/* ==================================================
                        REAL YOUTUBE SEARCH
                    ================================================== */}

                    {isExpanded && (
                      <div className="border-t border-white/10 p-5 md:p-6 bg-black/10">

                        <div className="mb-5">

                          <div className="flex items-center gap-2 mb-2">
                            <Search className="w-5 h-5 text-red-500" />

                            <h5 className="font-semibold text-white">
                              Search YouTube
                            </h5>
                          </div>

                          <p className="text-xs text-gray-500 mb-4">
                            Search anything you want. Results come directly
                            from YouTube.
                          </p>

                          <div className="flex flex-col sm:flex-row gap-3">

                            <div className="relative flex-1">

                              <Search
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                                size={18}
                              />

                              <input
                                type="text"
                                value={youtubeSearchQuery}
                                onChange={(event) =>
                                  setYoutubeSearchQuery(event.target.value)
                                }
                                onKeyDown={handleYoutubeSearchKeyDown}
                                placeholder={`Search YouTube... e.g. deadlock in ${exploration.subject}`}
                                className="w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-primary/50 transition"
                              />

                            </div>

                            <button
                              type="button"
                              onClick={handleYoutubeSearch}
                              disabled={
                                youtubeSearching ||
                                !youtubeSearchQuery.trim()
                              }
                              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-black font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >

                              {youtubeSearching ? (
                                <>
                                  <Loader2
                                    size={18}
                                    className="animate-spin"
                                  />
                                  Searching...
                                </>
                              ) : (
                                <>
                                  <Search size={18} />
                                  Search YouTube
                                </>
                              )}

                            </button>

                          </div>

                        </div>


                        {youtubeSearchedTopic === index && (

                          <div>

                            <div className="flex items-center justify-between mb-4">

                              <div>

                                <h6 className="font-semibold text-white">
                                  YouTube Results
                                </h6>

                                <p className="text-xs text-gray-500 mt-1">
                                  Results for "{youtubeSearchQuery}"
                                </p>

                              </div>

                              {youtubeResults.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {youtubeResults.length} videos
                                </span>
                              )}

                            </div>


                            {youtubeResults.length === 0 ? (

                              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">

                                <Search
                                  className="mx-auto text-gray-600 mb-3"
                                  size={28}
                                />

                                <p className="text-sm text-gray-400">
                                  No YouTube videos found.
                                </p>

                              </div>

                            ) : (

                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                                {youtubeResults.map((video) => (

                                  <a
                                    key={video.videoId}
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group rounded-xl border border-white/10 bg-white/[0.025] overflow-hidden hover:border-red-500/40 transition"
                                  >

                                    <div className="relative aspect-video bg-black overflow-hidden">

                                      <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                      />

                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">

                                        <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">

                                          <Play
                                            size={21}
                                            fill="currentColor"
                                          />

                                        </div>

                                      </div>

                                    </div>


                                    <div className="p-4">

                                      <h6 className="font-medium text-white text-sm line-clamp-2 group-hover:text-primary transition">
                                        {video.title}
                                      </h6>

                                      <p className="text-xs text-gray-500 mt-2 line-clamp-1">
                                        {video.channelTitle}
                                      </p>

                                      <div className="flex items-center gap-1 mt-3 text-xs text-red-400">
                                        Watch on YouTube
                                        <ExternalLink size={12} />
                                      </div>

                                    </div>

                                  </a>

                                ))}

                              </div>

                            )}

                          </div>

                        )}


                        {youtubeSearchedTopic !== index && (

                          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">

                            <Search
                              className="mx-auto text-red-400 mb-3"
                              size={24}
                            />

                            <p className="text-sm text-gray-300">
                              Search for any concept you want to learn.
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                              Try: deadlock, normalization, B+ tree,
                              indexing, transactions
                            </p>

                          </div>

                        )}

                      </div>
                    )}


                  </div>
                );
              })}

            </div>

          </div>

        </section>
      )}


      {/* ======================================================
          MY SUBJECTS
      ====================================================== */}

      <section>

        <div className="flex items-center justify-between mb-5">

          <div>
            <h2 className="text-xl font-semibold text-white">
              My Subjects
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Your saved engineering subjects and exam progress.
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {subjects.length} subjects
          </span>

        </div>


        {subjects.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">

            <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-4" />

            <h3 className="text-lg font-medium text-white">
              No subjects added yet
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Add your subjects or use the AI Explorer above.
            </p>

            <button
              onClick={handleOpenAdd}
              className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-black font-semibold"
            >
              Add Your First Subject
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {subjects.map((subject) => {

              const subjectNotes =
                notes.filter(
                  (note) => note.subjectId === subject.id
                ).length;

              const subjectAttempts =
                attempts.length;

              return (
                <div
                  key={subject.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 hover:border-white/20 transition"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-start gap-3">

                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>

                      <div>

                        <p className="text-xs text-gray-500">
                          {subject.code || 'SUBJECT'}
                        </p>

                        <h3 className="font-semibold text-white mt-1">
                          {subject.name}
                        </h3>

                      </div>

                    </div>


                    <div className="flex items-center gap-1">

                      <button
                        onClick={() =>
                          handleOpenEdit(subject)
                        }
                        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(subject.id)
                        }
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </div>


                  <div className="mt-5">

                    <div className="flex items-center justify-between mb-2">

                      <span className="text-xs text-gray-500">
                        Progress
                      </span>

                      <span className="text-sm font-semibold text-white">
                        {subject.progress || 0}%
                      </span>

                    </div>

                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">

                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              subject.progress || 0
                            )
                          )}%`,
                        }}
                      />

                    </div>

                  </div>


                  <div className="flex flex-wrap items-center gap-2 mt-5">

                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg ${getSubjectDifficultyStyle(
                        (subject.difficulty as
                          | 'Easy'
                          | 'Medium'
                          | 'Hard') || 'Medium'
                      )}`}
                    >
                      {subject.difficulty || 'Medium'}
                    </span>

                    {subject.examDate && (
                      <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(
                          subject.examDate
                        ).toLocaleDateString()}
                      </span>
                    )}

                  </div>


                  <div className="grid grid-cols-2 gap-3 mt-5">

                    <div className="rounded-xl bg-white/[0.03] p-3">

                      <div className="flex items-center gap-2 text-gray-500">
                        <FileText size={14} />

                        <span className="text-xs">
                          Notes
                        </span>
                      </div>

                      <p className="text-lg font-semibold text-white mt-1">
                        {subjectNotes}
                      </p>

                    </div>


                    <div className="rounded-xl bg-white/[0.03] p-3">

                      <div className="flex items-center gap-2 text-gray-500">

                        <BookOpen size={14} />

                        <span className="text-xs">
                          Quizzes
                        </span>

                      </div>

                      <p className="text-lg font-semibold text-white mt-1">
                        {subjectAttempts}
                      </p>

                    </div>

                  </div>


                  {Array.isArray(subject.topics) &&
                    subject.topics.length > 0 && (

                    <div className="mt-5">

                      <p className="text-xs text-gray-500 mb-2">
                        Topics
                      </p>

                      <div className="flex flex-wrap gap-1.5">

                        {subject.topics
                          .slice(0, 5)
                          .map((topic, index) => (

                            <span
                              key={`${topic}-${index}`}
                              className="text-xs px-2 py-1 rounded-md bg-white/5 text-gray-400"
                            >
                              {topic}
                            </span>

                          ))}

                        {subject.topics.length > 5 && (
                          <span className="text-xs px-2 py-1 text-gray-600">
                            +{subject.topics.length - 5}
                          </span>
                        )}

                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </div>

        )}

      </section>


      {/* ======================================================
          ADD / EDIT SUBJECT MODAL
      ====================================================== */}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingSubjectId
            ? 'Edit Subject'
            : 'Add New Subject'
        }
      >

        <div className="space-y-5">

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Subject Name
            </label>

            <input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Example: Computer Networks"
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-primary/50"
            />

          </div>


          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Subject Code
            </label>

            <input
              value={code}
              onChange={(event) =>
                setCode(event.target.value)
              }
              placeholder="Example: CS301"
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-primary/50"
            />

          </div>


          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Difficulty
            </label>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value as
                    | 'Easy'
                    | 'Medium'
                    | 'Hard'
                )
              }
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-primary/50"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

          </div>


          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Exam Date
            </label>

            <input
              type="date"
              value={examDate}
              onChange={(event) =>
                setExamDate(event.target.value)
              }
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-primary/50"
            />

          </div>


          <div>

            <div className="flex items-center justify-between mb-2">

              <label className="text-sm text-gray-400">
                Progress
              </label>

              <span className="text-sm text-primary font-semibold">
                {progress}%
              </span>

            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(event) =>
                setProgress(Number(event.target.value))
              }
              className="w-full"
            />

          </div>


          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Topics
            </label>

            <textarea
              value={topicsInput}
              onChange={(event) =>
                setTopicsInput(event.target.value)
              }
              placeholder="Topic 1, Topic 2, Topic 3"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:border-primary/50 resize-none"
            />

          </div>


          <div className="flex justify-end gap-3 pt-2">

            <button
              onClick={() =>
                setIsModalOpen(false)
              }
              className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold"
            >
              {editingSubjectId
                ? 'Save Changes'
                : 'Add Subject'}
            </button>

          </div>

        </div>

      </Modal>

    </div>
  );
};

export default SubjectsView;
