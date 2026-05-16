export default function CustomersLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-6 w-28 bg-[#F1F4FA] rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-36 bg-[#F1F4FA] rounded animate-pulse" />
      </div>
      <div className="h-9 w-64 bg-[#F1F4FA] rounded-full animate-pulse mb-4" />
      <div className="bg-white border border-[#E5E8EF] rounded-2xl overflow-hidden">
        <div className="bg-[#F8F9FC] border-b border-[#F1F4FA] px-4 py-3 grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 w-16 bg-[#E5E8EF] rounded animate-pulse" />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="px-4 py-4 border-b border-[#F1F4FA] last:border-0 grid grid-cols-5 gap-4 items-center">
            <div className="h-4 w-28 bg-[#F1F4FA] rounded animate-pulse" />
            <div className="space-y-1">
              <div className="h-3 w-36 bg-[#F1F4FA] rounded animate-pulse" />
              <div className="h-3 w-24 bg-[#F1F4FA] rounded animate-pulse" />
            </div>
            <div className="h-4 w-8 bg-[#F1F4FA] rounded animate-pulse mx-auto" />
            <div className="h-4 w-20 bg-[#F1F4FA] rounded animate-pulse ml-auto" />
            <div className="h-4 w-24 bg-[#F1F4FA] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
