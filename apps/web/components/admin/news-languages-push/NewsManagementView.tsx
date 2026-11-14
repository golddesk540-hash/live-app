import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Globe2,
  Tag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Archive,
  RefreshCw,
} from 'lucide-react';
import {
  NewsArticleRecord,
  NewsCategoryRecord,
  LanguageRecord,
  NewsStatus,
} from './newsLanguagesPushTypes';
import { NewsLanguagesPushEmptyStates } from './NewsLanguagesPushEmptyStates';

interface NewsManagementViewProps {
  articles: NewsArticleRecord[];
  categories: NewsCategoryRecord[];
  languages: LanguageRecord[];
  onCreateNews: () => void;
  onEditNews: (article: NewsArticleRecord) => void;
  onPreviewNews: (article: NewsArticleRecord) => void;
  onUpdateStatus: (articleId: string, status: NewsStatus) => void;
  onDeleteNews: (articleId: string) => void;
}

export const NewsManagementView: React.FC<NewsManagementViewProps> = ({
  articles,
  categories,
  languages,
  onCreateNews,
  onEditNews,
  onPreviewNews,
  onUpdateStatus,
  onDeleteNews,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [languageFilter, setLanguageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    return articles
      .filter((art) => {
        const matchesSearch =
          art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCat = categoryFilter === 'ALL' || art.categoryName === categoryFilter;
        const matchesLang = languageFilter === 'ALL' || art.languageCode === languageFilter;
        const matchesStatus = statusFilter === 'ALL' || art.status === statusFilter;

        return matchesSearch && matchesCat && matchesLang && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'date') {
          diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'views') {
          diff = b.viewsCount - a.viewsCount;
        } else if (sortBy === 'title') {
          diff = a.title.localeCompare(b.title);
        }
        return sortOrder === 'asc' ? -diff : diff;
      });
  }, [articles, searchQuery, categoryFilter, languageFilter, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage) || 1;
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: NewsStatus) => {
    switch (status) {
      case 'Published':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Published
          </span>
        );
      case 'Draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Draft
          </span>
        );
      case 'Scheduled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Scheduled
          </span>
        );
      case 'Archived':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300 border border-slate-600">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="news-management-view">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">News Articles Directory</h2>
          <p className="text-xs text-slate-400">
            Manage in-app publications, release announcements and translations ({articles.length} articles)
          </p>
        </div>
        <button
          onClick={onCreateNews}
          data-testid="mgmt-create-news-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Search, Filter Bar & View Controls */}
      <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, author, description, or ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
          >
            <option value="ALL">All Languages</option>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name} ({l.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Layout Mode Toggles */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Filter Chips & Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div>
            Showing <span className="font-semibold text-white">{filteredArticles.length}</span> of{' '}
            <span className="font-semibold text-white">{articles.length}</span> articles
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-pink-400" />
              <span>Sort: {sortBy.toUpperCase()} ({sortOrder.toUpperCase()})</span>
            </button>
            {(searchQuery || categoryFilter !== 'ALL' || languageFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setLanguageFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-pink-400 hover:text-pink-300 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Rendering: Table or Grid */}
      {filteredArticles.length === 0 ? (
        <NewsLanguagesPushEmptyStates
          kind={articles.length === 0 ? 'no_news' : 'no_search_results'}
          onAction={onCreateNews}
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="news-management-table">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Language</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {paginatedArticles.map((art) => {
                  const lang = languages.find((l) => l.code === art.languageCode);
                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-slate-700/30 transition-colors group"
                    >
                      {/* Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-900">
                            <img
                              src={art.thumbnail}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white group-hover:text-pink-400 transition-colors truncate max-w-xs md:max-w-md">
                              {art.title}
                            </div>
                            <div className="text-xs text-slate-400 truncate max-w-xs md:max-w-md">
                              {art.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/60 border border-slate-700 text-slate-300">
                          {art.categoryName}
                        </span>
                      </td>

                      {/* Language */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                          <span>{lang?.flag || '🌐'}</span>
                          <span>{art.languageCode.toUpperCase()}</span>
                        </span>
                      </td>

                      {/* Author */}
                      <td className="py-3 px-4 text-xs text-slate-300 font-medium">
                        {art.author}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {art.publishedAt || art.createdAt}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(art.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPreviewNews(art)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                            title="Preview Article"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditNews(art)}
                            className="p-1.5 rounded-lg text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 transition-colors"
                            title="Edit Article"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {art.status === 'Draft' ? (
                            <button
                              onClick={() => onUpdateStatus(art.id, 'Published')}
                              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                              title="Publish Immediately"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateStatus(art.id, 'Archived')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                              title="Archive Article"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteNews(art.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="news-management-grid">
          {paginatedArticles.map((art) => (
            <div
              key={art.id}
              className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group hover:border-pink-500/50 transition-all"
            >
              <div>
                <div className="relative h-36 w-full bg-slate-900">
                  <img
                    src={art.thumbnail}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white border border-slate-700">
                      {art.categoryName}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(art.status)}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{art.publishedAt || art.createdAt}</span>
                    <span className="text-pink-400">{art.author}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {art.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={() => onPreviewNews(art)}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-pink-400" />
                  <span>Preview</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditNews(art)}
                    className="p-1.5 rounded-lg text-pink-400 hover:bg-pink-500/10"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteNews(art.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/70 rounded-2xl text-xs">
          <span className="text-slate-400">
            Page <span className="font-bold text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-white">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
