import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Star,
  Sparkles,
  Trash2,
  Edit2,
  Tag,
  BookOpen,
  Check,
  BotMessageSquare,
  Lightbulb,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../api/client';
import { Note, Subject } from '../../types';
import { Modal } from '../common/Modal';

export const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Active AI output modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState('');
  const [aiResultText, setAiResultText] = useState('');
  const [explaining, setExplaining] = useState(false);

  // Upload and AI note analysis
  const [uploadingNotes, setUploadingNotes] = useState(false);
  const [isDraggingNotes, setIsDraggingNotes] = useState(false);

  // Add / Edit Note modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nList, sList] = await Promise.all([api.getNotes(), api.getSubjects()]);
      setNotes(nList);
      setSubjects(sList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    if (subjects.length > 0) setSubjectId(subjects[0].id);
    setTagsInput('');
    setIsPinned(false);
    setIsFavorite(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: Note) => {
    setEditingNoteId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setSubjectId(n.subjectId || '');
    setTagsInput(n.tags.join(', '));
    setIsPinned(n.isPinned);
    setIsFavorite(n.isFavorite);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async (n: Note) => {
    try {
      const updated = await api.updateNote(n.id, { isPinned: !n.isPinned });
      setNotes((prev) => prev.map((item) => (item.id === n.id ? updated : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (n: Note) => {
    try {
      const updated = await api.updateNote(n.id, { isFavorite: !n.isFavorite });
      setNotes((prev) => prev.map((item) => (item.id === n.id ? updated : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selSubject = subjects.find((s) => s.id === subjectId);
    const subjectName = selSubject ? selSubject.name : undefined;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingNoteId) {
        const updated = await api.updateNote(editingNoteId, {
          title,
          content,
          subjectId: subjectId || undefined,
          subjectName,
          tags,
          isPinned,
          isFavorite,
        });
        setNotes((prev) => prev.map((n) => (n.id === editingNoteId ? updated : n)));
      } else {
        const created = await api.createNote({
          title,
          content,
          subjectId: subjectId || undefined,
          subjectName,
          tags,
          isPinned,
          isFavorite,
        });
        setNotes((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotesFile = async (file: File) => {
    const allowed = ['.pdf', '.docx'];
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowed.includes(extension)) {
      setAiModalTitle('Unsupported Notes File');
      setAiResultText('Please upload a **PDF** or **DOCX** file.');
      setAiModalOpen(true);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setAiModalTitle('File Too Large');
      setAiResultText('The maximum upload size is **20 MB**.');
      setAiModalOpen(true);
      return;
    }

    setUploadingNotes(true);
    setAiModalTitle(`AI Study Guide: ${file.name}`);
    setAiResultText('');
    setAiModalOpen(true);

    try {
      const result = await api.analyzeNotesUpload(file);
      setAiResultText(result.analysis);
    } catch (err: any) {
      setAiResultText(`⚠️ Failed to analyze notes: ${err.message}`);
    } finally {
      setUploadingNotes(false);
    }
  };

  const handleNotesFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleNotesFile(file);
    e.target.value = '';
  };

  const handleAIExplain = async (note: Note, action: 'simplify' | 'summarize' | 'exam_tips') => {
    setExplaining(true);
    const titles = {
      simplify: `AI Conceptual Simplification: ${note.title}`,
      summarize: `Key Takeaways & High-Yield Summary: ${note.title}`,
      exam_tips: `University Exam Tips & Common Traps: ${note.title}`,
    };
    setAiModalTitle(titles[action]);
    setAiResultText('');
    setAiModalOpen(true);

    try {
      const res = await api.explainNote(note.id, action);
      setAiResultText(res.explanation);
    } catch (err: any) {
      setAiResultText(`⚠️ Failed to generate AI insights: ${err.message}`);
    } finally {
      setExplaining(false);
    }
  };

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  const filteredNotes = notes
    .filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = selectedTag ? n.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-400" />
            Academic Notes & Knowledge Base
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Create structured markdown study notes and use Gemini AI to simplify or extract exam tips.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* AI NOTES UPLOAD */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingNotes(true);
        }}
        onDragLeave={() => setIsDraggingNotes(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingNotes(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleNotesFile(file);
        }}
        className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 transition-all ${
          isDraggingNotes
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-slate-800 bg-slate-900/40 hover:border-indigo-500/40'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">Upload Notes & Let AI Teach You</h3>
            <p className="text-xs text-slate-400 mt-1">
              Drag & drop a PDF or DOCX. StudyMate will read it and create important topics, detailed explanations,
              formulas, exam questions, quick revision, and memory tricks.
            </p>
            <p className="text-[10px] text-slate-600 mt-1">PDF/DOCX • Maximum 20 MB</p>
          </div>
          <label className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer shadow-md shadow-indigo-600/20">
            <BookOpen className="h-4 w-4" />
            <span>{uploadingNotes ? 'Analyzing...' : 'Choose File'}</span>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleNotesFileInput}
              disabled={uploadingNotes}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* SEARCH & TAG FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, concepts, tags..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 text-xs">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTag === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* NOTES GRID */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading notes...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-sm font-semibold text-slate-300">No notes found</p>
          <p className="text-xs text-slate-500 mt-1">Create your first note to start organizing study concepts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`flex flex-col justify-between rounded-2xl border transition-all ${
                note.isPinned
                  ? 'border-indigo-500/40 bg-slate-900/80 shadow-md shadow-indigo-500/5'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              } p-5 backdrop-blur-md`}
            >
              <div>
                {/* Header: pin & fav & title */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    {note.subjectName && (
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                        {note.subjectName}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white">{note.title}</h3>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        note.isPinned ? 'text-indigo-400 bg-indigo-500/15' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={note.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(note)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        note.isFavorite ? 'text-amber-400 fill-amber-400 bg-amber-500/15' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Favorite"
                    >
                      <Star className={`h-3.5 w-3.5 ${note.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Markdown snippet */}
                <div className="text-xs text-slate-300 line-clamp-6 my-3 leading-relaxed border-t border-slate-800/60 pt-2 font-mono">
                  <div className="markdown-body">
                    <Markdown>{note.content}</Markdown>
                  </div>
                </div>

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                    {note.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom AI Tools & Actions */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleAIExplain(note, 'simplify')}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Simplify</span>
                  </button>

                  <button
                    onClick={() => handleAIExplain(note, 'summarize')}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <FileSpreadsheet className="h-3 w-3" />
                    <span>Takeaways</span>
                  </button>

                  <button
                    onClick={() => handleAIExplain(note, 'exam_tips')}
                    className="flex-1 flex items-center justify-center space-x-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
                  >
                    <Lightbulb className="h-3 w-3" />
                    <span>Exam Tips</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(note)}
                      className="p-1 hover:text-white transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT NOTE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNoteId ? 'Edit Academic Note' : 'Create New Note'}
        subtitle="Write Markdown content with code examples and theorems"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Virtual Memory, Page Faults, and LRU Replacement"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subject Association</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">General Notes</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="os, paging, exam-prep"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Content (Markdown supported) *</label>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="### Core Principle&#10;- Point 1&#10;- Point 2&#10;&#10;```python&#10;def example(): ...&#10;```"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Pin to Top</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Mark as Favorite</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30"
            >
              {editingNoteId ? 'Save Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </Modal>

      {/* AI EXPLANATION / SUMMARY MODAL */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title={aiModalTitle}
        subtitle="Powered by Gemini 3.8 Flash • Pedagogical synthesis"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {explaining || uploadingNotes ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Sparkles className="h-6 w-6 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-300">StudyMate AI is reading and analyzing your notes...</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 max-h-[60vh] overflow-y-auto leading-relaxed">
              <div className="markdown-body prose prose-invert prose-xs max-w-none">
                <Markdown>{aiResultText}</Markdown>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setAiModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
