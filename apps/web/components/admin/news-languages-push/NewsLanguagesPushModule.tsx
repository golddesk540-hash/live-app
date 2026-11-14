import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Languages,
  Bell,
  Sparkles,
  Tag,
  Globe2,
  FileText,
  Clock,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  NewsArticleRecord,
  NewsCategoryRecord,
  LanguageRecord,
  TranslationRecord,
  AudienceGroup,
  CampaignRecord,
  NotificationTemplateRecord,
  NewsAdminActivityItem,
  NewsLanguagesPushTab,
  NewsStatus,
} from './newsLanguagesPushTypes';
import {
  INITIAL_NEWS_ARTICLES,
  INITIAL_NEWS_CATEGORIES,
  INITIAL_LANGUAGES,
  INITIAL_TRANSLATIONS,
  INITIAL_AUDIENCE_GROUPS,
  INITIAL_PUSH_CAMPAIGNS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_NEWS_ADMIN_ACTIVITIES,
  computeNewsLanguagesPushMetrics,
} from './mockNewsLanguagesPushData';

import { NewsDashboardView } from './NewsDashboardView';
import { NewsManagementView } from './NewsManagementView';
import { NewsCategoriesView } from './NewsCategoriesView';
import { LanguageManagementView } from './LanguageManagementView';
import { TranslationManagementView } from './TranslationManagementView';
import { PushNotificationDashboardView } from './PushNotificationDashboardView';
import { NotificationCampaignsView } from './NotificationCampaignsView';
import { NotificationTemplatesView } from './NotificationTemplatesView';
import { NewsAdminActivityHistoryView } from './NewsAdminActivityHistoryView';

import { NewsEditorModal } from './NewsEditorModal';
import { NewsPreviewModal } from './NewsPreviewModal';
import { CategoryEditorModal } from './CategoryEditorModal';
import { LanguageDetailsModal } from './LanguageDetailsModal';
import { TranslationEditorModal } from './TranslationEditorModal';
import { CampaignEditorModal } from './CampaignEditorModal';
import { NotificationPreviewModal } from './NotificationPreviewModal';
import { TemplateEditorModal } from './TemplateEditorModal';

interface NewsLanguagesPushModuleProps {
  onLogAdminActivity?: (action: string, details: string, category?: any) => void;
}

export const NewsLanguagesPushModule: React.FC<NewsLanguagesPushModuleProps> = ({
  onLogAdminActivity,
}) => {
  // Master State
  const [activeTab, setActiveTab] = useState<NewsLanguagesPushTab>('dashboard');
  const [articles, setArticles] = useState<NewsArticleRecord[]>(INITIAL_NEWS_ARTICLES);
  const [categories, setCategories] = useState<NewsCategoryRecord[]>(INITIAL_NEWS_CATEGORIES);
  const [languages, setLanguages] = useState<LanguageRecord[]>(INITIAL_LANGUAGES);
  const [translations, setTranslations] = useState<TranslationRecord[]>(INITIAL_TRANSLATIONS);
  const [audienceGroups] = useState<AudienceGroup[]>(INITIAL_AUDIENCE_GROUPS);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(INITIAL_PUSH_CAMPAIGNS);
  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>(INITIAL_NOTIFICATION_TEMPLATES);
  const [activities, setActivities] = useState<NewsAdminActivityItem[]>(INITIAL_NEWS_ADMIN_ACTIVITIES);

  // Selected translation language tab
  const [selectedLangCode, setSelectedLangCode] = useState<string>('ur');

  // Modals state
  const [isNewsEditorOpen, setIsNewsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticleRecord | null>(null);

  const [isPreviewNewsOpen, setIsPreviewNewsOpen] = useState(false);
  const [previewingArticle, setPreviewingArticle] = useState<NewsArticleRecord | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<NewsCategoryRecord | null>(null);

  const [isLangDetailsOpen, setIsLangDetailsOpen] = useState(false);
  const [selectedLanguageForDetails, setSelectedLanguageForDetails] = useState<LanguageRecord | null>(null);

  const [isTranslationEditorOpen, setIsTranslationEditorOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<TranslationRecord | null>(null);

  const [isCampaignEditorOpen, setIsCampaignEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignRecord | null>(null);

  const [isPushPreviewOpen, setIsPushPreviewOpen] = useState(false);
  const [pushPreviewData, setPushPreviewData] = useState<{
    title: string;
    message: string;
    image?: string;
    type?: string;
    languageCode?: string;
    audienceSummary?: string;
  } | null>(null);

  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateRecord | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const logActivity = (
    type: NewsAdminActivityItem['activityType'],
    targetId: string,
    description: string
  ) => {
    const newItem: NewsAdminActivityItem = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      adminName: 'Admin Team (You)',
      activityType: type,
      relatedRecordId: targetId,
      timestamp: 'Just now',
      description,
    };
    setActivities((prev) => [newItem, ...prev]);
    if (onLogAdminActivity) {
      onLogAdminActivity(type, description);
    }
  };

  // Dynamically computed metrics
  const metrics = useMemo(() => {
    return computeNewsLanguagesPushMetrics(articles, languages, campaigns);
  }, [articles, languages, campaigns]);

  // Handlers for News
  const handleSaveArticle = (articleData: Partial<NewsArticleRecord>, isPublish: boolean) => {
    const isEdit = !!articleData.id && articles.some((a) => a.id === articleData.id);
    const targetId = articleData.id || `NEWS-${Date.now().toString().slice(-4)}`;
    const fullArticle: NewsArticleRecord = {
      id: targetId,
      title: articleData.title || 'Untitled Article',
      description: articleData.description || '',
      content: articleData.content || '',
      thumbnail:
        articleData.thumbnail ||
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
      categoryId: articleData.categoryId || 'CAT-ANN',
      categoryName: articleData.categoryName || 'Announcements',
      languageCode: articleData.languageCode || 'en',
      author: articleData.author || 'Admin Team',
      createdAt: articleData.createdAt || new Date().toISOString().split('T')[0],
      publishedAt: isPublish
        ? new Date().toISOString().split('T')[0]
        : articleData.publishedAt || '',
      status: isPublish ? 'Published' : articleData.status || 'Draft',
      viewsCount: articleData.viewsCount || 0,
    };

    if (isEdit) {
      setArticles((prev) => prev.map((a) => (a.id === targetId ? fullArticle : a)));
      logActivity('News Edited', targetId, `Edited article "${fullArticle.title}"`);
      showToast(`Article "${fullArticle.title}" updated successfully.`);
    } else {
      setArticles((prev) => [fullArticle, ...prev]);
      logActivity('News Created', targetId, `Created article "${fullArticle.title}"`);
      showToast(`Article "${fullArticle.title}" published as ${fullArticle.status}.`);
    }
  };

  const handleUpdateNewsStatus = (articleId: string, newStatus: NewsStatus) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, status: newStatus } : a))
    );
    const art = articles.find((a) => a.id === articleId);
    logActivity('News Status Updated', articleId, `Changed status of "${art?.title}" to ${newStatus}`);
    showToast(`Article status updated to ${newStatus}.`);
  };

  const handleDeleteArticle = (articleId: string) => {
    const art = articles.find((a) => a.id === articleId);
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    logActivity('News Edited', articleId, `Deleted article "${art?.title || articleId}"`);
    showToast(`Article ${articleId} removed.`, 'info');
  };

  // Handlers for Categories
  const handleSaveCategory = (savedCategory: NewsCategoryRecord) => {
    const exists = categories.some((c) => c.id === savedCategory.id);
    if (exists) {
      setCategories((prev) => prev.map((c) => (c.id === savedCategory.id ? savedCategory : c)));
      logActivity('Category Updated', savedCategory.id, `Updated category ${savedCategory.name}`);
      showToast(`Category "${savedCategory.name}" updated.`);
    } else {
      setCategories((prev) => [...prev, savedCategory]);
      logActivity('Category Updated', savedCategory.id, `Created new category ${savedCategory.name}`);
      showToast(`New category "${savedCategory.name}" created.`);
    }
  };

  const handleToggleCategoryStatus = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c
      )
    );
  };

  // Handlers for Languages
  const handleToggleLanguageStatus = (langId: string) => {
    setLanguages((prev) =>
      prev.map((l) =>
        l.id === langId ? { ...l, status: l.status === 'Active' ? 'Inactive' : 'Active' } : l
      )
    );
    showToast('Language activation state toggled.');
  };

  // Handlers for Translations
  const handleSaveTranslation = (savedTr: TranslationRecord) => {
    const exists = translations.some((t) => t.id === savedTr.id);
    if (exists) {
      setTranslations((prev) => prev.map((t) => (t.id === savedTr.id ? savedTr : t)));
    } else {
      setTranslations((prev) => [...prev, savedTr]);
    }
    logActivity('Translation Updated', savedTr.key, `Updated translation for ${savedTr.languageCode}`);
    showToast(`Translation for key "${savedTr.key}" saved.`);
  };

  // Handlers for Push Campaigns
  const handleSaveCampaign = (savedCampaign: CampaignRecord, action: 'draft' | 'schedule' | 'send') => {
    const exists = campaigns.some((c) => c.id === savedCampaign.id);
    if (exists) {
      setCampaigns((prev) => prev.map((c) => (c.id === savedCampaign.id ? savedCampaign : c)));
      logActivity('Campaign Created', savedCampaign.id, `Updated campaign "${savedCampaign.title}"`);
    } else {
      setCampaigns((prev) => [savedCampaign, ...prev]);
      logActivity('Campaign Created', savedCampaign.id, `Created campaign "${savedCampaign.title}"`);
    }

    if (action === 'send') {
      showToast(`Demo push sent to ${savedCampaign.audienceSummary}!`);
    } else if (action === 'schedule') {
      showToast(`Push scheduled for ${savedCampaign.scheduledAt}.`);
    } else {
      showToast(`Push draft saved.`);
    }
  };

  const handleCancelCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'Cancelled' } : c))
    );
    logActivity('Campaign Scheduled', campaignId, `Cancelled scheduled campaign ${campaignId}`);
    showToast(`Campaign ${campaignId} cancelled.`, 'info');
  };

  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    showToast(`Campaign ${campaignId} deleted.`, 'info');
  };

  const handleDuplicateCampaign = (cmp: CampaignRecord) => {
    const dup: CampaignRecord = {
      ...cmp,
      id: `CMP-${Date.now().toString().slice(-4)}`,
      title: `${cmp.title} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
      scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16).replace('T', ' '),
      deliveredCount: 0,
      openRatePercentage: 0,
    };
    setCampaigns((prev) => [dup, ...prev]);
    showToast(`Campaign duplicated as ${dup.id}.`);
  };

  // Handlers for Templates
  const handleSaveTemplate = (tpl: NotificationTemplateRecord) => {
    const exists = templates.some((t) => t.id === tpl.id);
    if (exists) {
      setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? tpl : t)));
      logActivity('Template Edited', tpl.id, `Edited template "${tpl.name}"`);
      showToast(`Template "${tpl.name}" updated.`);
    } else {
      setTemplates((prev) => [...prev, tpl]);
      logActivity('Template Edited', tpl.id, `Created template "${tpl.name}"`);
      showToast(`New template "${tpl.name}" created.`);
    }
  };

  const handleUseTemplateAsPush = (tpl: NotificationTemplateRecord) => {
    const newCamp: CampaignRecord = {
      id: `CMP-${Date.now().toString().slice(-4)}`,
      title: tpl.title,
      message: tpl.message,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      type: tpl.type,
      audienceGroups: ['all_users'],
      audienceSummary: 'All Users',
      languageCode: tpl.languageCode,
      createdAt: new Date().toISOString().split('T')[0],
      scheduledAt: new Date(Date.now() + 7200000).toISOString().slice(0, 16).replace('T', ' '),
      status: 'Draft',
      deliveredCount: 0,
      openRatePercentage: 0,
    };
    setEditingCampaign(newCamp);
    setIsCampaignEditorOpen(true);
  };

  // Subnavigation tabs configuration
  const navTabs = [
    { id: 'dashboard' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'news_management' as const, label: 'News Articles', icon: Newspaper, count: articles.length },
    { id: 'news_categories' as const, label: 'Categories', icon: Tag, count: categories.length },
    { id: 'languages' as const, label: 'Languages', icon: Globe2, count: languages.length },
    { id: 'translations' as const, label: 'Translations', icon: Languages, count: translations.length },
    { id: 'push_dashboard' as const, label: 'Push Overview', icon: Bell },
    { id: 'push_campaigns' as const, label: 'Campaigns', icon: Sparkles, count: campaigns.length },
    { id: 'push_templates' as const, label: 'Templates', icon: FileText, count: templates.length },
    { id: 'admin_activity' as const, label: 'Audit Log', icon: Clock },
  ];

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn"
      data-testid="news-languages-push-module"
    >
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'info'
              ? 'bg-slate-800 border border-slate-700 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-200" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Sub-Navigation Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-lg flex items-center gap-1 overflow-x-auto custom-scrollbar">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`news-tab-${tab.id}`}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main View Area */}
      <div>
        {activeTab === 'dashboard' && (
          <NewsDashboardView
            articles={articles}
            languages={languages}
            campaigns={campaigns}
            activities={activities}
            metrics={metrics}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onCreateNews={() => {
              setEditingArticle(null);
              setIsNewsEditorOpen(true);
            }}
            onEditNews={(art) => {
              setEditingArticle(art);
              setIsNewsEditorOpen(true);
            }}
            onPreviewNews={(art) => {
              setPreviewingArticle(art);
              setIsPreviewNewsOpen(true);
            }}
            onCreateCampaign={() => {
              setEditingCampaign(null);
              setIsCampaignEditorOpen(true);
            }}
            onPreviewCampaign={(cmp) => {
              setPushPreviewData(cmp);
              setIsPushPreviewOpen(true);
            }}
          />
        )}

        {activeTab === 'news_management' && (
          <NewsManagementView
            articles={articles}
            categories={categories}
            languages={languages}
            onCreateNews={() => {
              setEditingArticle(null);
              setIsNewsEditorOpen(true);
            }}
            onEditNews={(art) => {
              setEditingArticle(art);
              setIsNewsEditorOpen(true);
            }}
            onPreviewNews={(art) => {
              setPreviewingArticle(art);
              setIsPreviewNewsOpen(true);
            }}
            onUpdateStatus={handleUpdateNewsStatus}
            onDeleteNews={handleDeleteArticle}
          />
        )}

        {activeTab === 'news_categories' && (
          <NewsCategoriesView
            categories={categories}
            onAddCategory={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            onEditCategory={(cat) => {
              setEditingCategory(cat);
              setIsCategoryModalOpen(true);
            }}
            onToggleStatus={handleToggleCategoryStatus}
          />
        )}

        {activeTab === 'languages' && (
          <LanguageManagementView
            languages={languages}
            onOpenDetails={(lang) => {
              setSelectedLanguageForDetails(lang);
              setIsLangDetailsOpen(true);
            }}
            onNavigateTranslations={(langCode) => {
              if (langCode) setSelectedLangCode(langCode);
              setActiveTab('translations');
            }}
            onToggleLanguageStatus={handleToggleLanguageStatus}
          />
        )}

        {activeTab === 'translations' && (
          <TranslationManagementView
            translations={translations}
            languages={languages}
            selectedLanguageCode={selectedLangCode}
            onSelectLanguage={(code) => setSelectedLangCode(code)}
            onEditTranslation={(tr) => {
              setEditingTranslation(tr);
              setIsTranslationEditorOpen(true);
            }}
            onAddTranslation={() => {
              setEditingTranslation(null);
              setIsTranslationEditorOpen(true);
            }}
          />
        )}

        {activeTab === 'push_dashboard' && (
          <PushNotificationDashboardView
            campaigns={campaigns}
            audienceGroups={audienceGroups}
            metrics={metrics}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onCreateCampaign={() => {
              setEditingCampaign(null);
              setIsCampaignEditorOpen(true);
            }}
            onPreviewCampaign={(cmp) => {
              setPushPreviewData(cmp);
              setIsPushPreviewOpen(true);
            }}
          />
        )}

        {activeTab === 'push_campaigns' && (
          <NotificationCampaignsView
            campaigns={campaigns}
            onCreateCampaign={() => {
              setEditingCampaign(null);
              setIsCampaignEditorOpen(true);
            }}
            onEditCampaign={(cmp) => {
              setEditingCampaign(cmp);
              setIsCampaignEditorOpen(true);
            }}
            onPreviewCampaign={(cmp) => {
              setPushPreviewData(cmp);
              setIsPushPreviewOpen(true);
            }}
            onCancelCampaign={handleCancelCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onDuplicateCampaign={handleDuplicateCampaign}
          />
        )}

        {activeTab === 'push_templates' && (
          <NotificationTemplatesView
            templates={templates}
            onAddTemplate={() => {
              setEditingTemplate(null);
              setIsTemplateEditorOpen(true);
            }}
            onEditTemplate={(tpl) => {
              setEditingTemplate(tpl);
              setIsTemplateEditorOpen(true);
            }}
            onUseTemplate={handleUseTemplateAsPush}
            onPreviewTemplate={(tpl) => {
              setPushPreviewData(tpl);
              setIsPushPreviewOpen(true);
            }}
          />
        )}

        {activeTab === 'admin_activity' && (
          <NewsAdminActivityHistoryView activities={activities} />
        )}
      </div>

      {/* MODALS */}
      <NewsEditorModal
        isOpen={isNewsEditorOpen}
        article={editingArticle}
        onClose={() => setIsNewsEditorOpen(false)}
        onSave={handleSaveArticle}
        onOpenPreview={(art) => {
          setPreviewingArticle(art);
          setIsPreviewNewsOpen(true);
        }}
      />

      <NewsPreviewModal
        isOpen={isPreviewNewsOpen}
        article={previewingArticle}
        onClose={() => setIsPreviewNewsOpen(false)}
      />

      <CategoryEditorModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
      />

      <LanguageDetailsModal
        isOpen={isLangDetailsOpen}
        language={selectedLanguageForDetails}
        onClose={() => setIsLangDetailsOpen(false)}
        onEditTranslations={(code) => {
          setSelectedLangCode(code);
          setActiveTab('translations');
        }}
      />

      <TranslationEditorModal
        isOpen={isTranslationEditorOpen}
        translation={editingTranslation}
        languages={languages}
        onClose={() => setIsTranslationEditorOpen(false)}
        onSave={handleSaveTranslation}
      />

      <CampaignEditorModal
        isOpen={isCampaignEditorOpen}
        campaign={editingCampaign}
        audienceGroups={audienceGroups}
        languages={languages}
        onClose={() => setIsCampaignEditorOpen(false)}
        onSave={handleSaveCampaign}
        onPreview={(partialCamp) => {
          setPushPreviewData(partialCamp as any);
          setIsPushPreviewOpen(true);
        }}
      />

      <NotificationPreviewModal
        isOpen={isPushPreviewOpen}
        data={pushPreviewData}
        onClose={() => setIsPushPreviewOpen(false)}
      />

      <TemplateEditorModal
        isOpen={isTemplateEditorOpen}
        template={editingTemplate}
        languages={languages}
        onClose={() => setIsTemplateEditorOpen(false)}
        onSave={handleSaveTemplate}
        onPreview={(data) => {
          setPushPreviewData(data);
          setIsPushPreviewOpen(true);
        }}
      />
    </div>
  );
};
