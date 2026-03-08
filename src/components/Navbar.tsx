import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">Poly</span>
          <span className="rounded bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            MARKET
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-gray-600 transition hover:text-gray-900"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
