"use client"

/**
 * Full-page skeleton for the mail layout while session loads.
 * Mimics the 3-column Gmail layout with shimmer animations.
 */
export function MailLayoutSkeleton() {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#fefcfb" }}>
      {/* Top bar skeleton */}
      <header
        className="h-14 flex items-center gap-3 px-4 border-b shrink-0"
        style={{ borderColor: "#e8e8e4" }}
      >
        <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
        <div className="w-7 h-7 rounded-lg skeleton-shimmer" />
        <div className="hidden sm:block w-16 h-5 rounded skeleton-shimmer" />
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="h-9 rounded-xl skeleton-shimmer" />
        </div>
        <div className="w-8 h-8 rounded-full skeleton-shimmer" />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar skeleton */}
        <aside
          className="hidden lg:block w-60 shrink-0 border-r p-3 space-y-3"
          style={{ borderColor: "#e8e8e4" }}
        >
          {/* Compose button */}
          <div className="h-10 rounded-xl skeleton-shimmer" />

          {/* Folder items */}
          <div className="space-y-1 mt-4">
            {[140, 100, 90, 80, 110].map((w, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <div className="w-4 h-4 rounded skeleton-shimmer shrink-0" />
                <div className="h-4 rounded skeleton-shimmer" style={{ width: w }} />
              </div>
            ))}
          </div>

          {/* Bottom separator + sign out */}
          <div className="absolute bottom-4 left-3 right-3">
            <div className="h-px mb-3 skeleton-shimmer" />
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-4 h-4 rounded skeleton-shimmer" />
              <div className="h-4 w-16 rounded skeleton-shimmer" />
            </div>
          </div>
        </aside>

        {/* Email list skeleton */}
        <div className="flex-1 flex">
          <div className="w-full md:w-[380px] border-r" style={{ borderColor: "#e8e8e4" }}>
            {/* List header */}
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#e8e8e4" }}>
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded skeleton-shimmer" />
                <div className="h-4 w-12 rounded skeleton-shimmer" />
              </div>
              <div className="w-8 h-8 rounded skeleton-shimmer" />
            </div>

            {/* Email rows */}
            <div className="space-y-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <EmailRowSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Viewer placeholder */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl mx-auto skeleton-shimmer" />
              <div className="h-4 w-36 mx-auto rounded skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Single email row skeleton
 */
export function EmailRowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b"
      style={{ borderColor: "#f1f1ee" }}
    >
      {/* Unread dot space */}
      <div className="w-2 shrink-0" />

      {/* Star */}
      <div className="w-4 h-4 rounded skeleton-shimmer shrink-0" />

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-28 rounded skeleton-shimmer" />
          <div className="h-3 w-10 rounded skeleton-shimmer" />
        </div>
        <div className="h-3.5 w-48 rounded skeleton-shimmer" />
        <div className="h-3 w-64 rounded skeleton-shimmer" />
      </div>
    </div>
  )
}

/**
 * Email viewer skeleton — shown while email content is loading
 */
export function EmailViewerSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: "#e8e8e4" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-8 h-8 rounded skeleton-shimmer" />
        ))}
        <div className="flex-1" />
        <div className="w-8 h-8 rounded skeleton-shimmer" />
      </div>

      {/* Header skeleton */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#f1f1ee" }}>
        {/* Subject */}
        <div className="h-6 w-72 rounded skeleton-shimmer mb-4" />

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 rounded skeleton-shimmer" />
                <div className="h-3 w-40 rounded skeleton-shimmer" />
              </div>
              <div className="h-3 w-28 rounded skeleton-shimmer" />
            </div>
            <div className="h-3 w-48 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Body skeleton */}
      <div className="flex-1 px-6 py-4 space-y-3">
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-11/12 rounded skeleton-shimmer" />
        <div className="h-4 w-4/5 rounded skeleton-shimmer" />
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        <div className="h-12 w-full rounded skeleton-shimmer mt-4" />
        <div className="h-4 w-5/6 rounded skeleton-shimmer" />
        <div className="h-4 w-2/3 rounded skeleton-shimmer" />
      </div>
    </div>
  )
}

/**
 * Sidebar folder list skeleton
 */
export function SidebarSkeleton() {
  return (
    <div className="py-3 space-y-3">
      <div className="px-3">
        <div className="h-10 rounded-xl skeleton-shimmer" />
      </div>
      <div className="px-2 space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <div className="w-4 h-4 rounded skeleton-shimmer shrink-0" />
            <div
              className="h-4 rounded skeleton-shimmer"
              style={{ width: `${60 + Math.random() * 60}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
