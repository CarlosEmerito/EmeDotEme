export default function ArticleLoading() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 font-sans">
      <main className="flex flex-col max-w-4xl mx-auto w-full px-4 py-12 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center justify-between text-sm mb-8">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-48"></div>
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div>
        </div>

        {/* Header Skeleton */}
        <header className="mb-10">
          {/* Title */}
          <div className="h-10 md:h-14 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full mb-3"></div>
          <div className="h-10 md:h-14 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-4/5 mb-6"></div>
          
          {/* Summary */}
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2"></div>
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-11/12 mb-2"></div>
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-8"></div>
          
          {/* Metadata Row */}
          <div className="flex items-center justify-between border-t border-b border-zinc-200 dark:border-zinc-800 py-4 mb-8">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-64"></div>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-32"></div>
          </div>

          {/* Main Image */}
          <figure className="w-full mb-10">
            <div className="aspect-video relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-md"></div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mx-auto mt-4"></div>
          </figure>
        </header>

        {/* Content Skeleton */}
        <article className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
          <div className="space-y-4 mb-8">
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
          </div>
          
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-6"></div>
          
          <div className="space-y-4 mb-8">
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-11/12"></div>
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5"></div>
          </div>
          
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-2/5 mb-6"></div>
          
          <div className="space-y-4">
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
          </div>
        </article>
      </main>
    </div>
  );
}