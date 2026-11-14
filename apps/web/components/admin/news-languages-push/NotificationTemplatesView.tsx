import React from 'react';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Send,
  Sparkles,
  Calendar,
  Globe2,
} from 'lucide-react';
import { NotificationTemplateRecord } from './newsLanguagesPushTypes';

interface NotificationTemplatesViewProps {
  templates: NotificationTemplateRecord[];
  onAddTemplate: () => void;
  onEditTemplate: (template: NotificationTemplateRecord) => void;
  onUseTemplate: (template: NotificationTemplateRecord) => void;
  onPreviewTemplate: (template: NotificationTemplateRecord) => void;
}

export const NotificationTemplatesView: React.FC<NotificationTemplatesViewProps> = ({
  templates,
  onAddTemplate,
  onEditTemplate,
  onUseTemplate,
  onPreviewTemplate,
}) => {
  return (
    <div className="space-y-6" data-testid="notification-templates-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Push Notification Templates</h2>
          <p className="text-xs text-slate-400">
            Standardized messaging blueprints for rapid marketing and transactional communications
          </p>
        </div>
        <button
          onClick={onAddTemplate}
          data-testid="add-template-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-lg group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-700 text-purple-300">
                  {tpl.type}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{tpl.languageCode.toUpperCase()}</span>
                </span>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                {tpl.name}
              </h3>
              <div className="p-3 my-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-xs font-semibold text-slate-200">{tpl.title}</div>
                <div className="text-xs text-slate-400 line-clamp-2">{tpl.message}</div>
              </div>
              <div className="text-[10px] text-slate-500">
                Last used: {tpl.lastUsed} • ID: <span className="font-mono">{tpl.id}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between">
              <button
                onClick={() => onPreviewTemplate(tpl)}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Preview</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUseTemplate(tpl)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/20 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Use as Push</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
