"use client"

import { GlobalSearch } from "@/components/layout/global-search"

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <GlobalSearch />
      </div>
    </header>
  )
}
