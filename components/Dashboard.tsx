import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService'; // Ensure this path is correct
import { Form, User } from '../types';

interface DashboardProps {
  user: User | null;
}

export default function Dashboard({ user }: DashboardProps) {
  // 1. Create a state to hold the forms (defaults to an empty array)
  const [forms, setForms] = useState<Form[]>([]);
  // 2. Create a loading state
  const [isLoading, setIsLoading] = useState(true);

  // modal state must be declared before any early returns to keep hooks order stable
  const [modal, setModal] = useState<{ type: 'delete' | 'login' | 'share' | null; form?: Form; formId?: string; shareUrl?: string }>({ type: null });

  const navigate = useNavigate();

  // 3. Use useEffect to fetch data asynchronously when the component loads
  useEffect(() => {
    const loadForms = async () => {
      try {
        const data = await storageService.getForms();
        setForms(data); // This updates the state with the real array once it arrives
      } catch (error) {
        console.error("Failed to fetch forms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadForms();
  }, []); // The empty array ensures this only runs once when the dashboard opens

  // 4. Prevent mapping if it's still loading
  if (isLoading) {
    return <div className="text-slate-600">Loading your forms...</div>;
  }

  const formatDate = (ts: number) => {
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const handleShare = async (form: Form) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/form/${form.id}`;
    setModal({ type: 'share', form, shareUrl });
  };

  const handleEdit = (form: Form) => {
    if (!user) {
      // show modal prompting to login
      setModal({ type: 'login', form });
      return;
    }
    navigate(`/edit/${form.id}`);
  };

  const handleDelete = async (formId: string) => {
    // open confirmation modal
    setModal({ type: 'delete', formId });
  };


  const confirmDelete = async () => {
    if (!modal.formId) return;
    try {
      await storageService.deleteForm(modal.formId);
      setForms((prev) => prev.filter((f) => f.id !== modal.formId));
      setModal({ type: null });
    } catch (err) {
      console.error('Failed to delete form', err);
      alert('Failed to delete form. See console for details.');
    }
  };

  const cancelModal = () => setModal({ type: null });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your Feedback Forms</h1>
          <p className="text-sm text-slate-500">Manage and analyze the feedback you've collected</p>
        </div>

        {user ? (
          <Link
            to="/create"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Create New Form
          </Link>
        ) : null}
      </div>

      {forms.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">No forms yet</h2>
          <p className="text-sm text-slate-500 mb-4">Create a form to start collecting feedback from your audience.</p>
          {user ? (
            <Link to="/create" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Create Your First Form
            </Link>
          ) : (
            <p className="text-sm text-slate-400">Sign in to create forms.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-2xl border p-4 flex flex-col justify-between relative overflow-hidden">
              {/* Top-left badge */}
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${form.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {form.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Top-right action icons */}
              <div className="absolute top-3 right-3 flex items-center gap-3 text-slate-400">
                <button onClick={() => handleShare(form)} title="Share" className="hover:text-slate-600">
                  <i className="fa-solid fa-share-nodes"></i>
                </button>
                <button onClick={() => handleEdit(form)} title="Edit" className="hover:text-slate-600">
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button onClick={() => handleDelete(form.id)} title="Delete" className="hover:text-red-500">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>

              <div className="pt-6">
                <h3 className="text-lg font-semibold text-slate-800 truncate max-w-[85%]">{form.title || 'Untitled Form'}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-2">{form.description || 'No description'}</p>

                <div className="mt-4 text-xs text-slate-400 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <i className="fa-regular fa-calendar text-sm"></i>
                    <span>{formatDate(form.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-list-ul text-sm"></i>
                    <span>{form.questions?.length ?? 0} Questions</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Link to={`/form/${form.id}`} className="flex-1 text-sm px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-center hover:bg-slate-50">
                  View
                </Link>
                <Link to={`/analytics/${form.id}`} className="flex-1 text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white text-center hover:bg-indigo-700">
                  Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal overlay for delete confirmation, login prompt, and share options */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            {modal.type === 'delete' && (
              <div>
                <h3 className="text-xl font-bold mb-2">Delete form</h3>
                <p className="text-sm text-slate-600 mb-4">Are you sure you want to delete this form? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={cancelModal} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white">Delete</button>
                </div>
              </div>
            )}

            {modal.type === 'login' && (
              <div>
                <h3 className="text-xl font-bold mb-2">Sign in required</h3>
                <p className="text-sm text-slate-600 mb-4">You need to be signed in to edit forms. Click below to return to the dashboard and sign in.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={cancelModal} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button onClick={() => { setModal({ type: null }); navigate('/'); }} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Go to Login</button>
                </div>
              </div>
            )}

            {modal.type === 'share' && (
              <div>
                <h3 className="text-xl font-bold mb-1">Share Form</h3>
                <p className="text-xs text-slate-500 mb-4">Choose how to share this form</p>

                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      if (!modal.shareUrl) return;
                      try {
                        await navigator.clipboard.writeText(modal.shareUrl);
                        alert('Link copied to clipboard!');
                        cancelModal();
                      } catch (err) {
                        alert(modal.shareUrl);
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <i className="fa-solid fa-copy text-indigo-600 w-5"></i>
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">Copy Link</div>
                      <div className="text-xs text-slate-500">Copy the shareable link</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (!modal.shareUrl) return;
                      const subject = `Check out my feedback form: ${modal.form?.title}`;
                      const body = `I'd like to get your feedback. Please fill out this form: ${modal.shareUrl}`;
                      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      cancelModal();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <i className="fa-solid fa-envelope text-blue-600 w-5"></i>
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">Email</div>
                      <div className="text-xs text-slate-500">Send via email</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (!modal.shareUrl) return;
                      const text = `Check out my feedback form: ${modal.form?.title} ${modal.shareUrl}`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                      cancelModal();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <i className="fa-brands fa-twitter text-sky-500 w-5"></i>
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">Twitter</div>
                      <div className="text-xs text-slate-500">Share on Twitter</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (!modal.shareUrl) return;
                      const text = `Check out my feedback form: ${modal.form?.title} ${modal.shareUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      cancelModal();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <i className="fa-brands fa-whatsapp text-green-500 w-5"></i>
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">WhatsApp</div>
                      <div className="text-xs text-slate-500">Share on WhatsApp</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (!modal.shareUrl) return;
                      const text = `Check out my feedback form: ${modal.form?.title}`;
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(modal.shareUrl)}`, '_blank');
                      cancelModal();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <i className="fa-brands fa-facebook text-blue-700 w-5"></i>
                    <div className="text-left">
                      <div className="font-semibold text-slate-800">Facebook</div>
                      <div className="text-xs text-slate-500">Share on Facebook</div>
                    </div>
                  </button>
                </div>

                <button onClick={cancelModal} className="w-full mt-4 px-4 py-2 rounded-lg border">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}