"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/mail/sidebar"
import { SearchBar } from "@/components/mail/search-bar"
import { ComposeModal } from "@/components/mail/compose-modal"
import { UserProfileMenu } from "@/components/mail/user-profile-menu"
import { MailLayoutSkeleton } from "@/components/mail/mail-skeleton"
import { useMailStore } from "@/stores/mail-store"
import { useSync } from "@/hooks/use-sync"
import { triggerInitialSync } from "@/lib/actions/sync"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function MailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const { sidebarOpen, composeOpen, toggleSidebar } = useMailStore()

  // Start polling
  useSync()

  // Initial sync on first load
  useEffect(() => {
    if (session?.user?.zohoAccountId) {
      triggerInitialSync().catch(console.error)
    }
  }, [session?.user?.zohoAccountId])

  if (status === "loading") {
    return <MailLayoutSkeleton />
  }

  if (status === "unauthenticated") {
    redirect("/login")
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#fefcfb" }}>
      {/* Top bar */}
      <header
        className="h-14 flex items-center gap-3 px-4 border-b shrink-0"
        style={{ borderColor: "#e8e8e4" }}
      >
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              style={{ color: "#775d3f" }}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="hidden lg:flex cursor-pointer"
          style={{ color: "#775d3f" }}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "#f27202" }}
          >
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <span
            className="font-semibold text-lg hidden sm:inline"
            style={{ color: "#3b2e1f" }}
          >
            GxMail
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl mx-auto">
          <SearchBar />
        </div>

        {/* User profile */}
        <UserProfileMenu />
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar */}
        {sidebarOpen && (
          <aside className="hidden lg:block w-60 shrink-0 border-r overflow-y-auto" style={{ borderColor: "#e8e8e4" }}>
            <Sidebar />
          </aside>
        )}

        {/* Mail content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Compose modal */}
      {composeOpen && <ComposeModal />}
    </div>
  )
}
