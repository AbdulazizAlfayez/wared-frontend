import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 pt-16">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-slate-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-slate-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-xl font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200"
          >
            <Search className="w-4 h-4" />
            <span>Browse Cars</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
