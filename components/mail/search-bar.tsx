"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMailStore } from "@/stores/mail-store"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  const router = useRouter()
  const { searchQuery, setSearchQuery } = useMailStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (localQuery.trim()) {
      setSearchQuery(localQuery.trim())
      router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
        style={{ color: "#ad8b63" }}
      />
      <Input
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search emails..."
        className="pl-9 h-9 rounded-xl border-0 text-sm"
        style={{
          background: "#f8edeb",
          color: "#3b2e1f",
        }}
      />
    </form>
  )
}
