export default function Loading() {
  return (
    <div className="bg-black min-h-screen p-8">
      <div className="h-14 w-56 bg-[#111] rounded-2xl animate-pulse mb-4" />
      <div className="h-6 w-36 bg-[#111] rounded-full animate-pulse mb-12" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-[#111] rounded-2xl h-48 animate-pulse"
            style={{ animationDelay: `${i * 0.04}s` }} />
        ))}
      </div>
    </div>
  )
}
