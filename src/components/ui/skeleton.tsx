import { cn } from "cn"

// Shimmer em vez do "pulse" padrão do shadcn (§8 do enunciado); a regra global de movimento reduzido o congela.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-surface-card)_25%,var(--color-surface-raised)_50%,var(--color-surface-card)_75%)] bg-size-[200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
