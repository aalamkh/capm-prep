import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
      <Skeleton className="h-96 lg:sticky lg:top-20" />
      <div className="space-y-3">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-full max-w-md" />
        <ul className="mt-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-20 w-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
