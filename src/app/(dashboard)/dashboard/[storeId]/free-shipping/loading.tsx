export default function FreeShippingLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-[#F1F4FA] rounded-lg animate-pulse" />
          <div className="h-4 w-44 bg-[#F1F4FA] rounded animate-pulse" />
        </div>
        <div className="h-8 w-28 bg-[#F1F4FA] rounded-full animate-pulse" />
      </div>
      <div className="bg-white border border-[#E5E8EF] rounded-2xl overflow-hidden">
        <div className="bg-[#F8F9FC] border-b border-[#F1F4FA] px-4 py-3">
          <div className="h-3 w-24 bg-[#E5E8EF] rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-4 border-b border-[#F1F4FA] last:border-0 flex items-center gap-4">
            <div className="h-4 flex-1 bg-[#F1F4FA] rounded animate-pulse" />
            <div className="h-4 w-24 bg-[#F1F4FA] rounded animate-pulse" />
            <div className="h-5 w-16 bg-[#F1F4FA] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
