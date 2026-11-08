import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Package, 
  Plus, 
  Loader2, 
  IndianRupee, 
  CreditCard, 
  MapPin, 
  Calendar, 
  Star, 
  Send, 
  Banknote 
} from "lucide-react";
import { JobRequest, JobStatus, UserRole } from "../types";
import { cn } from "../lib/utils";
import React, { useState } from "react";
import { doc, updateDoc, addDoc, collection, increment } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import MaterialSelector from "./MaterialSelector";
import UPIPaymentModal from "./UPIPaymentModal";
import { useI18n, TranslatedText } from "../lib/i18n";

interface JobCardProps {
  key?: string | number;
  job: JobRequest;
  workerName: string;
  userRole: UserRole;
}

export default function JobCard({ job, workerName, userRole }: JobCardProps) {
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);

  const STATUS_CONFIG = {
    [JobStatus.PENDING]: {
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200/60",
      label: t('Pending') || "Pending Request",
    },
    [JobStatus.ACCEPTED]: {
      icon: CheckCircle2,
      color: "text-sky-600",
      bg: "bg-sky-50 border-sky-200/60",
      label: t('Accepted') || "Accepted",
    },
    [JobStatus.IN_PROGRESS]: {
      icon: AlertCircle,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-200/60",
      label: t('In Progress') || "In Progress",
    },
    [JobStatus.COMPLETED]: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200/60",
      label: t('Completed') || "Completed",
    },
    [JobStatus.CANCELLED]: {
      icon: XCircle,
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-200/60",
      label: t('Cancelled') || "Cancelled",
    },
  };

  const config = STATUS_CONFIG[job.status] || STATUS_CONFIG[JobStatus.PENDING];
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
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:shadow-md transition-all"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              {workerName}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                {t(job.category) || job.category}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0", config.bg, config.color)}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </div>
        </div>

        {/* Location / Scheduled Date info if present */}
        {(job.location?.address || (job as any).scheduledDate) && (
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
            {job.location?.address && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[200px]">{job.location.address}</span>
              </div>
            )}
            {(job as any).scheduledDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {(job as any).scheduledDate} {(job as any).scheduledTime ? `at ${(job as any).scheduledTime}` : ""}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
          <p className="text-xs text-slate-700 leading-relaxed italic">
            "<TranslatedText text={job.description} lang={language} />"
          </p>
        </div>

        {/* Materials requested (if any) */}
        {job.materials && job.materials.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Package className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {t('materialsRequested') || "Materials Added"}
              </span>
            </div>
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {job.materials.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{m.name}</span>
                    <span className="text-slate-400">x{m.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-700">₹{m.pricePerUnit * m.quantity}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs font-bold text-slate-600">
                <span>Materials Total</span>
                <span>₹{materialsTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* Total & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('totalQuote') || "Total Amount"}
            </p>
            <div className="flex items-center text-lg font-extrabold text-slate-900">
              ₹{job.quotedPrice || 350}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Consumer Pay via UPI when completed */}
            {isConsumer && job.status === JobStatus.COMPLETED && (
              <button
                onClick={() => setShowUPIModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pay via UPI
              </button>
            )}

            {/* Worker Actions */}
            {isWorker && job.status === JobStatus.PENDING && (
              <button 
                disabled={loading}
                onClick={() => updateStatus(JobStatus.ACCEPTED)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (t('accept') || "Accept")}
              </button>
            )}

            {isWorker && job.status === JobStatus.ACCEPTED && (
              <>
                <button 
                  onClick={() => setShowMaterialSelector(true)}
                  title="Add hardware materials from vendors"
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  disabled={loading}
                  onClick={() => updateStatus(JobStatus.IN_PROGRESS)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (t('startWork') || "Start Work")}
                </button>
              </>
            )}

            {isWorker && job.status === JobStatus.IN_PROGRESS && (
              <button 
                disabled={loading}
                onClick={() => updateStatus(JobStatus.COMPLETED)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (t('markCompleted') || "Mark Done")}
              </button>
            )}

            {/* Consumer Cancel */}
            {isConsumer && job.status === JobStatus.PENDING && (
              <button 
                disabled={loading}
                onClick={() => updateStatus(JobStatus.CANCELLED)}
                className="px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                {t('cancel') || "Cancel"}
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

      {/* UPI Settlement Modal */}
      <UPIPaymentModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        payeeName={workerName}
        amount={job.quotedPrice || 350}
        jobId={job.id}
        onPaymentSuccess={() => {
          // Can optionally update job document or receipt status
        }}
      />
    </>
  );
}
