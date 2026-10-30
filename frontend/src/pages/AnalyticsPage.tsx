import React, { useState, useEffect } from 'react';
import {
  MessageSquare, CheckCircle2, XCircle, AlertTriangle,
  ThumbsUp, ThumbsDown, Clock, RefreshCw, BarChart2,
  AlertOctagon
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, CartesianGrid, Cell
} from 'recharts';
import { apiClient } from '../api/client';
import type { StatsResponsePayload } from '../api/types';
import { VerdictBadge } from '../components/VerdictBadge';
import { CategoryBadge } from '../components/CategoryBadge';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsResponsePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableCategoryFilter, setTableCategoryFilter] = useState('All');
  const [tableSearchFilter, setTableSearchFilter] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<StatsResponsePayload>('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Filtered answered down conversations
  const filteredDownConversations = (stats?.answered_down_conversations || []).filter((conv) => {
    const matchesCat =
      tableCategoryFilter === 'All' ||
      (conv.category && conv.category.toLowerCase() === tableCategoryFilter.toLowerCase());
    const matchesSearch =
      !tableSearchFilter.trim() ||
      conv.question.toLowerCase().includes(tableSearchFilter.toLowerCase()) ||
      conv.answer.toLowerCase().includes(tableSearchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Real-Time AI Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real performance telemetry calculated directly from live database conversation records.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading && !stats ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center text-slate-400 text-sm">
          <span className="w-4 h-4 rounded-full bg-emerald-500 inline-block animate-ping mr-2" />
          Aggregating telemetry from database...
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Total Conversations */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Queries</span>
                <MessageSquare size={16} className="text-slate-400" />
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {stats.summary.total_conversations}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Logged sessions</span>
            </div>

            {/* Answered */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-xs font-semibold">Answered</span>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 tracking-tight">
                {stats.summary.total_answered}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">High-confidence FAQ</span>
            </div>

            {/* Unclear */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-xs font-semibold">Unclear</span>
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 tracking-tight">
                {stats.summary.total_unclear}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Ambiguous / Low-conf</span>
            </div>

            {/* Refused */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <span className="text-xs font-semibold">Refused</span>
                <XCircle size={16} className="text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 tracking-tight">
                {stats.summary.total_refused}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Out-of-scope queries</span>
            </div>

            {/* Positive Feedback */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-xs font-semibold">Thumbs Up</span>
                <ThumbsUp size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {stats.summary.total_positive}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Helpful answers</span>
            </div>

            {/* Negative Feedback */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <span className="text-xs font-semibold">Thumbs Down</span>
                <ThumbsDown size={16} className="text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 tracking-tight">
                {stats.summary.total_negative}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">Needs review</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Verdict distribution by category */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    1. Verdict Distribution by Category
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Breakdown of Answered, Unclear, and Refused verdicts across domains.
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                {stats.verdict_by_category.some((c) => c.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.verdict_by_category}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="answered" name="Answered" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="unclear" name="Unclear" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="refused" name="Refused" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No conversation records recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Average response time by category */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    2. Average Response Time by Category (ms)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    End-to-end TF-IDF matching and retrieval latency in milliseconds.
                  </p>
                </div>
                <Clock size={16} className="text-slate-500" />
              </div>

              <div className="h-64 w-full">
                {stats.response_time_by_category.some((c) => c.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.response_time_by_category}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} unit="ms" />
                      <Tooltip
                        formatter={(val: any) => [`${val} ms`, 'Avg Latency']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          fontSize: '11px',
                        }}
                      />
                      <Bar
                        dataKey="avg_response_time_ms"
                        name="Avg Latency (ms)"
                        fill="#38bdf8"
                        radius={[6, 6, 0, 0]}
                      >
                        {stats.response_time_by_category.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={['#38bdf8', '#818cf8', '#a78bfa', '#34d399'][index % 4]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No category response times recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart 3 & Review Highlight: Answered conversations receiving thumbs-down */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertOctagon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    3. Quality Audit: Answered Queries Rated Thumbs-Down
                  </h3>
                  <p className="text-xs text-slate-400">
                    Critical review table: identifies conversations marked 'Answered' where the user down-voted the result.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={tableCategoryFilter}
                  onChange={(e) => setTableCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Courses">Courses</option>
                  <option value="Certificates">Certificates</option>
                  <option value="Jobs">Jobs</option>
                  <option value="Account">Account</option>
                </select>

                <input
                  type="text"
                  value={tableSearchFilter}
                  onChange={(e) => setTableSearchFilter(e.target.value)}
                  placeholder="Filter question/answer..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
                />
              </div>
            </div>

            {/* Down-voted Answered Table */}
            {filteredDownConversations.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-semibold text-slate-200">
                  No Down-Voted Answered Queries Found
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {stats.answered_down_conversations.length === 0
                    ? 'All answered conversations currently hold positive or neutral user feedback. Great job!'
                    : 'No records match the active filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-950/40">
                      <th className="py-3 px-3 w-16">ID</th>
                      <th className="py-3 px-3">User Question</th>
                      <th className="py-3 px-3">Generated Answer</th>
                      <th className="py-3 px-3 w-28">Category</th>
                      <th className="py-3 px-3 w-24">Verdict</th>
                      <th className="py-3 px-3 w-20">Latency</th>
                      <th className="py-3 px-3 w-20">Rating</th>
                      <th className="py-3 px-3 w-28">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredDownConversations.map((conv) => (
                      <tr key={conv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">#{conv.id}</td>
                        <td className="py-3 px-3 font-medium text-slate-100 max-w-xs leading-relaxed">
                          {conv.question}
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-sm leading-relaxed">
                          {conv.answer}
                        </td>
                        <td className="py-3 px-3">
                          <CategoryBadge category={conv.category} size="sm" />
                        </td>
                        <td className="py-3 px-3">
                          <VerdictBadge verdict={conv.verdict} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {conv.response_time_ms} ms
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
                            <ThumbsDown size={11} />
                            Down
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {new Date(conv.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
