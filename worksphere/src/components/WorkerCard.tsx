import { motion } from "motion/react";
import { Star, MapPin, CheckCircle } from "lucide-react";
import { WorkerProfile } from "../types";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";

interface WorkerCardProps {
  key?: string | number;
  worker: WorkerProfile;
  distance?: number;
  onClick?: () => void;
}

export default function WorkerCard({ worker, distance, onClick }: WorkerCardProps) {
  const { t } = useI18n();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white border border-[#141414]/10 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex gap-4">
        <div className="relative">
          <img
            src={worker.photoURL || `https://picsum.photos/seed/${worker.uid}/200`}
            alt={worker.displayName}
            className="w-20 h-20 rounded-xl object-cover grayscale-[0.2]"
            referrerPolicy="no-referrer"
          />
          {worker.isAvailable && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg leading-tight">{worker.displayName}</h3>
            <div className="flex items-center gap-1 bg-[#141414]/5 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold">{worker.rating.toFixed(1)}</span>
            </div>
          </div>
          <p className="text-sm text-[#141414]/60 font-medium">{t(worker.category)}</p>
          
          <div className="mt-3 flex items-center gap-4 text-xs font-medium text-[#141414]/40">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{distance ? `${distance.toFixed(1)} ${t('km')}` : t('nearby')}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>{worker.totalJobs} {t('jobsCount')}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#141414]/5 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">
          {t('basePrice') || 'Base Price'}
        </div>
        <div className="text-lg font-bold">
          ₹{worker.basePrice}
        </div>
      </div>
    </motion.div>
  );
}
