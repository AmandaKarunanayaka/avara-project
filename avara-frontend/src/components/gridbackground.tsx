import { cn } from "@/lib/utils";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";

export default function AnimatedGridPatternDemo() {
  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ backgroundColor: "#f8f8f7" }}>
      <div className="absolute inset-0 z-0">
        <AnimatedGridPattern
          numSquares={100}
          maxOpacity={0.4}
          duration={3}
          repeatDelay={1}
          className={cn(
            "inset-0 h-full w-full skew-y-6",
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
          )}
        />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center">
      </div>
    </div>
  );
}
