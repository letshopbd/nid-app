// import NextAuth from "next-auth"
// import authConfig from "./auth" // Removed invalid default import

// Use only the configuration part matching Edge compatibility if needed, 
// but for now since we use standard Node runtime, we can import auth.
// However, in NextAuth v5, middleware usually requires edge compatible config.
// Since we use bcrypt (not edge compat) in auth.ts, we might need to split config.
// For simplicity in this specific environment, we will try to just export auth as is.
// If it fails, we will split.

export { auth as middleware } from "./auth"

export const config = {
    matcher: ["/dashboard/:path*"],
}
