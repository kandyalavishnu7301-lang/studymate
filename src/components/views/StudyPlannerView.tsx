import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Sparkles,
  CheckCircle2,
  Trash2,
  Clock,
  AlertCircle,
  Tag,
  Check,
  Edit2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { api } from '../../api/client';
import { StudyTask, Subject } from '../../types';
import { Modal } from '../common/Modal';

export const StudyPlannerView: React.FC = () => {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('all');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tList, sList] = await Promise.all([api.getTasks(), api.getSubjects()]);
      setTasks(tList);
      setSubjects(sList);
      if (sList.length > 0 && !subjectId) {
        setSubjectId(sList[0].id);
      }
    } catch (err) {
      console.error('Failed to load planner data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleCompleted = async (task: StudyTask) => {
    try {
      const updated = await api.updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTaskId(null);
    setTitle('');
    setTopic('');
    if (subjects.length > 0) setSubjectId(subjects[0].id);
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('18:00');
    setEndTime('19:00');
    setDifficulty('Medium');
    setPriority('High');
    setEstimatedMinutes(60);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: StudyTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setTopic(task.topic);
    setSubjectId(task.subjectId);
    setDate(task.date);
    setStartTime(task.startTime);
    setEndTime(task.endTime);
    setDifficulty(task.difficulty);
    setPriority(task.priority);
    setEstimatedMinutes(task.estimatedMinutes);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const selSubject = subjects.find((s) => s.id === subjectId);
    const subjectName = selSubject ? selSubject.name : 'Computer Science';

    try {
      if (editingTaskId) {
        const updated = await api.updateTask(editingTaskId, {
          title,
          topic,
          subjectId,
          subjectName,
          date,
          startTime,
          endTime,
          difficulty,
          priority,
          estimatedMinutes,
        });
        setTasks((prev) => prev.map((t) => (t.id === editingTaskId ? updated : t)));
      } else {
        const created = await api.createTask({
          title,
          topic,
          subjectId,
          subjectName,
          date,
          startTime,
          endTime,
          difficulty,
          priority,
          estimatedMinutes,
          completed: false,
        });
        setTasks((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAIStudyPlan = async () => {
    setGenerating(true);
    try {
      const res = await api.generateAIStudyPlan();
      setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to generate AI plan', err);
    } finally {
      setGenerating(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'today') return t.date === todayStr;
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* HEADER & ACTION ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-indigo-400" />
            Adaptive Study Timetable
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Structured daily blocks balancing deep work, exam countdowns, and topic difficulty.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleGenerateAIStudyPlan}
            disabled={generating}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? 'Gemini AI is Planning...' : 'Generate AI Study Plan'}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* METRICS & COMPLETION BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-medium text-slate-400">Total Scheduled Tasks</p>
          <p className="text-2xl font-bold text-white mt-1">{tasks.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all enrolled subjects</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-medium text-slate-400">Completed Tasks</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{tasks.length - completedCount} pending</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
            <span>Overall Plan Completion</span>
            <span className="font-bold text-indigo-400">{completionPercentage}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'today', label: 'Today Only' },
          { id: 'pending', label: 'Pending' },
          { id: 'completed', label: 'Completed' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === f.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* TASKS LIST */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading your timetable...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-sm font-semibold text-slate-300">No tasks in this view</p>
          <p className="text-xs text-slate-500 mt-1">Add a custom task or click "Generate AI Study Plan".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                task.completed
                  ? 'border-slate-800/40 bg-slate-950/40 opacity-70'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 shadow-md'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <button
                  onClick={() => handleToggleCompleted(task)}
                  className={`mt-0.5 h-6 w-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-700 hover:border-indigo-500 bg-slate-950 text-transparent'
                  }`}
                >
                  <Check className="h-4 w-4" />
                </button>

                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-bold ${
                        task.completed ? 'line-through text-slate-500' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'High'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                          : task.priority === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    <span className="text-indigo-400 font-semibold">{task.subjectName}</span> • {task.topic}
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3 text-slate-400" /> {task.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" /> {task.startTime} - {task.endTime} ({task.estimatedMinutes}m)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300">
                      {task.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <button
                  onClick={() => handleOpenEditModal(task)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Edit task"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTaskId ? 'Edit Study Task' : 'Schedule New Study Task'}
        subtitle="Specify subject, topic, and planned time slot"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solve Binary Tree Traversal Problems"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subject *</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Topic *</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Inorder & Postorder"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                max={300}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
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
              {editingTaskId ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
