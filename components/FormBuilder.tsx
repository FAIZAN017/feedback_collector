
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Question, QuestionType, User } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';

interface FormBuilderProps {
  user: User | null;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ user }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const [form, setForm] = useState<Form>({
    id: crypto.randomUUID(),
    title: '',
    description: '',
    questions: [],
    createdAt: Date.now(),
    isPublished: false,
    authorId: user?.id
  });

  useEffect(() => {
    const load = async () => {
      if (!user) {
        navigate('/');
        return;
      }
      if (!id) return;
      try {
        const all = await storageService.getForms();
        const existing = all.find((f) => f.id === id);
        if (existing) setForm(existing);
      } catch (err) {
        console.error('Failed to load form for editing', err);
      }
    };

    load();
  }, [id, user, navigate]);

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      label: '',
      required: true,
      options: type === QuestionType.MULTIPLE_CHOICE ? ['Option 1'] : undefined
    };
    setForm({ ...form, questions: [...form.questions, newQuestion] });
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    setForm({
      ...form,
      questions: form.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
    });
  };

  const removeQuestion = (qId: string) => {
    setForm({
      ...form,
      questions: form.questions.filter(q => q.id !== qId)
    });
  };

  const handleSave = () => {
    if (!form.title) {
      alert('Please provide a title');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        await storageService.saveForm(form);
        navigate('/');
      } catch (err) {
        console.error('Failed to save form', err);
        alert('Failed to save form. See console for details.');
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const result = await geminiService.generateFormStructure(aiPrompt);
      setForm({
        ...form,
        title: result.title,
        description: result.description,
        questions: result.questions.map((q: any) => ({
          ...q,
          id: crypto.randomUUID()
        }))
      });
      setAiPrompt('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate form. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}#/form/${form.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(null), 2000);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">{id ? 'Edit Evaluation' : 'New Evaluation'}</h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-slate-600 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition-colors"
          >
            Save Form
          </button>
        </div>
      </div>

      {form.isPublished && id && (
        <section className="bg-green-50 border border-green-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
              <i className="fa-solid fa-link"></i>
            </div>
            <div>
              <h4 className="text-sm font-bold text-green-800">Your form is live!</h4>
              <p className="text-xs text-green-700 truncate max-w-xs md:max-w-md">{shareUrl}</p>
            </div>
          </div>
          <button
            onClick={copyLink}
            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 ${isLinkCopied ? 'bg-green-600 text-white' : 'bg-white border border-green-200 text-green-700 hover:bg-green-100'}`}
          >
            <i className={`fa-solid ${isLinkCopied ? 'fa-check' : 'fa-copy'}`}></i>
            <span>{isLinkCopied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </section>
      )}

      <section className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2 flex items-center">
            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
            AI Form Designer
          </h2>
          <p className="text-indigo-100 text-sm mb-4">Describe your event (e.g., "Web Dev Workshop" or "Physics 101 Course") and let Gemini build the questions for you.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g. Yoga class feedback, Marketing summit summary..."
              className="flex-grow px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={handleAiGenerate}
              disabled={isGenerating || !aiPrompt}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 disabled:opacity-50 transition-all"
            >
              {isGenerating ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Generate'}
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      </section>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Form Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Feedback for 2024 Design Summit"
            className="w-full text-2xl font-bold border-none focus:ring-0 placeholder:text-slate-200 p-0"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Share your thoughts on the event organization and speakers..."
            className="w-full text-slate-600 border-none focus:ring-0 placeholder:text-slate-200 p-0 resize-none h-20"
          />
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700">Publish Form</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <i className="fa-solid fa-layer-group mr-2 text-indigo-500"></i>
          Questions
        </h3>
        {form.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {idx + 1}</span>
              <button
                onClick={() => removeQuestion(q.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={q.label}
                  onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                  placeholder="Enter question here..."
                  className="w-full text-lg font-medium border-b border-slate-100 focus:border-indigo-500 focus:ring-0 py-2 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                  className="w-full border-slate-200 rounded-lg text-sm"
                >
                  <option value={QuestionType.TEXT}>Text Answer</option>
                  <option value={QuestionType.RATING}>Rating (1-5)</option>
                  <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                  <option value={QuestionType.YES_NO}>Yes/No</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500">Required</span>
                </label>
              </div>
              {q.type === QuestionType.MULTIPLE_CHOICE && (
                <div className="md:col-span-2 space-y-2 mt-2">
                  <label className="block text-xs font-bold text-slate-500">Options</label>
                  {q.options?.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(q.options || [])];
                          newOpts[oIdx] = e.target.value;
                          updateQuestion(q.id, { options: newOpts });
                        }}
                        className="flex-grow text-sm border-slate-200 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          const newOpts = q.options?.filter((_, i) => i !== oIdx);
                          updateQuestion(q.id, { options: newOpts });
                        }}
                        className="text-slate-300 hover:text-red-400"
                      >
                        <i className="fa-solid fa-circle-minus"></i>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateQuestion(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })}
                    className="text-xs font-bold text-indigo-600 flex items-center hover:underline"
                  >
                    <i className="fa-solid fa-plus-circle mr-1"></i> Add Option
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3 pt-4">
          <span className="w-full text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Add</span>
          <button onClick={() => addQuestion(QuestionType.TEXT)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
            <i className="fa-solid fa-align-left mr-2"></i> Text
          </button>
          <button onClick={() => addQuestion(QuestionType.RATING)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
            <i className="fa-solid fa-star mr-2"></i> Rating
          </button>
          <button onClick={() => addQuestion(QuestionType.MULTIPLE_CHOICE)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
            <i className="fa-solid fa-circle-dot mr-2"></i> Choice
          </button>
          <button onClick={() => addQuestion(QuestionType.YES_NO)} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
            <i className="fa-solid fa-thumbs-up mr-2"></i> Yes/No
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
