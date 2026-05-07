export default function StoreDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="h-8 w-40 bg-gray-100 rounded-lg animate-pulse" />
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
            <div className="flex-1 space-y-1 pt-1">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
