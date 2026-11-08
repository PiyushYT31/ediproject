import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Phone, MessageSquare, Check, CheckCheck } from "lucide-react";
import { collection, query, orderBy, addDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerName: string;
  workerId: string;
  workerPhoto?: string;
  workerPhone?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export default function ChatModal({
  isOpen,
  onClose,
  workerName,
  workerId,
  workerPhoto,
  workerPhone,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = auth.currentUser;
  const conversationId = currentUser
    ? [currentUser.uid, workerId].sort().join("_")
    : null;

  // Listen for real-time messages in this conversation
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser || !conversationId) return;

    const messageText = text.trim();
    setText("");
    setIsSending(true);

    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Client",
        text: messageText,
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCall = () => {
    const phone = workerPhone || "9876543210";
    window.open(`tel:${phone}`, "_self");
  };

  const handleWhatsApp = () => {
    const phone = (workerPhone || "9876543210").replace(/\D/g, "");
    const cleanPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hello ${workerName}, I would like to enquire about your services on WorkSphere.`
    )}`;
    window.open(url, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh] border border-slate-100"
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={workerPhoto || `https://picsum.photos/seed/${workerId}/100`}
                  alt={workerName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
                />
                <div>
                  <h3 className="font-bold text-sm text-white">{workerName}</h3>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online on WorkSphere
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleWhatsApp}
                  title="Open WhatsApp"
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-emerald-400"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCall}
                  title="Call Phone"
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-300"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/80">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Chat with {workerName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Send a message to discuss your service needs, timing, or materials.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs ${
                          isMe
                            ? "bg-indigo-600 text-white rounded-br-xs"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Message ${workerName}...`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-100 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl text-sm transition-all focus:outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim() || isSending}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

