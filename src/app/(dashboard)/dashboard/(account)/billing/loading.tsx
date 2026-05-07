export default function BillingLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="h-7 w-24 bg-gray-100 rounded-lg animate-pulse" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-gray-100 rounded-xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
