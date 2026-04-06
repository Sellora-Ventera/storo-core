import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
        <Link
          href="/"
          className="text-primary underline hover:text-primary/80 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
