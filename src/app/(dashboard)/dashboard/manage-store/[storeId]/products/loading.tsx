export default function ProductsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-20 bg-[#F1F4FA] rounded-lg animate-pulse" />
          <div className="h-4 w-36 bg-[#F1F4FA] rounded animate-pulse" />
        </div>
        <div className="h-8 w-32 bg-[#F1F4FA] rounded-full animate-pulse" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="h-9 w-64 bg-[#F1F4FA] rounded-full animate-pulse" />
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-14 bg-[#F1F4FA] rounded-full animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-white border border-[#E5E8EF] rounded-2xl overflow-hidden">
        <div className="bg-[#F8F9FC] border-b border-[#F1F4FA] px-4 py-3 grid grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-3 w-12 bg-[#E5E8EF] rounded animate-pulse" />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="px-4 py-3 border-b border-[#F1F4FA] last:border-0 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F1F4FA] rounded-lg animate-pulse shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-40 bg-[#F1F4FA] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[#F1F4FA] rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-[#F1F4FA] rounded animate-pulse" />
            <div className="h-4 w-20 bg-[#F1F4FA] rounded animate-pulse" />
            <div className="h-4 w-8 bg-[#F1F4FA] rounded animate-pulse" />
            <div className="h-5 w-12 bg-[#F1F4FA] rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
