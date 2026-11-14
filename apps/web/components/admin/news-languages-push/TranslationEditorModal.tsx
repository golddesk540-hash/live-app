import React, { useState, useEffect } from 'react';
import { X, Languages, Globe2, Sparkles, Check } from 'lucide-react';
import { TranslationRecord, LanguageRecord, TranslationStatus } from './newsLanguagesPushTypes';

interface TranslationEditorModalProps {
  isOpen: boolean;
  translation: TranslationRecord | null;
  languages: LanguageRecord[];
  onClose: () => void;
  onSave: (translation: TranslationRecord) => void;
}

export const TranslationEditorModal: React.FC<TranslationEditorModalProps> = ({
  isOpen,
  translation,
  languages,
  onClose,
  onSave,
}) => {
  const [key, setKey] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [languageCode, setLanguageCode] = useState('ur');
  const [status, setStatus] = useState<TranslationStatus>('Completed');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (translation) {
      setKey(translation.key);
      setSourceText(translation.sourceText);
      setTranslatedText(translation.translatedText);
      setLanguageCode(translation.languageCode);
      setStatus(translation.status);
    } else {
      setKey('');
      setSourceText('');
      setTranslatedText('');
      setLanguageCode('ur');
      setStatus('Needs Review');
    }
    setErrors({});
  }, [translation, isOpen]);

  if (!isOpen) return null;

  const currentLang = languages.find((l) => l.code === languageCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!key.trim()) newErrors.key = 'Translation key is required';
    if (!sourceText.trim()) newErrors.sourceText = 'Source text is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const calculatedStatus: TranslationStatus = !translatedText.trim()
      ? 'Missing'
      : status === 'Missing'
      ? 'Completed'
      : status;

    const savedRecord: TranslationRecord = {
      id: translation ? translation.id : `TR-${Date.now().toString().slice(-4)}`,
      key: key.trim(),
      sourceText: sourceText.trim(),
      translatedText: translatedText.trim(),
      languageCode,
      status: calculatedStatus,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      data-testid="translation-editor-modal"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {translation ? 'Edit Translation String' : 'Add Translation String'}
              </h2>
              <p className="text-xs text-slate-400">
                Localize UI keys for {currentLang?.name || languageCode}
              </p>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Language
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                disabled={!!translation}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-70"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TranslationStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="Completed">Completed</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Missing">Missing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              String Key *
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. live.stream.title, profile.edit.name"
              disabled={!!translation}
              className={`w-full px-3.5 py-2 font-mono text-xs bg-slate-800 border ${
                errors.key ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-75`}
            />
            {errors.key && <p className="text-xs text-rose-400 mt-1">{errors.key}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              English Source (en) *
            </label>
            <textarea
              rows={2}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Original English text string..."
              className={`w-full px-3.5 py-2 bg-slate-800 border ${
                errors.sourceText ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm resize-none`}
            />
            {errors.sourceText && <p className="text-xs text-rose-400 mt-1">{errors.sourceText}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Translated Text ({currentLang?.name || languageCode})
              </label>
              {languageCode === 'ur' || languageCode === 'ar' ? (
                <span className="text-[10px] text-amber-400 font-medium">RTL script layout</span>
              ) : null}
            </div>
            <textarea
              rows={3}
              value={translatedText}
              onChange={(e) => {
                setTranslatedText(e.target.value);
                if (status === 'Missing' && e.target.value.trim()) {
                  setStatus('Completed');
                }
              }}
              placeholder={`Enter translation in ${currentLang?.nativeName || currentLang?.name || languageCode}...`}
              dir={languageCode === 'ur' || languageCode === 'ar' ? 'rtl' : 'ltr'}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg shadow-cyan-500/25 transition-all"
            >
              Save Translation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
