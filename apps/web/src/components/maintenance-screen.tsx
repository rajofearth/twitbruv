import { APP_NAME } from "../lib/env"

// const DEFAULT_MESSAGE = "We're temporarily down for maintenance. Check back shortly."

export function MaintenanceScreen() {
  // {
  // message
  // }: {
  // message?: string | null
  // }
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-xl text-2xl font-bold">
        {APP_NAME.slice(0, 1).toLowerCase()}
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {/* {message ?? DEFAULT_MESSAGE} */}
          down for maintenance.
        </h1>
      </div>
    </div>
  )
}
