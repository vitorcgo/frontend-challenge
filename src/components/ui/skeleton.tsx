import { cn } from "@/lib/utils"

// Com `role` o skeleton é o próprio aviso de carregamento; sem ele é só decoração.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden={props.role ? undefined : true}
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-surface-card)_25%,var(--color-surface-raised)_50%,var(--color-surface-card)_75%)] bg-size-[200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
