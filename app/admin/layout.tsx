import { ReactNode } from "react";
import { AdminNav } from "./components/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-6 overflow-x-auto">
            <AdminNav />
          </nav>
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
