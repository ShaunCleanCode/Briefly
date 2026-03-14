import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Briefly;
      </h1>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        맞춤형 시장 콘텐츠
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          prefetch={false}
          className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition"
        >
          Dashboard
        </Link>
        <Link
          href="/onboarding"
          prefetch={false}
          className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          온보딩
        </Link>
      </div>
    </div>
  );
}
