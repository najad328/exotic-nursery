import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <span className="text-6xl mb-4">🌿</span>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-500 text-sm mb-6">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
