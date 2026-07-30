import React from "react";
import { motion } from "motion/react";
import { Globe, Check } from "lucide-react";
import { Language, useI18n } from "../lib/i18n";
import { cn } from "../lib/utils";

interface Props {
  onComplete: () => void;
}

const LANGUAGES: { code: Language; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
];

export default function LanguageSelector({ onComplete }: Props) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="fixed inset-0 z-[100] bg-[#F5F5F0] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-12 text-center"
      >
        <div className="space-y-4">
          <div className="w-20 h-20 bg-[#141414] text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-[#141414]/20">
            <Globe className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#141414]">WorkSphere</h1>
          <p className="text-[#141414]/60 font-medium">{t('tagline')}</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 mb-6">
            {t('selectLanguage')}
          </p>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group",
                language === lang.code
                  ? "bg-[#141414] border-[#141414] text-white shadow-xl shadow-[#141414]/20"
                  : "bg-white border-[#141414]/5 hover:border-[#141414]/20 text-[#141414]"
              )}
            >
              <div className="text-left">
                <p className="font-bold text-lg">{lang.native}</p>
                <p className={cn(
                  "text-xs font-medium",
                  language === lang.code ? "text-white/60" : "text-[#141414]/40"
                )}>{lang.name}</p>
              </div>
              {language === lang.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={onComplete}
          className="w-full py-6 bg-[#141414] text-white rounded-[2rem] font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-[#141414]/20"
        >
          {t('getStarted')}
        </button>
      </motion.div>
    </div>
  );
}
