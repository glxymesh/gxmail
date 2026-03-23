import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      zohoAccountId: string
      zohoRegion: string
      zohoEmail: string
    } & {
      name?: string | null
      email?: string | null
      image?: string | null
    }
    accessToken: string
  }

  interface User {
    zohoAccountId?: string
    zohoRegion?: string
    zohoEmail?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    zohoAccountId?: string
    zohoRegion?: string
    zohoEmail?: string
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: string
  }
}
