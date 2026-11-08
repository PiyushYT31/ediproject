import React from "react";
import { motion } from "motion/react";
import { WORKER_CATEGORIES } from "@/src/constants";
import { 
  Wrench, 
  Hammer, 
  Zap, 
  Paintbrush, 
  Trees, 
  Settings, 
  HardHat,
  Droplets,
  Flame
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/utils";

interface CategoryTheme {
  icon: any;
  color: string;
  bg: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  Plumber: { icon: Droplets, color: "text-sky-600", bg: "bg-sky-50 group-hover:bg-sky-600 group-hover:text-white" },
  Electrician: { icon: Zap, color: "text-amber-600", bg: "bg-amber-50 group-hover:bg-amber-600 group-hover:text-white" },
  Carpenter: { icon: Wrench, color: "text-amber-800", bg: "bg-amber-100/60 group-hover:bg-amber-800 group-hover:text-white" },
  Painter: { icon: Paintbrush, color: "text-purple-600", bg: "bg-purple-50 group-hover:bg-purple-600 group-hover:text-white" },
  Mason: { icon: Hammer, color: "text-orange-600", bg: "bg-orange-50 group-hover:bg-orange-600 group-hover:text-white" },
  Welder: { icon: Flame, color: "text-indigo-600", bg: "bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white" },
  Gardener: { icon: Trees, color: "text-emerald-600", bg: "bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white" },
  Mechanic: { icon: Settings, color: "text-rose-600", bg: "bg-rose-50 group-hover:bg-rose-600 group-hover:text-white" },
};

interface CategoryGridProps {
  onSelect: (category: string) => void;
  selectedCategory?: string | null;
}

export default function CategoryGrid({ onSelect, selectedCategory }: CategoryGridProps) {
  const { t } = useI18n();
  
  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
      {WORKER_CATEGORIES.map((category, index) => {
        const theme = CATEGORY_THEMES[category] || { icon: HardHat, color: "text-indigo-600", bg: "bg-indigo-50" };
        const Icon = theme.icon;
        const isSelected = selectedCategory === category;

        return (
          <motion.button
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(category)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer group shadow-2xs",
              isSelected
                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "bg-white border-slate-200/90 hover:border-indigo-500/40 text-slate-800 hover:shadow-md"
            )}
          >
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                isSelected ? "bg-white/20 text-white" : cn(theme.bg, theme.color)
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "text-[11px] font-bold tracking-tight text-center truncate w-full",
                isSelected ? "text-white" : "text-slate-700"
              )}
            >
              {t(category) || category}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
