"use client"

import { useState } from "react"
import { useMailStore } from "@/stores/mail-store"
import { useSendEmail } from "@/hooks/use-mail-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Minus, Send, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export function ComposeModal() {
  const { composeMode, closeCompose } = useMailStore()
  const { data: session } = useSession()
  const sendMutation = useSendEmail()

  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [minimized, setMinimized] = useState(false)

  async function handleSend() {
    if (!to.trim()) {
      toast.error("Please add a recipient")
      return
    }

    sendMutation.mutate(
      {
        fromAddress: (session?.user as { zohoEmail?: string })?.zohoEmail || session?.user?.email || "",
        toAddress: to,
        ccAddress: cc || undefined,
        bccAddress: bcc || undefined,
        subject,
        content,
        mailFormat: "html",
      },
      {
        onSuccess: () => {
          toast.success("Email sent successfully")
          closeCompose()
        },
        onError: () => {
          toast.error("Failed to send email")
        },
      }
    )
  }

  const modeLabel =
    composeMode === "reply"
      ? "Reply"
      : composeMode === "replyAll"
        ? "Reply All"
        : composeMode === "forward"
          ? "Forward"
          : "New Message"

  if (minimized) {
    return (
      <div
        className="fixed bottom-0 right-6 w-72 rounded-t-xl shadow-lg border border-b-0 cursor-pointer z-50"
        style={{
          background: "linear-gradient(135deg, #fec89a 0%, #f27202 100%)",
          borderColor: "#e8e8e4",
        }}
        onClick={() => setMinimized(false)}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm font-medium text-white">{modeLabel}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                setMinimized(false)
              }}
              className="text-white hover:bg-white/20 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                closeCompose()
              }}
              className="text-white hover:bg-white/20 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-0 right-6 w-[560px] max-w-[calc(100vw-48px)] rounded-t-xl shadow-2xl border border-b-0 flex flex-col z-50"
      style={{
        background: "#ffffff",
        borderColor: "#e8e8e4",
        maxHeight: "70vh",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-t-xl shrink-0"
        style={{
          background: "linear-gradient(135deg, #fec89a 0%, #f27202 100%)",
        }}
      >
        <span className="text-sm font-medium text-white">{modeLabel}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMinimized(true)}
            className="text-white hover:bg-white/20 cursor-pointer"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={closeCompose}
            className="text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Fields */}
      <div className="shrink-0">
        <div className="flex items-center border-b px-4" style={{ borderColor: "#f1f1ee" }}>
          <span className="text-sm w-12 shrink-0" style={{ color: "#ad8b63" }}>To</span>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-10 text-sm"
            placeholder="recipient@example.com"
            style={{ color: "#3b2e1f" }}
          />
          <div className="flex gap-1 text-xs shrink-0">
            {!showCc && (
              <button onClick={() => setShowCc(true)} className="cursor-pointer" style={{ color: "#ad8b63" }}>
                Cc
              </button>
            )}
            {!showBcc && (
              <button onClick={() => setShowBcc(true)} className="cursor-pointer" style={{ color: "#ad8b63" }}>
                Bcc
              </button>
            )}
          </div>
        </div>

        {showCc && (
          <div className="flex items-center border-b px-4" style={{ borderColor: "#f1f1ee" }}>
            <span className="text-sm w-12 shrink-0" style={{ color: "#ad8b63" }}>Cc</span>
            <Input
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-10 text-sm"
              style={{ color: "#3b2e1f" }}
            />
          </div>
        )}

        {showBcc && (
          <div className="flex items-center border-b px-4" style={{ borderColor: "#f1f1ee" }}>
            <span className="text-sm w-12 shrink-0" style={{ color: "#ad8b63" }}>Bcc</span>
            <Input
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-10 text-sm"
              style={{ color: "#3b2e1f" }}
            />
          </div>
        )}

        <div className="flex items-center border-b px-4" style={{ borderColor: "#f1f1ee" }}>
          <span className="text-sm w-12 shrink-0" style={{ color: "#ad8b63" }}>Sub</span>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-10 text-sm"
            placeholder="Subject"
            style={{ color: "#3b2e1f" }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your email..."
          className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[200px] text-sm"
          style={{ color: "#3b2e1f" }}
        />
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-t shrink-0"
        style={{ borderColor: "#f1f1ee" }}
      >
        <Button
          onClick={handleSend}
          disabled={sendMutation.isPending}
          className="rounded-lg gap-2 cursor-pointer"
          style={{
            background: "#f27202",
            color: "#ffffff",
          }}
        >
          <Send className="w-4 h-4" />
          {sendMutation.isPending ? "Sending..." : "Send"}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer"
          style={{ color: "#775d3f" }}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
