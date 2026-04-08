import { BusinessAIClient } from "./BusinessAIClient";

export const dynamic = "force-dynamic";

export default function BusinessAIPage() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-lg">
          ✨
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Business AI</h2>
          <p className="text-sm text-gray-500">
            AI-powered insights and analytics for your nursery
          </p>
        </div>
      </div>

      <BusinessAIClient />
    </div>
  );
}
