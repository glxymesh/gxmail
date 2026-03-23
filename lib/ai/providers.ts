import type {
  AIProvider,
  AIEmailSummary,
  AISmartReply,
  AIEmailCategory,
  AIPriorityScore,
  AIComposeAssist,
} from "./types"

export class NoopAIProvider implements AIProvider {
  async summarize(): Promise<AIEmailSummary> {
    return { summary: "", keyPoints: [], sentiment: "neutral", suggestedActions: [] }
  }
  async generateReplies(): Promise<AISmartReply> {
    return { replies: [] }
  }
  async categorize(): Promise<AIEmailCategory> {
    return { category: "uncategorized", confidence: 0, labels: [] }
  }
  async scorePriority(): Promise<AIPriorityScore> {
    return { score: 0, reason: "" }
  }
  async assistCompose(): Promise<AIComposeAssist> {
    return { suggestion: "", completions: [] }
  }
}
