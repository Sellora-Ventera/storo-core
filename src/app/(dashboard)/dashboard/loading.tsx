export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-gray-100 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
