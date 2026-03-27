"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <span className="text-5xl mb-4">⚠️</span>
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-500 text-sm text-center max-w-md mb-6">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        onClick={reset}
        className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
