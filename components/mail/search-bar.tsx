"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMailStore } from "@/stores/mail-store"
import {
  Search,
  X,
  SlidersHorizontal,
  Mail,
  Paperclip,
  Star,
  Clock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface SearchBarProps {
  floating?: boolean
}

// Queries prefixed with "local:" are filtered from cached DB, not sent to Zoho
const QUICK_FILTERS = [
  { label: "Unread", query: "local:unread", icon: Mail, color: "#48b8d0" },
  { label: "Starred", query: "has:flags", icon: Star, color: "#48b8d0" },
  { label: "Has attachment", query: "has:attachment", icon: Paperclip, color: "#7b3e19" },
  { label: "Recent (7 days)", query: "local:recent:7", icon: Clock, color: "#b28b84" },
]


type SearchPosition = "dock" | "center" | "top"

export function SearchBar({ floating }: SearchBarProps) {
  const router = useRouter()
  const { searchQuery, setSearchQuery } = useMailStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [isFocused, setIsFocused] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [position, setPosition] = useState<SearchPosition>("dock")
  const [isAnimating, setIsAnimating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Determine position: dock → center (when focused/filters) → top (after search)
  useEffect(() => {
    if (showFilters) {
      animateTo("center")
    } else if (isFocused) {
      animateTo("center")
    } else if (position === "center") {
      animateTo("dock")
    }
  }, [isFocused, showFilters])

  function animateTo(target: SearchPosition) {
    if (target === position) return
    setIsAnimating(true)
    setPosition(target)
    setTimeout(() => setIsAnimating(false), 400)
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false)
        setShowFilters(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Keyboard shortcut: /
  useEffect(() => {
    if (!floating) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === "Escape") {
        inputRef.current?.blur()
        setIsFocused(false)
        setShowFilters(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [floating])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (localQuery.trim()) {
      doSearch(localQuery.trim())
    }
  }

  function doSearch(query: string) {
    setSearchQuery(query)
    setLocalQuery(query)
    setIsFocused(false)
    setShowFilters(false)
    // Animate to top then navigate
    animateTo("top")
    setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }, 300)
  }

  function handleClear() {
    setLocalQuery("")
    inputRef.current?.focus()
  }

  // Inline header version (when email is open)
  if (!floating) {
    return (
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "#b28b84" }}
        />
        <Input
          ref={inputRef}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search emails..."
          className="pl-9 h-9 rounded-xl border-0 text-sm"
          style={{
            background: "#f5e5fc",
            color: "#2d1a0e",
          }}
        />
      </form>
    )
  }

  // Position styles
  const positionStyles: Record<SearchPosition, React.CSSProperties> = {
    dock: {
      bottom: "24px",
      top: "auto",
      left: "50%",
      transform: "translateX(-50%)",
      width: "min(520px, calc(100vw - 48px))",
    },
    center: {
      bottom: "auto",
      top: "30%",
      left: "50%",
      transform: "translateX(-50%) translateY(-50%)",
      width: "min(640px, calc(100vw - 48px))",
    },
    top: {
      bottom: "auto",
      top: "18px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "min(560px, calc(100vw - 240px))",
    },
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-40"
      style={{
        ...positionStyles[position],
        transition: "all 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Filter dropdown — appears above the search bar when centered */}
      {(isFocused || showFilters) && position === "center" && (
        <div
          className="mb-3 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid #e8ddf0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            animation: "fadeSlideUp 0.25s ease-out",
          }}
        >
          {/* Quick filters */}
          <div className="p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2.5" style={{ color: "#b28b84" }}>
              Quick filters
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FILTERS.map((filter) => {
                const Icon = filter.icon
                return (
                  <button
                    key={filter.label}
                    type="button"
                    onClick={() => doSearch(filter.query)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer"
                    style={{ background: "#f5e5fc", color: "#2d1a0e" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ebd4f5"
                      e.currentTarget.style.transform = "scale(1.03)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f5e5fc"
                      e.currentTarget.style.transform = "scale(1)"
                    }}
                  >
                    <Icon className="w-3 h-3" style={{ color: filter.color }} />
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator style={{ background: "#efe6f5" }} />

          {/* Advanced filter fields */}
          <div className="p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2.5" style={{ color: "#b28b84" }}>
              Filter by
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-medium mb-1 block" style={{ color: "#7b3e19" }}>From</label>
                <Input
                  placeholder="sender@email.com"
                  className="h-8 text-xs rounded-lg"
                  style={{ borderColor: "#e8ddf0", background: "#fdfbfe", color: "#2d1a0e" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value
                      if (val) doSearch(`from:${val}`)
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium mb-1 block" style={{ color: "#7b3e19" }}>To</label>
                <Input
                  placeholder="recipient@email.com"
                  className="h-8 text-xs rounded-lg"
                  style={{ borderColor: "#e8ddf0", background: "#fdfbfe", color: "#2d1a0e" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value
                      if (val) doSearch(`to:${val}`)
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium mb-1 block" style={{ color: "#7b3e19" }}>Subject</label>
                <Input
                  placeholder="Keywords in subject"
                  className="h-8 text-xs rounded-lg"
                  style={{ borderColor: "#e8ddf0", background: "#fdfbfe", color: "#2d1a0e" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value
                      if (val) doSearch(`subject:${val}`)
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium mb-1 block" style={{ color: "#7b3e19" }}>Date</label>
                <Input
                  placeholder="newer_than:30d"
                  className="h-8 text-xs rounded-lg"
                  style={{ borderColor: "#e8ddf0", background: "#fdfbfe", color: "#2d1a0e" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value
                      if (val) doSearch(val)
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main search input */}
      <form onSubmit={handleSubmit}>
        <div
          className="search-glossy rounded-2xl transition-all duration-300"
          style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(24px) saturate(200%)",
            WebkitBackdropFilter: "blur(24px) saturate(200%)",
            border: isFocused ? "1.5px solid rgba(72, 184, 208, 0.5)" : "1px solid rgba(232, 221, 240, 0.6)",
            boxShadow: isFocused
              ? "0 8px 40px rgba(72, 184, 208, 0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)"
              : "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Search
              className="w-5 h-5 shrink-0 transition-colors duration-200"
              style={{ color: isFocused ? "#48b8d0" : "#b28b84" }}
            />
            <input
              ref={inputRef}
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Search emails..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#b28b84]"
              style={{ color: "#2d1a0e" }}
            />

            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md transition-colors cursor-pointer"
                style={{ color: "#b28b84" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#7b3e19")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#b28b84")}
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Advanced filter toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setShowFilters(!showFilters)
                if (!isFocused) {
                  setIsFocused(true)
                  inputRef.current?.focus()
                }
              }}
              className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer"
              style={{
                color: showFilters ? "#48b8d0" : "#b28b84",
                background: showFilters ? "#eef9fd" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!showFilters) e.currentTarget.style.background = "#f5e5fc"
              }}
              onMouseLeave={(e) => {
                if (!showFilters) e.currentTarget.style.background = "transparent"
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {isFocused && localQuery ? (
              <>
                <div className="w-px h-5" style={{ background: "#e8ddf0" }} />
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 px-3 rounded-lg text-xs cursor-pointer"
                  style={{ background: "#48b8d0", color: "#ffffff" }}
                >
                  Search
                </Button>
              </>
            ) : !isFocused && !localQuery ? (
              <kbd
                className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ background: "#f5e5fc", color: "#b28b84" }}
              >
                /
              </kbd>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  )
}
