export default function Loading() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <div className="absolute h-8 w-8 animate-ping rounded-full bg-pulse-ping opacity-40" />
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-xs font-medium tracking-wide text-foreground-muted opacity-80">
          Loading...
        </p>
      </div>
    </div>
  );
}
