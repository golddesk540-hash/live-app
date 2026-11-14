import React, { useState, useEffect } from 'react';
import {
  X,
  Newspaper,
  Image,
  Tag,
  Globe,
  Calendar,
  User,
  Save,
  Send,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  NewsArticleRecord,
  NewsCategoryName,
  NewsStatus,
} from './newsLanguagesPushTypes';

interface NewsEditorModalProps {
  article: NewsArticleRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (articleData: Partial<NewsArticleRecord>, isPublish: boolean) => void;
  onOpenPreview?: (article: NewsArticleRecord) => void;
}

export const NewsEditorModal: React.FC<NewsEditorModalProps> = ({
  article,
  isOpen,
  onClose,
  onSave,
  onOpenPreview,
}) => {
  const isEdit = !!article;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [categoryName, setCategoryName] = useState<NewsCategoryName>('Announcements');
  const [languageCode, setLanguageCode] = useState('en');
  const [author, setAuthor] = useState('Admin_Sarah');
  const [status, setStatus] = useState<NewsStatus>('Draft');
  const [publishedAt, setPublishedAt] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setDescription(article.description);
      setContent(article.content);
      setThumbnail(article.thumbnail);
      setCategoryName(article.categoryName);
      setLanguageCode(article.languageCode);
      setAuthor(article.author);
      setStatus(article.status);
      setPublishedAt(article.publishedAt || '');
    } else {
      setTitle('');
      setDescription('');
      setContent('');
      setThumbnail('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80');
      setCategoryName('Announcements');
      setLanguageCode('en');
      setAuthor('Admin_Sarah');
      setStatus('Draft');
      setPublishedAt(new Date().toISOString().split('T')[0]);
    }
    setErrorMsg(null);
  }, [article, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    if (!title.trim()) {
      setErrorMsg('News article title is required.');
      return false;
    }
    if (!description.trim()) {
      setErrorMsg('Short summary description is required.');
      return false;
    }
    if (!content.trim()) {
      setErrorMsg('Full news article content cannot be empty.');
      return false;
    }
    if (!thumbnail.trim()) {
      setErrorMsg('A valid thumbnail image URL is required.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    onSave(
      {
        id: article ? article.id : `NEWS-${Date.now().toString().slice(-4)}`,
        title,
        description,
        content,
        thumbnail,
        categoryId: categoryName === 'Events' ? 'CAT-EVT' : 'CAT-ANN',
        categoryName,
        languageCode,
        author,
        status: 'Draft',
        createdAt: article?.createdAt || new Date().toISOString().split('T')[0],
        publishedAt: '',
        viewsCount: article?.viewsCount || 0,
      },
      false
    );
    onClose();
  };

  const handlePublish = () => {
    if (!validate()) return;
    const today = new Date().toISOString().split('T')[0];
    onSave(
      {
        id: article ? article.id : `NEWS-${Date.now().toString().slice(-4)}`,
        title,
        description,
        content,
        thumbnail,
        categoryId: categoryName === 'Events' ? 'CAT-EVT' : 'CAT-ANN',
        categoryName,
        languageCode,
        author,
        status: status === 'Scheduled' ? 'Scheduled' : 'Published',
        createdAt: article?.createdAt || today,
        publishedAt: publishedAt || today,
        viewsCount: article?.viewsCount || 0,
      },
      true
    );
    onClose();
  };

  const handlePreview = () => {
    if (!validate()) return;
    const tempArticle: NewsArticleRecord = {
      id: article ? article.id : 'PREVIEW-TEMP',
      title,
      description,
      content,
      thumbnail,
      categoryId: 'CAT-ANN',
      categoryName,
      languageCode,
      author,
      status,
      createdAt: new Date().toISOString().split('T')[0],
      publishedAt: publishedAt || new Date().toISOString().split('T')[0],
      viewsCount: 0,
    };
    if (onOpenPreview) {
      onOpenPreview(tempArticle);
    }
  };

  const categories: NewsCategoryName[] = [
    'Announcements',
    'Events',
    'Updates',
    'Community',
    'Promotions',
    'Important Notices',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto"
      data-testid="news-editor-modal"
    >
      <div className="relative w-full max-w-2xl bg-[#17082e] border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/70 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300">
              <Newspaper className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isEdit ? `Edit News Article (#${article.id})` : 'Create New News Article'}
              </h3>
              <p className="text-xs text-purple-300">
                {isEdit ? 'Update published or draft news details' : 'Draft official platform announcement or event story'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl mb-4 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Article Title */}
          <div>
            <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1.5">
              Article Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New Event Launch 🎉"
              className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1.5">
              Short Summary Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="One or two sentences summarizing the news for preview cards..."
              className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Category & Language Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-pink-400" />
                Category *
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value as NewsCategoryName)}
                className="w-full px-3 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-pink-400" />
                Language *
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="en">English (en)</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="ar">Arabic (العربية)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
            </div>
          </div>

          {/* Full Content */}
          <div>
            <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1.5">
              Full News Body Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Write the full news story, event guidelines, or feature release notes..."
              className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500 leading-relaxed custom-scrollbar"
            />
          </div>

          {/* Thumbnail Image URL & Live Preview */}
          <div>
            <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-pink-400" />
              Thumbnail Image URL *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500"
              />
              <button
                type="button"
                onClick={() =>
                  setThumbnail('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80')
                }
                className="px-3 py-2 bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 rounded-xl font-medium transition cursor-pointer"
              >
                Sample Image
              </button>
            </div>
            {thumbnail && (
              <div className="mt-2 h-28 w-full max-w-xs rounded-xl overflow-hidden border border-purple-500/25 relative">
                <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Publication Status & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-purple-500/15">
            <div>
              <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as NewsStatus)}
                className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-purple-300 uppercase tracking-wider font-semibold mb-1">
                Publish Date
              </label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-5 border-t border-purple-500/20 mt-6 gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 font-semibold text-xs transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-pink-400" />
            Preview Layout
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-purple-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-white font-medium text-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg shadow-pink-500/20 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Publish Demo News
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
