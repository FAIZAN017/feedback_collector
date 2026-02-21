
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, FormResponse, User, QuestionType } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface AnalyticsProps {
  user: User | null;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

const Analytics: React.FC<AnalyticsProps> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        navigate('/');
        return;
      }
      if (!id) return;
      try {
        const all = await storageService.getForms();
        const f = all.find((x) => x.id === id) || null;
        setForm(f);
        const r = await storageService.getResponsesForForm(id);
        setResponses(r);
      } catch (err) {
        console.error('Failed to load analytics data', err);
      }
    };

    load();
  }, [id, user, navigate]);

  const handleSummarize = async () => {
    if (!form || responses.length === 0) return;
    setIsSummarizing(true);
    try {
      // Collect all text responses to questions for analysis
      const dataForAi = form.questions.map(q => {
        const answers = responses.map(r => r.answers.find(a => a.questionId === q.id)?.value);
        return { question: q.label, type: q.type, answers };
      });

      const result = await geminiService.summarizeFeedback(form.title, dataForAi);
      setSummary(result);

      // Save summary to database
      try {
        await storageService.saveSummary({
          id: crypto.randomUUID(),
          formId: form.id,
          summary: result.summary,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          sentimentScore: result.sentimentScore,
          generatedAt: Date.now()
        });
        console.log('Summary saved to database');
      } catch (dbErr) {
        console.error('Failed to save summary to database:', dbErr);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to summarize feedback. Please check your API key and console logs.');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!form) return <div className="text-center py-20">Loading analytics...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">{form.title}</h1>
          <p className="text-slate-500 mt-1">Analytics and Response Summary</p>
        </div>
        <div className="flex items-center space-x-6 text-slate-600">
          <div className="text-center">
            <span className="block text-3xl font-bold text-indigo-600">{responses.length}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Responses</span>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="text-center">
            <span className="block text-3xl font-bold text-slate-800">
              {responses.length > 0 ? (responses.filter(r => r.respondentName !== 'Anonymous').length / responses.length * 100).toFixed(0) : 0}%
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Non-Anonymous</span>
          </div>
        </div>
      </div>

      <section className="bg-indigo-600 text-white rounded-3xl p-8 shadow-xl shadow-indigo-100 overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-grow max-w-2xl">
            <h2 className="text-2xl font-bold mb-3 flex items-center">
              <i className="fa-solid fa-sparkles mr-3"></i>
              AI Insight Summary
            </h2>
            {summary ? (
              <div className="space-y-4">
                <p className="text-indigo-50 leading-relaxed text-lg">{summary.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/10 rounded-xl p-4">
                    <h4 className="font-bold text-sm mb-2 flex items-center"><i className="fa-solid fa-circle-check text-green-300 mr-2"></i> Strengths</h4>
                    <ul className="text-sm space-y-1">
                      {summary.strengths.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <h4 className="font-bold text-sm mb-2 flex items-center"><i className="fa-solid fa-circle-xmark text-red-300 mr-2"></i> Improvement Areas</h4>
                    <ul className="text-sm space-y-1">
                      {summary.weaknesses.map((w: string, i: number) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-indigo-100">Click the button to generate a detailed AI summary of your feedback results.</p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-center">
            {summary ? (
              <div className="text-center">
                <div className="text-5xl font-extrabold mb-1">{summary.sentimentScore}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-200">Sentiment Score</div>
              </div>
            ) : (
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || responses.length === 0}
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-50 shadow-lg transition-all disabled:opacity-50"
              >
                {isSummarizing ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-wand-sparkles mr-2"></i>}
                Analyze Results
              </button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
      </section>

      {responses.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-20 text-center">
          <i className="fa-solid fa-chart-simple text-5xl text-slate-200 mb-4"></i>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">No responses yet</h2>
          <p className="text-slate-500">Share your form link to start collecting feedback.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {form.questions.map((q) => {
            const data = responses.map(r => r.answers.find(a => a.questionId === q.id)?.value);

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex justify-between">
                  {q.label}
                  <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{q.type}</span>
                </h3>

                {q.type === QuestionType.RATING && (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height={256} minWidth={0}>
                      <BarChart data={[1, 2, 3, 4, 5].map(v => ({ rating: v, count: data.filter(d => d === v).length }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="rating" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {q.type === QuestionType.MULTIPLE_CHOICE && (
                  <div className="h-64 w-full flex flex-col md:flex-row gap-8">
                    <ResponsiveContainer width="100%" height={256} minWidth={0}>
                      <PieChart>
                        <Pie
                          data={q.options?.map(opt => ({ name: opt, value: data.filter(d => d === opt).length }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {q.options?.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {q.type === QuestionType.YES_NO && (
                  <div className="flex gap-4">
                    {['Yes', 'No'].map(val => {
                      const count = data.filter(d => d === val).length;
                      const percentage = responses.length > 0 ? (count / responses.length * 100) : 0;
                      return (
                        <div key={val} className="flex-1 bg-slate-50 p-6 rounded-2xl">
                          <div className="text-slate-500 text-sm font-bold uppercase mb-1">{val}</div>
                          <div className="text-3xl font-extrabold text-slate-800 mb-2">{count}</div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${val === 'Yes' ? 'bg-indigo-500' : 'bg-slate-400'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === QuestionType.TEXT && (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {data.filter(Boolean).map((d, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl text-slate-700 text-sm italic border-l-4 border-indigo-200">
                        "{d}"
                      </div>
                    ))}
                    {data.filter(Boolean).length === 0 && <p className="text-slate-400 text-sm italic">No text responses yet.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Analytics;
