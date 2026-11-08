import React from "react";
import { motion } from "motion/react";
import { Star, MapPin, CheckCircle, Heart, ShieldCheck, ArrowRight } from "lucide-react";
import { WorkerProfile } from "../types";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";
import { useApp } from "../context/AppContext";

interface WorkerCardProps {
  key?: string | number;
  worker: WorkerProfile;
  distance?: number;
  onClick?: () => void;
}

export default function WorkerCard({ worker, distance, onClick }: WorkerCardProps) {
  const { t } = useI18n();
  const { isFavorite, toggleFavorite } = useApp();
  const favorited = isFavorite(worker.uid);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group relative bg-white border border-slate-200/90 hover:border-indigo-500/40 rounded-2xl p-4 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200"
    >
      <div className="flex gap-4 items-start">
        {/* Worker Avatar with Status */}
        <div className="relative shrink-0">
          <img
            src={worker.photoURL || `https://picsum.photos/seed/${worker.uid}/200`}
            alt={worker.displayName}
            className="w-20 h-20 rounded-2xl object-cover bg-slate-100 border border-slate-100 shadow-xs"
            referrerPolicy="no-referrer"
          />
          {worker.isAvailable !== false ? (
            <span
              title="Available now"
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
            />
          ) : (
            <span
              title="Busy / Offline"
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 border-2 border-white rounded-full shadow-xs"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                {worker.displayName}
              </h3>
              {worker.aadhaarVerified && (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Aadhaar Verified" />
              )}
            </div>

            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(worker.uid);
              }}
              className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
              title={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn("w-4 h-4 transition-all", favorited && "fill-rose-500 text-rose-500 scale-110")}
              />
            </button>
          </div>

          {/* Profession & Rating */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              {t(worker.category) || worker.category}
            </span>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-xs font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{(worker.rating || 5.0).toFixed(1)}</span>
              {worker.reviewsCount ? (
                <span className="text-slate-400 font-normal">({worker.reviewsCount})</span>
              ) : null}
            </div>
          </div>

          {/* Meta Badges */}
          <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {typeof distance === "number"
                  ? `${distance.toFixed(1)} ${t("km") || "km"}`
                  : worker.location?.city || "Nearby"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{worker.totalJobs || 0} {t("jobsCount") || "jobs done"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Quick Action */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-slate-400 font-medium">Starts from</span>
          <span className="text-base font-extrabold text-slate-900">
            ₹{worker.basePrice || worker.hourlyFee || 299}
          </span>
          <span className="text-[11px] text-slate-400">/hr</span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
          View Profile <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </motion.div>
  );
}
