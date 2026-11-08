import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, User, X, Loader2, AlertCircle } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebase";
import { cn } from "../lib/utils";

interface Props {
  currentPhotoURL?: string;
  onUpload: (url: string) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function ProfileImageUploader({
  currentPhotoURL,
  onUpload,
  size = "md",
  label = "Profile Photo",
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-36 h-36",
  };

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const cameraIconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  const displayPhoto = preview || currentPhotoURL;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Image must be under ${MAX_SIZE_MB}MB. Selected: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload to Firebase Storage
    if (!auth.currentUser) {
      setError("Not authenticated. Please log in.");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(
        storage,
        `profile-images/${auth.currentUser.uid}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      onUpload(downloadURL);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onUpload("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{label}</p>

      <div className="relative group">
        {/* Avatar circle */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            "relative rounded-2xl overflow-hidden cursor-pointer border-2 border-[#141414]/10 bg-[#141414]/5 flex items-center justify-center transition-all hover:border-[#141414]/40",
            sizeClasses[size]
          )}
        >
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={cn("text-[#141414]/20", iconSizes[size])} />
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-[#141414]/0 group-hover:bg-[#141414]/40 transition-all flex items-center justify-center">
            {uploading ? (
              <Loader2 className={cn("text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity", cameraIconSizes[size])} />
            ) : (
              <Camera className={cn("text-white opacity-0 group-hover:opacity-100 transition-opacity", cameraIconSizes[size])} />
            )}
          </div>

          {/* Upload indicator badge */}
          {!uploading && (
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#141414] rounded-full flex items-center justify-center shadow-md">
              <Camera className="w-3 h-3 text-white" />
            </div>
          )}
          {uploading && (
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            </div>
          )}
        </motion.div>

        {/* Remove button */}
        {displayPhoto && !uploading && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
          >
            <X className="w-3 h-3" />
          </motion.button>
        )}
      </div>

      {/* Action text */}
      <div className="text-center">
        <button
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-bold text-[#141414]/60 hover:text-[#141414] transition-colors disabled:opacity-40"
        >
          {uploading ? "Uploading..." : displayPhoto ? "Change Photo" : "Upload Photo"}
        </button>
        <p className="text-[10px] text-[#141414]/30 mt-0.5 font-medium">Max {MAX_SIZE_MB}MB · JPG, PNG, WEBP</p>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-medium w-full max-w-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
