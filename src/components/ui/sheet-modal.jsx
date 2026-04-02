import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/** Accessible panel + backdrop without Radix (avoids optional tslib issues in some bundlers). */
export function SheetModal({ open, onOpenChange, title, description, children, className }) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-modal-title"
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg",
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4 pr-8">
          <div>
            <h2 id="sheet-modal-title" className="text-lg font-semibold leading-none">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
