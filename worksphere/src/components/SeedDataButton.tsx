import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Database, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { seedAllData } from "../scripts/seedData";

export default function SeedDataButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const handleSeed = async () => {
    if (status === "loading") return;
    const confirmed = window.confirm(
      "This will add sample workers, artisans, products, vendors and inventory to your Firebase database.\n\nProceed?"
    );
    if (!confirmed) return;

    setStatus("loading");
    setMessage("");

    const result = await seedAllData();
    setStatus(result.success ? "success" : "error");
    setMessage(result.message);
    setShowDetails(true);
  };

  return (
    <div className="space-y-3">
      <motion.button
        onClick={handleSeed}
        disabled={status === "loading"}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm transition-all shadow-lg ${
          status === "success"
            ? "bg-green-600 text-white shadow-green-600/20"
            : status === "error"
            ? "bg-red-500 text-white shadow-red-500/20"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-indigo-600/30"
        } disabled:opacity-70`}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Seeding Database…
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Data Seeded Successfully!
          </>
        ) : status === "error" ? (
          <>
            <XCircle className="w-5 h-5" />
            Seed Failed — Retry
          </>
        ) : (
          <>
            <Database className="w-5 h-5" />
            Populate Sample Data
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-2xl overflow-hidden border ${
              status === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <span className={`text-xs font-bold uppercase tracking-widest ${
                status === "success" ? "text-green-700" : "text-red-700"
              }`}>
                {status === "success" ? "Seeded successfully" : "Error details"}
              </span>
              {showDetails ? (
                <ChevronUp className={`w-4 h-4 ${status === "success" ? "text-green-600" : "text-red-500"}`} />
              ) : (
                <ChevronDown className={`w-4 h-4 ${status === "success" ? "text-green-600" : "text-red-500"}`} />
              )}
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.pre
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`px-4 pb-4 text-xs leading-relaxed whitespace-pre-wrap font-medium ${
                    status === "success" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {message}
                </motion.pre>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
