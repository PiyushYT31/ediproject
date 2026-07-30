import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, MapPin, CheckCircle, Phone, MessageSquare, ShieldCheck, Send, Loader2 } from "lucide-react";
import { WorkerProfile, Review } from "../types";
import { cn } from "../lib/utils";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useI18n, TranslatedText } from "../lib/i18n";

interface WorkerDetailsProps {
  worker: WorkerProfile;
  onClose: () => void;
  onBook: () => void;
  currentUser: any;
  userProfileRole?: string;
}

export default function WorkerDetails({ worker, onClose, onBook, currentUser, userProfileRole }: WorkerDetailsProps) {
  const { t, language } = useI18n();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const isSelf = currentUser?.uid === worker.uid;
  const canBook = userProfileRole === 'consumer' && !isSelf;

  const reviewsRef = collection(db, "workers", worker.uid, "reviews");
  const [reviewsValue, loadingReviews] = useCollection(
    query(reviewsRef, orderBy("createdAt", "desc"))
  );

  const reviews = reviewsValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)) || [];

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const reviewData = {
        workerId: worker.uid,
        reviewerId: auth.currentUser.uid,
        reviewerName: auth.currentUser.displayName || "Anonymous",
        rating: newRating,
        comment: newComment.trim(),
        createdAt: Date.now(),
      };

      await addDoc(reviewsRef, reviewData);
      
      // Update worker's average rating (simplified logic for demo)
      const workerRef = doc(db, "workers", worker.uid);
      const newTotalJobs = worker.totalJobs + 1;
      const newRatingAvg = ((worker.rating * worker.totalJobs) + newRating) / newTotalJobs;
      
      await updateDoc(workerRef, {
        rating: newRatingAvg,
        totalJobs: increment(1)
      });

      setNewComment("");
      setNewRating(5);
      setShowReviewForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workers/${worker.uid}/reviews`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-[#141414]/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-[#F5F5F0] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="relative h-48 sm:h-64 flex-shrink-0">
          <img
            src={worker.photoURL || `https://picsum.photos/seed/${worker.uid}/600/400`}
            alt={worker.displayName}
            className="w-full h-full object-cover grayscale-[0.2]"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#141414]/80 to-transparent text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                {t(worker.category)}
              </span>
              {worker.isAvailable && (
                <span className="px-2 py-0.5 bg-green-500/80 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {t('availableNow')}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-bold tracking-tight">{worker.displayName}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <Stat label={t('rating')} value={worker.rating.toFixed(1)} icon={<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />} />
              <Stat label={t('jobsCount')} value={worker.totalJobs.toString()} icon={<CheckCircle className="w-4 h-4 text-green-500" />} />
              <Stat label={t('score')} value={`${((worker as any).score * 100).toFixed(0)}`} icon={<ShieldCheck className="w-4 h-4 text-blue-500" />} />
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">{t('distance')}</div>
              <div className="text-xl font-bold">{(worker as any).distance?.toFixed(1) || "0.0"} {t('km')}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414]/40">{t('about')}</h3>
            <p className="text-[#141414]/80 leading-relaxed">
              <TranslatedText text={worker.bio} lang={language} />
            </p>
          </div>

          {/* Reviews Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414]/40">{t('reviews')} ({reviews.length})</h3>
              {auth.currentUser && !showReviewForm && (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="text-xs font-bold text-[#141414] underline underline-offset-4"
                >
                  {t('writeReview')}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleSubmitReview}
                  className="bg-white p-4 rounded-2xl border border-[#141414]/10 space-y-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1"
                      >
                        <Star className={cn("w-6 h-6", star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-[#141414]/10")} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    required
                    placeholder={t('reviewPlaceholder')}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-4 bg-[#141414]/5 rounded-xl border-transparent focus:bg-white focus:border-[#141414] transition-all min-h-[100px] resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 py-3 bg-[#141414]/5 rounded-xl font-bold text-sm"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="flex-[2] py-3 bg-[#141414] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> {t('submitReview')}</>}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {loadingReviews ? (
                <div className="text-center py-4 text-xs font-bold text-[#141414]/20 uppercase tracking-widest">{t('loading')}</div>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="bg-white p-4 rounded-2xl border border-[#141414]/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">{review.reviewerName}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#141414]/70 leading-relaxed">
                      <TranslatedText text={review.comment} lang={language} />
                    </p>
                    <p className="text-[10px] text-[#141414]/30 font-bold uppercase tracking-widest">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white/50 rounded-2xl border border-dashed border-[#141414]/10">
                  <p className="text-xs font-bold text-[#141414]/30 uppercase tracking-widest">{t('noReviews')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-[#141414]/10 rounded-2xl font-bold hover:border-[#141414] transition-all">
              <MessageSquare className="w-5 h-5" />
              {t('chat')}
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-[#141414]/10 rounded-2xl font-bold hover:border-[#141414] transition-all">
              <Phone className="w-5 h-5" />
              {t('call')}
            </button>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-[#141414]/5 flex-shrink-0">
          {!currentUser ? (
            <div className="text-center py-4 text-xs font-bold text-[#141414]/40 uppercase tracking-widest bg-[#141414]/5 rounded-2xl">
              {t('signInToBookWorkers')}
            </div>
          ) : isSelf ? (
            <div className="text-center py-4 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 rounded-2xl border border-blue-100">
              {t('viewingOwnProfile')}
            </div>
          ) : !canBook ? (
            <div className="text-center py-4 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 rounded-2xl border border-amber-100">
              {t('onlyConsumerCanBook')}
            </div>
          ) : (
            <button
              onClick={onBook}
              className="w-full py-5 bg-[#141414] text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#141414]/20"
            >
              {t('bookNow')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-lg font-bold">
        {icon}
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">{label}</div>
    </div>
  );
}
