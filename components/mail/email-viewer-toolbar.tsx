"use client"

import { Button } from "@/components/ui/button"
import {
  Reply,
  ReplyAll,
  Forward,
  Trash2,
  MailOpen,
  Star,
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ToolbarProps {
  onReply: () => void
  onReplyAll: () => void
  onForward: () => void
  onDelete: () => void
  onMarkUnread: () => void
  onToggleFlag: () => void
  onBack: () => void
  isFlagged: boolean
}

export function EmailViewerToolbar({
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onMarkUnread,
  onToggleFlag,
  onBack,
  isFlagged,
}: ToolbarProps) {
  const actions = [
    { icon: Reply, label: "Reply", onClick: onReply, key: "r" },
    { icon: ReplyAll, label: "Reply All", onClick: onReplyAll, key: "a" },
    { icon: Forward, label: "Forward", onClick: onForward, key: "f" },
  ]

  return (
    <div
      className="flex items-center gap-1 px-4 py-2 border-b"
      style={{ borderColor: "#e8e8e4" }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="cursor-pointer lg:hidden"
            style={{ color: "#775d3f" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Back</TooltipContent>
      </Tooltip>

      {actions.map(({ icon: Icon, label, onClick, key }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClick}
              className="cursor-pointer"
              style={{ color: "#775d3f" }}
            >
              <Icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {label} ({key})
          </TooltipContent>
        </Tooltip>
      ))}

      <div className="w-px h-5 mx-1" style={{ background: "#e8e8e4" }} />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFlag}
            className="cursor-pointer"
          >
            <Star
              className="w-4 h-4"
              style={{
                color: isFlagged ? "#fd9d49" : "#775d3f",
                fill: isFlagged ? "#fd9d49" : "transparent",
              }}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Star (s)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onMarkUnread}
            className="cursor-pointer"
            style={{ color: "#775d3f" }}
          >
            <MailOpen className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Mark unread</TooltipContent>
      </Tooltip>

      <div className="flex-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            className="cursor-pointer"
            style={{ color: "#f14122" }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            style={{ color: "#775d3f" }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onMarkUnread}>
            Mark as unread
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onToggleFlag}>
            {isFlagged ? "Remove star" : "Add star"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
