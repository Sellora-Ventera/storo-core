export default function StoreLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-[#F1F4FA] rounded-lg animate-pulse" />
          <div className="h-4 w-52 bg-[#F1F4FA] rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#E5E8EF] rounded-2xl p-5">
            <div className="h-3 w-20 bg-[#F1F4FA] rounded animate-pulse mb-3" />
            <div className="h-7 w-16 bg-[#F1F4FA] rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-[#E5E8EF] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F4FA]">
          <div className="h-4 w-28 bg-[#F1F4FA] rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-5 py-4 border-b border-[#F1F4FA] last:border-0 flex items-center gap-4">
            <div className="h-4 w-24 bg-[#F1F4FA] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[#F1F4FA] rounded animate-pulse flex-1" />
            <div className="h-4 w-16 bg-[#F1F4FA] rounded animate-pulse" />
            <div className="h-5 w-20 bg-[#F1F4FA] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
