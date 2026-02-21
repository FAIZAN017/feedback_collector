
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, FormResponse, QuestionType, Answer } from '../types';
import { storageService } from '../services/storageService';

const FormRenderer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  // Fix: Explicitly type the answers state to include string, number, and boolean as allowed in the Answer interface.
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const all = await storageService.getForms();
        const found = all.find(f => f.id === id);
        if (found) setForm(found);
      } catch (err) {
        console.error('Failed to load form', err);
      }
    };

    load();
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validation
    for (const q of form.questions) {
      if (q.required && (answers[q.id] === undefined || answers[q.id] === '')) {
        alert(`Question "${q.label}" is required.`);
        return;
      }
    }

    const response: FormResponse = {
      id: crypto.randomUUID(),
      formId: form.id,
      submittedAt: Date.now(),
      respondentName: isAnonymous ? 'Anonymous' : name,
      // Fix: Ensure the mapped answers are typed correctly to match the Answer interface.
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value: value as string | number | boolean
      }))
    };

    (async () => {
      try {
        await storageService.saveResponse(response);
        setSubmitted(true);
      } catch (err) {
        console.error('Failed to save response', err);
        alert('Failed to submit response. See console for details.');
      }
    })();
  };

  if (!form) {
    return <div className="text-center py-20">Form not found.</div>;
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          <i className="fa-solid fa-check"></i>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Feedback Submitted!</h1>
        <p className="text-slate-600 mb-8">Thank you for taking the time to share your experience. Your insights help us improve.</p>
        <button 
          onClick={() => navigate('/')}
          className="text-indigo-600 font-bold hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 h-2"></div>
        <div className="p-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{form.title}</h1>
          <p className="text-slate-500">{form.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Submission Preference</h3>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setIsAnonymous(true)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${isAnonymous ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}
            >
              <i className="fa-solid fa-user-secret"></i> Anonymous
            </button>
            <button 
              type="button"
              onClick={() => setIsAnonymous(false)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${!isAnonymous ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}
            >
              <i className="fa-solid fa-user"></i> Include Name
            </button>
          </div>
          {!isAnonymous && (
            <div className="pt-2">
              <input 
                type="text"
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isAnonymous}
                className="w-full border-slate-200 rounded-xl px-4 py-3"
              />
            </div>
          )}
        </div>

        {form.questions.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
            <label className="block font-bold text-slate-800 text-lg">
              {q.label} {q.required && <span className="text-red-500">*</span>}
            </label>
            
            {q.type === QuestionType.TEXT && (
              <textarea 
                className="w-full border-slate-200 rounded-xl h-32 p-4 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Type your answer here..."
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                required={q.required}
              />
            )}

            {q.type === QuestionType.RATING && (
              <div className="flex justify-between items-center max-w-sm">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [q.id]: num })}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all border-2 ${answers[q.id] === num ? 'bg-indigo-600 text-white border-indigo-600 scale-110' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-indigo-300'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            {q.type === QuestionType.MULTIPLE_CHOICE && (
              <div className="space-y-2">
                {q.options?.map((opt, i) => (
                  <label key={i} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200'}`}>
                    <input 
                      type="radio" 
                      name={q.id} 
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                      className="text-indigo-600 w-5 h-5 focus:ring-indigo-500"
                    />
                    <span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === QuestionType.YES_NO && (
              <div className="flex gap-4">
                {['Yes', 'No'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [q.id]: val })}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold border-2 transition-all ${answers[q.id] === val ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-lg font-extrabold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
          >
            Submit Feedback
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormRenderer;
