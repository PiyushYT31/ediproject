import React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  let errorMessage = "Something went wrong. Please try again later.";
  
  try {
    // Check if it's a Firestore JSON error
    const parsedError = JSON.parse(error.message || "");
    if (parsedError.error && parsedError.operationType) {
      errorMessage = `Database Error: ${parsedError.error} (Operation: ${parsedError.operationType})`;
    }
  } catch (e) {
    // Not a JSON error, use default or error message
    if (error.message) {
      errorMessage = error.message;
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-[#141414]/10 shadow-xl max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Application Error</h2>
          <p className="text-[#141414]/60 text-sm leading-relaxed">
            {errorMessage}
          </p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
}

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}
