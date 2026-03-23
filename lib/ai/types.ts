export interface AIEmailSummary {
  summary: string
  keyPoints: string[]
  sentiment: "positive" | "neutral" | "negative" | "urgent"
  suggestedActions: string[]
}

export interface AISmartReply {
  replies: Array<{ label: string; body: string }>
}

export interface AIEmailCategory {
  category: string
  confidence: number
  labels: string[]
}

export interface AIPriorityScore {
  score: number
  reason: string
}

export interface AIComposeAssist {
  suggestion: string
  completions: string[]
}

export interface AIProvider {
  summarize(content: string): Promise<AIEmailSummary>
  generateReplies(content: string, context?: string): Promise<AISmartReply>
  categorize(subject: string, snippet: string, from: string): Promise<AIEmailCategory>
  scorePriority(email: { subject: string; from: string; snippet: string }): Promise<AIPriorityScore>
  assistCompose(draft: string, context?: string): Promise<AIComposeAssist>
}
