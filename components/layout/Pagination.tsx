import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g. "/noticias", "/categoria/mercados"
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-2 mt-12 mb-8">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          &larr; Anterior
        </Link>
      ) : (
        <span className="px-4 py-2 border border-zinc-100 dark:border-zinc-800/50 rounded-md text-sm font-bold text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
          &larr; Anterior
        </span>
      )}

      {/* Page Indicators */}
      <span className="px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Página {currentPage} de {totalPages}
      </span>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Siguiente &rarr;
        </Link>
      ) : (
        <span className="px-4 py-2 border border-zinc-100 dark:border-zinc-800/50 rounded-md text-sm font-bold text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
          Siguiente &rarr;
        </span>
      )}
    </div>
  );
}
