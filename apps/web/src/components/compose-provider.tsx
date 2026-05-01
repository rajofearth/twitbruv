import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Compose } from "./compose"
import type { Post } from "../lib/api"
import type { ReactNode } from "react"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ComposeOpenOpts {
  quoteOfId?: string
  quoted?: Post
  onCreated?: (post: Post) => void
}

interface ComposeState {
  quoteOfId?: string
  quoted?: Post
  onCreated?: (post: Post) => void
}

type ComposeListener = (post: Post) => void

interface ComposeContextValue {
  /** Open the compose modal. Pass quote data to start a quote post. */
  open: (opts?: ComposeOpenOpts) => void
  /** Subscribe to post creation events from the modal. Returns unsubscribe fn. */
  onPostCreated: (listener: ComposeListener) => () => void
}

const ComposeContext = createContext<ComposeContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ComposeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ComposeState | null>(null)
  const keyRef = useRef(0)
  const listenersRef = useRef<Set<ComposeListener>>(new Set())

  const openCompose = useCallback((opts?: ComposeOpenOpts) => {
    keyRef.current += 1
    setState(opts ?? {})
  }, [])

  const onPostCreated = useCallback((listener: ComposeListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const handleCreated = useCallback(
    (post: Post) => {
      // Fire the per-open callback
      state?.onCreated?.(post)
      // Notify all subscribers
      for (const listener of listenersRef.current) {
        listener(post)
      }
      setState(null)
    },
    [state]
  )

  return (
    <ComposeContext.Provider value={{ open: openCompose, onPostCreated }}>
      {children}
      <Dialog open={state !== null} onOpenChange={(o) => !o && setState(null)}>
        <DialogContent className="gap-0 p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">
            {state?.quoteOfId ? "Quote post" : "Compose post"}
          </DialogTitle>
          {state && (
            <Compose
              key={keyRef.current}
              quoteOfId={state.quoteOfId}
              quoted={state.quoted}
              onCreated={handleCreated}
              autoFocus
            />
          )}
        </DialogContent>
      </Dialog>
    </ComposeContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCompose(): ComposeContextValue {
  const ctx = useContext(ComposeContext)
  if (!ctx) throw new Error("useCompose must be used within a ComposeProvider")
  return ctx
}

/**
 * Subscribe to post creation events from the compose modal.
 * Fires when any post is created via the modal (new post, quote, etc.)
 */
export function useOnModalPostCreated(callback: ComposeListener) {
  const { onPostCreated } = useCompose()
  useEffect(() => onPostCreated(callback), [onPostCreated, callback])
}
