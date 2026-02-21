import { Form, FormResponse, FormSummary } from '../types';
import { supabase } from './supabaseClient';

export const storageService = {
  getForms: async (): Promise<Form[]> => {
    const { data, error } = await supabase.from('forms').select('*, questions(*)');
    if (error) throw error;

    if (!data) return [];

    return data.map((form: any) => {
      const questionsArray = form.questions || form.Questions || [];
      return {
        id: form.id,
        title: form.title,
        description: form.description,
        createdAt: form.created_at ? new Date(form.created_at).getTime() : Date.now(),
        isPublished: form.is_published ?? form.isPublished ?? false,
        questions: questionsArray.map((q: any) => ({
          id: q.id,
          type: q.type,
          label: q.label,
          required: q.is_required ?? q.required ?? false,
          options: q.options || null
        }))
      } as Form;
    });
  },

  saveForm: async (form: Form) => {
    // 1. Insert/Update the Form
    const { error: formError } = await supabase.from('forms').upsert({
      id: form.id,
      title: form.title,
      description: form.description,
      is_published: form.isPublished,
      created_at: new Date(form.createdAt).toISOString()
    });
    if (formError) throw formError;

    // 2. Clear old questions to prevent duplicates on edit, then insert new ones
    await supabase.from('questions').delete().eq('form_id', form.id);
    
    if (form.questions.length > 0) {
      const questionsData = form.questions.map(q => ({
        id: q.id,
        form_id: form.id,
        type: q.type,
        label: q.label,
        is_required: q.required,
        options: q.options || null
      }));
      const { error: qError } = await supabase.from('questions').insert(questionsData);
      if (qError) throw qError;
    }
  },

  deleteForm: async (id: string) => {
    // PostgreSQL ON DELETE CASCADE handles deleting related questions/responses automatically!
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) throw error;
  },

  getResponsesForForm: async (formId: string): Promise<FormResponse[]> => {
    const { data, error } = await supabase
      .from('form_responses')
      .select('*, answers(*)')
      .eq('form_id', formId);

    if (error) throw error;
    if (!data) return [];

    return data.map((response: any) => ({
      id: response.id,
      formId: response.form_id,
      submittedAt: response.submitted_at ? new Date(response.submitted_at).getTime() : Date.now(),
      respondentName: response.respondent_name || 'Anonymous',
      answers: (response.answers || []).map((ans: any) => ({
        questionId: ans.question_id,
        value: ans.value
      }))
    }));
  },

  saveResponse: async (response: FormResponse) => {
    // 1. Insert the Response record
    const { error: resError } = await supabase.from('form_responses').insert({
      id: response.id,
      form_id: response.formId,
      submitted_at: new Date(response.submittedAt).toISOString(),
      respondent_name: response.respondentName || null
    });
    if (resError) throw resError;

    // 2. Insert all Answers
    if (response.answers.length > 0) {
      const answersData = response.answers.map(ans => ({
        response_id: response.id,
        question_id: ans.questionId,
        value: ans.value
      }));
      const { error: ansError } = await supabase.from('answers').insert(answersData);
      if (ansError) throw ansError;
    }
  },

  saveSummary: async (summary: FormSummary) => {
    const payload = {
      id: summary.id,
      form_id: summary.formId,
      summary: summary.summary,
      strengths: summary.strengths,
      weaknesses: summary.weaknesses,
      sentiment_score: summary.sentimentScore,
      generated_at: new Date(summary.generatedAt).toISOString()
    };
    console.log('Saving summary to form_summaries:', payload);
    const { error, data } = await supabase.from('form_summaries').upsert(payload);
    if (error) {
      console.error('Supabase error details:', error);
      throw new Error(`Failed to save summary: ${error.message}`);
    }
    return data;
  }
};