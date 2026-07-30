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
  Droplets
} from "lucide-react";
import { useI18n } from "../lib/i18n";

const CATEGORY_ICONS: Record<string, any> = {
  "Plumber": Droplets,
  "Mason": Hammer,
  "Electrician": Zap,
  "Carpenter": Wrench,
  "Painter": Paintbrush,
  "Welder": Settings,
  "Gardener": Trees,
  "Mechanic": Settings,
};

interface CategoryGridProps {
  onSelect: (category: string) => void;
}

export default function CategoryGrid({ onSelect }: CategoryGridProps) {
  const { t } = useI18n();
  
  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {WORKER_CATEGORIES.map((category, index) => {
        const Icon = CATEGORY_ICONS[category] || HardHat;
        return (
          <motion.button
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(category)}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-[#141414]/10 rounded-2xl hover:border-[#141414] transition-colors group"
          >
            <div className="p-2 bg-[#141414]/5 rounded-xl group-hover:bg-[#141414] group-hover:text-white transition-colors">
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-center">
              {t(category)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
