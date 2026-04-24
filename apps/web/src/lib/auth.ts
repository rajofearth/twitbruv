import { createClient } from "@workspace/auth/client"
import { API_URL } from "./env"

export const authClient = createClient(API_URL)

export const { signIn, signUp, signOut, useSession, getSession } = authClient
