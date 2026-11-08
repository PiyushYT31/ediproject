import React from "react";
import { motion } from "motion/react";
import { Globe, Check, ChevronRight } from "lucide-react";
import { Language, useI18n } from "../lib/i18n";
import { cn } from "../lib/utils";

interface Props {
  onComplete: () => void;
}

const LANGUAGES: { code: Language; name: string; native: string; script: string }[] = [
  { code: 'en', name: 'English', native: 'English', script: 'A' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', script: 'अ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'आ' },
];

export default function LanguageSelector({ onComplete }: Props) {
  const { language, setLanguage, t } = useI18n();

  const handleSkip = () => {
    setLanguage('en');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#F5F5F0] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md space-y-10 text-center"
      >
        {/* Logo & Branding */}
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 bg-[#141414] text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-[#141414]/20"
          >
            <Globe className="w-10 h-10" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#141414]">
              {t('chooseLanguageTitle')}
            </h1>
            <p className="text-[#141414]/50 font-medium mt-2 text-sm">
              {t('chooseLanguageSubtitle')}
            </p>
          </div>
        </div>

        {/* Language Options */}
        <div className="space-y-3">
          {LANGUAGES.map((lang, index) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group",
                language === lang.code
                  ? "bg-[#141414] border-[#141414] text-white shadow-xl shadow-[#141414]/20"
                  : "bg-white border-[#141414]/5 hover:border-[#141414]/20 text-[#141414]"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold",
                  language === lang.code
                    ? "bg-white/15 text-white"
                    : "bg-[#141414]/5 text-[#141414]/40"
                )}>
                  {lang.script}
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg leading-tight">{lang.native}</p>
                  <p className={cn(
                    "text-xs font-medium",
                    language === lang.code ? "text-white/60" : "text-[#141414]/40"
                  )}>{lang.name}</p>
                </div>
              </div>
              {language === lang.code ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
              ) : (
                <ChevronRight className="w-5 h-5 text-[#141414]/20 group-hover:text-[#141414]/40 transition-colors" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={onComplete}
            className="w-full py-5 bg-[#141414] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-[#141414]/20"
          >
            {t('continue')}
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={handleSkip}
            className="w-full py-3 text-[#141414]/40 font-medium text-sm hover:text-[#141414]/60 transition-colors"
          >
            {t('skipDefaultEnglish')}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
