import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, MapPin, CheckCircle, Phone, MessageSquare, ShieldCheck, Send, Loader2, Calendar, Sparkles } from "lucide-react";
import { WorkerProfile, Review } from "../types";
import { cn } from "../lib/utils";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, orderBy, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { useI18n, TranslatedText } from "../lib/i18n";
import ChatModal from "./ChatModal";
import BookingModal from "./BookingModal";

interface WorkerDetailsProps {
  worker: WorkerProfile;
  onClose: () => void;
  onBookSuccess?: () => void;
  currentUser: any;
  userProfileRole?: string;
}

export default function WorkerDetails({
  worker,
  onClose,
  onBookSuccess,
  currentUser,
  userProfileRole,
}: WorkerDetailsProps) {
  const { t, language } = useI18n();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  const isSelf = currentUser?.uid === worker.uid;
  const canBook = userProfileRole === "consumer" && !isSelf;

  const reviewsRef = collection(db, "workers", worker.uid, "reviews");
  const [reviewsValue, loadingReviews] = useCollection(
    query(reviewsRef, orderBy("createdAt", "desc"))
  );

  const reviews =
    reviewsValue?.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Review)) || [];

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const reviewData = {
        workerId: worker.uid,
        reviewerId: auth.currentUser.uid,
        reviewerName: auth.currentUser.displayName || "Customer",
        rating: newRating,
        comment: newComment.trim(),
        createdAt: Date.now(),
      };

      await addDoc(reviewsRef, reviewData);

      const workerRef = doc(db, "workers", worker.uid);
      const newTotalJobs = (worker.totalJobs || 0) + 1;
      const newRatingAvg =
        (((worker.rating || 5) * (worker.totalJobs || 0)) + newRating) / newTotalJobs;

      await updateDoc(workerRef, {
        rating: Math.round(newRatingAvg * 10) / 10,
        totalJobs: increment(1),
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

  const handleCall = () => {
    const phone = worker.whatsappNumber || "9876543210";
    window.open(`tel:${phone}`, "_self");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div className="fixed inset-0" onClick={onClose} />
        
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative z-10 bg-slate-50 w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-slate-200"
        >
          {/* Cover Hero */}
          <div className="relative h-48 sm:h-60 shrink-0 bg-slate-800">
            <img
              src={worker.photoURL || `https://picsum.photos/seed/${worker.uid}/600/400`}
              alt={worker.displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md rounded-full text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-indigo-600/90 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  {t(worker.category) || worker.category}
                </span>
                {worker.isAvailable !== false && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Available Now
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {worker.displayName}
              </h2>
            </div>
          </div>

          {/* Scrollable details */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-white rounded-2xl border border-slate-200/80 text-center shadow-xs">
              <div>
                <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-slate-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {(worker.rating || 5.0).toFixed(1)}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Rating</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-slate-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  {worker.totalJobs || 0}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Jobs</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {(worker as any).distance ? `${(worker as any).distance.toFixed(1)}km` : "Nearby"}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Distance</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-indigo-600">
                  ₹{worker.basePrice || worker.hourlyFee || 299}
                </div>
                <div className="text-[10px] font-bold uppercase text-slate-400 mt-0.5">Base Rate</div>
              </div>
            </div>

            {/* Quick Contact Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowChat(true)}
                className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Chat with Worker
              </button>
              <button
                onClick={handleCall}
                className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                Direct Call / WhatsApp
              </button>
            </div>

            {/* Bio / About */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("about") || "About Worker"}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200/80">
                <TranslatedText text={worker.bio || worker.serviceDescription || "Experienced professional delivering quality service in local community."} lang={language} />
              </p>
            </div>

            {/* Skills / Categories */}
            {worker.skills && worker.skills.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {worker.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Customer Reviews ({reviews.length})
                </h3>
                {currentUser && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4 cursor-pointer"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Review input form */}
              <AnimatePresence>
                {showReviewForm && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleSubmitReview}
                    className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={cn(
                              "w-5 h-5",
                              star <= newRating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      required
                      placeholder="Share your experience working with this professional..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs focus:bg-white transition-all min-h-[80px] resize-none focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isSubmitting}
                        type="submit"
                        className="flex-[2] py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Submit Review"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Reviews list */}
              <div className="space-y-2">
                {loadingReviews ? (
                  <div className="text-center py-4 text-xs text-slate-400">Loading reviews...</div>
                ) : reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div key={r.id} className="p-3 bg-white rounded-2xl border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{r.reviewerName}</span>
                        <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {r.rating}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No reviews yet. Be the first to review!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Booking Action */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            {!currentUser ? (
              <div className="text-center py-3 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl">
                Please sign in to book service providers
              </div>
            ) : isSelf ? (
              <div className="text-center py-3 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-xl">
                This is your own provider profile
              </div>
            ) : !canBook ? (
              <div className="text-center py-3 text-xs font-bold text-amber-800 bg-amber-50 rounded-xl">
                Only consumer accounts can book services
              </div>
            ) : (
              <button
                onClick={() => setShowBooking(true)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Book Now (from ₹{worker.basePrice || 299})
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        workerName={worker.displayName}
        workerId={worker.uid}
        workerPhoto={worker.photoURL}
        workerPhone={worker.whatsappNumber}
      />

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        worker={worker}
        onSuccess={() => {
          if (onBookSuccess) onBookSuccess();
          onClose();
        }}
      />
    </>
  );
}
