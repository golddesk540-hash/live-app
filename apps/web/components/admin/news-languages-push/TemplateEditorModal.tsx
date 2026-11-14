import React, { useState, useEffect } from 'react';
import { X, FileText, Sparkles, Eye, Bell } from 'lucide-react';
import {
  NotificationTemplateRecord,
  PushNotificationType,
  LanguageRecord,
} from './newsLanguagesPushTypes';

interface TemplateEditorModalProps {
  isOpen: boolean;
  template: NotificationTemplateRecord | null;
  languages: LanguageRecord[];
  onClose: () => void;
  onSave: (template: NotificationTemplateRecord) => void;
  onPreview?: (data: { title: string; message: string; type: string }) => void;
}

const NOTIFICATION_TYPES: PushNotificationType[] = [
  'General Announcement',
  'News Update',
  'Event Notification',
  'Promotional Notification',
  'Important Notice',
];

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  template,
  languages,
  onClose,
  onSave,
  onPreview,
}) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<PushNotificationType>('General Announcement');
  const [languageCode, setLanguageCode] = useState('en');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (template) {
      setName(template.name);
      setTitle(template.title);
      setMessage(template.message);
      setType(template.type);
      setLanguageCode(template.languageCode);
    } else {
      setName('');
      setTitle('');
      setMessage('');
      setType('General Announcement');
      setLanguageCode('en');
    }
    setErrors({});
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'Template name is required';
    if (!title.trim()) newErrors.title = 'Title template is required';
    if (!message.trim()) newErrors.message = 'Message body template is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const savedRecord: NotificationTemplateRecord = {
      id: template ? template.id : `TPL-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      title: title.trim(),
      message: message.trim(),
      type,
      languageCode,
      lastUsed: new Date().toISOString().split('T')[0],
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      data-testid="template-editor-modal"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {template ? 'Edit Notification Template' : 'Create Notification Template'}
              </h2>
              <p className="text-xs text-slate-400">Save reusable push messaging copy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Welcome Notification, Level-Up Alert"
              className={`w-full px-3.5 py-2.5 bg-slate-800 border ${
                errors.name ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm`}
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PushNotificationType)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Language
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notification Title Template *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🎁 Welcome to Popo Live, {{username}}!"
              className={`w-full px-3.5 py-2.5 bg-slate-800 border ${
                errors.title ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm`}
            />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notification Message Template *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Claim your daily check-in rewards and start exploring live rooms now!"
              className={`w-full px-3.5 py-2.5 bg-slate-800 border ${
                errors.message ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm resize-none`}
            />
            {errors.message && <p className="text-xs text-rose-400 mt-1">{errors.message}</p>}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {onPreview && (
              <button
                type="button"
                onClick={() => onPreview({ title, message, type })}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 transition-all"
              >
                Save Template
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
