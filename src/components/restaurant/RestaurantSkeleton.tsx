// مكون Skeleton للتحميل - يعرض هيكل الصفحة بدون بيانات لتقليل CLS
export default function RestaurantSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Skeleton Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
      </div>
      {/* Skeleton Cover - مطابق تماماً لـ Restaurant.tsx (aspect 16:9 + max-w-4xl) لتفادي CLS */}
      <div className="w-full bg-gray-50">
        <div className="container mx-auto px-4 py-3">
          <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto aspect-[16/9] rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
      {/* Skeleton Info */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-muted animate-pulse rounded-xl" />
              <div className="w-9 h-9 bg-muted animate-pulse rounded-xl" />
              <div className="w-9 h-9 bg-muted animate-pulse rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      {/* Skeleton Categories */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2 overflow-x-auto pb-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-16 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Skeleton View Toggle */}
      <div className="container px-4 flex justify-end gap-2 py-4">
        <div className="w-11 h-11 bg-muted animate-pulse rounded-md border border-transparent" />
        <div className="w-11 h-11 bg-muted animate-pulse rounded-md border border-transparent" />
      </div>
      {/* Skeleton Menu Cards */}
      <div className="container mx-auto px-4 pb-32">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="aspect-video bg-muted animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
