import { motion, AnimatePresence } from "motion/react";
import { Clock, CheckCircle2, XCircle, AlertCircle, Package, Plus, Loader2, IndianRupee } from "lucide-react";
import { JobRequest, JobStatus, UserRole } from "../types";
import { cn } from "../lib/utils";
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import MaterialSelector from "./MaterialSelector";
import { useI18n, TranslatedText } from "../lib/i18n";

interface JobCardProps {
  job: JobRequest;
  workerName: string;
  userRole: UserRole;
}

export default function JobCard({ job, workerName, userRole }: JobCardProps) {
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);

  const STATUS_CONFIG = {
    [JobStatus.PENDING]: {
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      label: t('Pending'),
    },
    [JobStatus.ACCEPTED]: {
      icon: CheckCircle2,
      color: "text-blue-500",
      bg: "bg-blue-50",
      label: t('Accepted'),
    },
    [JobStatus.IN_PROGRESS]: {
      icon: AlertCircle,
      color: "text-purple-500",
      bg: "bg-purple-50",
      label: t('In Progress'),
    },
    [JobStatus.COMPLETED]: {
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-50",
      label: t('Completed'),
    },
    [JobStatus.CANCELLED]: {
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
      label: t('Cancelled'),
    },
  };

  const config = STATUS_CONFIG[job.status];
  const Icon = config.icon;

  const updateStatus = async (newStatus: JobStatus) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "jobs", job.id), {
        status: newStatus,
        updatedAt: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jobs/${job.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterials = async (materials: { itemId: string; name: string; quantity: number; pricePerUnit: number }[]) => {
    setLoading(true);
    const materialCost = materials.reduce((sum, m) => sum + (m.pricePerUnit * m.quantity), 0);
    const newQuotedPrice = (job.quotedPrice || 0) + materialCost;

    try {
      await updateDoc(doc(db, "jobs", job.id), {
        materials: [...(job.materials || []), ...materials],
        quotedPrice: newQuotedPrice,
        updatedAt: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jobs/${job.id}`);
    } finally {
      setLoading(false);
    }
  };

  const isWorker = userRole === UserRole.WORKER;
  const isConsumer = userRole === UserRole.CONSUMER;

  const materialsTotal = job.materials?.reduce((sum, m) => sum + (m.pricePerUnit * m.quantity), 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#141414]/10 rounded-3xl p-6 space-y-6 shadow-sm hover:border-[#141414]/20 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-bold text-xl tracking-tight">{workerName}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#141414]/5 rounded-full text-[#141414]/40">
              {t(job.category)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/20">
              {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm", config.bg, config.color)}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      <div className="bg-[#141414]/5 p-4 rounded-2xl">
        <p className="text-sm text-[#141414]/80 leading-relaxed italic">
          "<TranslatedText text={job.description} lang={language} />"
        </p>
      </div>

      {job.materials && job.materials.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#141414]/40">
            <Package className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('materialsRequested')}</span>
          </div>
          <div className="space-y-2">
            {job.materials.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-[#141414]/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#141414]">{m.name}</span>
                  <span className="text-[#141414]/40 text-xs">x{m.quantity}</span>
                </div>
                <span className="font-medium text-[#141414]/60">₹{m.pricePerUnit * m.quantity}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-xs font-bold text-[#141414]/40 uppercase tracking-widest">
              <span>{t('materialsTotal')}</span>
              <span>₹{materialsTotal}</span>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-[#141414]/5 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">{t('totalQuote')}</p>
          <div className="flex items-center gap-1 text-2xl font-bold">
            <IndianRupee className="w-5 h-5" />
            {job.quotedPrice || "TBD"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isWorker && job.status === JobStatus.PENDING && (
            <button 
              disabled={loading}
              onClick={() => updateStatus(JobStatus.ACCEPTED)}
              className="px-6 py-3 bg-[#141414] text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('accept')}
            </button>
          )}

          {isWorker && job.status === JobStatus.ACCEPTED && (
            <>
              <button 
                onClick={() => setShowMaterialSelector(true)}
                className="p-3 bg-white border border-[#141414]/10 rounded-xl hover:border-[#141414] transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                disabled={loading}
                onClick={() => updateStatus(JobStatus.IN_PROGRESS)}
                className="px-6 py-3 bg-[#141414] text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('startWork')}
              </button>
            </>
          )}

          {isWorker && job.status === JobStatus.IN_PROGRESS && (
            <button 
              disabled={loading}
              onClick={() => updateStatus(JobStatus.COMPLETED)}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('markCompleted')}
            </button>
          )}

          {isConsumer && job.status === JobStatus.PENDING && (
            <button 
              disabled={loading}
              onClick={() => updateStatus(JobStatus.CANCELLED)}
              className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showMaterialSelector && (
          <MaterialSelector 
            onClose={() => setShowMaterialSelector(false)}
            onAdd={handleAddMaterials}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
