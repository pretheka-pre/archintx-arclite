import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, X, Check, AlertCircle, Sparkles, Filter, Database } from 'lucide-react';
import { apiClient } from '../api/client';
import type { FAQItem, FAQCategory, FAQCreatePayload, FAQUpdatePayload } from '../api/types';
import { CategoryBadge } from '../components/CategoryBadge';

const CATEGORIES: FAQCategory[] = ['Courses', 'Certificates', 'Jobs', 'Account'];

export const FaqManagement: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [formCategory, setFormCategory] = useState<FAQCategory>('Courses');
  const [formKeywords, setFormKeywords] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deletingFaq, setDeletingFaq] = useState<FAQItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiClient.get<FAQItem[]>('/admin/faq', { params });
      setFaqs(response.data);
    } catch (err) {
      console.error('Failed to fetch FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFaqs();
  };

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormCategory('Courses');
    setFormKeywords('');
    setFormAnswer('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FAQItem) => {
    setEditingFaq(faq);
    setFormCategory((faq.category as FAQCategory) || 'Courses');
    setFormKeywords(faq.keywords);
    setFormAnswer(faq.canonical_answer);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formKeywords.trim() || !formAnswer.trim()) {
      setFormError('Both trigger keywords and the canonical answer are required.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingFaq) {
        const payload: FAQUpdatePayload = {
          category: formCategory,
          keywords: formKeywords.trim(),
          canonical_answer: formAnswer.trim(),
        };
        await apiClient.put(`/admin/faq/${editingFaq.id}`, payload);
      } else {
        const payload: FAQCreatePayload = {
          category: formCategory,
          keywords: formKeywords.trim(),
          canonical_answer: formAnswer.trim(),
        };
        await apiClient.post('/admin/faq', payload);
      }

      setIsModalOpen(false);
      await fetchFaqs();
    } catch (err: any) {
      console.error('Save FAQ error:', err);
      setFormError(err.response?.data?.detail || 'Failed to save FAQ entry.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteFaq = async () => {
    if (!deletingFaq) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/faq/${deletingFaq.id}`);
      setDeletingFaq(null);
      await fetchFaqs();
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">FAQ Knowledge Base</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage canonical answers and TF-IDF trigger keywords. Updates apply immediately to live chatbot matching.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all self-start md:self-auto"
        >
          <Plus size={16} />
          <span>Add New FAQ Entry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter size={12} />
            Category:
          </span>
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords or answers..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
        </form>
      </div>

      {/* FAQ Entries Table / List */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
          <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block animate-ping mr-2" />
          Loading verified FAQ entries...
        </div>
      ) : faqs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No FAQ entries found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria or category filter.'
              : 'Add your first FAQ entry to populate the knowledge engine.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  <th className="py-3.5 px-4 w-16">ID</th>
                  <th className="py-3.5 px-4 w-32">Category</th>
                  <th className="py-3.5 px-4">Trigger Keywords</th>
                  <th className="py-3.5 px-4">Canonical Answer</th>
                  <th className="py-3.5 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">#{faq.id}</td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={faq.category} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs sm:max-w-sm">
                        {faq.keywords.split(' ').map((kw, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700/50"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 leading-relaxed max-w-md">
                      {faq.canonical_answer}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(faq)}
                          title="Edit FAQ"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingFaq(faq)}
                          title="Delete FAQ"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingFaq ? `Edit FAQ #${editingFaq.id}` : 'Create New FAQ Entry'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3.5 py-2.5 rounded-xl text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as FAQCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Trigger Keywords (Space-separated search terms & variants)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="e.g. enroll registration sign up join class fee tuition"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  These terms are indexed by the TF-IDF vectorizer to match incoming user questions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Canonical Answer (Exact verified text returned to users)
                </label>
                <textarea
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  rows={4}
                  placeholder="Provide the exact, authoritative answer..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Check size={14} />
                  <span>{formSubmitting ? 'Saving...' : editingFaq ? 'Save Changes' : 'Create FAQ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={18} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Delete FAQ Entry?</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to delete FAQ #{deletingFaq.id} ({deletingFaq.category})? This will immediately remove it from AI matching.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingFaq(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFaq}
                disabled={deleteLoading}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-bold text-xs transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
