import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null | undefined
      email?: string | null | undefined
      image?: string | null | undefined
    }
  }

  interface User {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
  }
}
