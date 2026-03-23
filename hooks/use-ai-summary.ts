"use client"

export function useAISummary(_emailContent: string | null) {
  return {
    data: null,
    isLoading: false,
    isAvailable: false,
  }
}
