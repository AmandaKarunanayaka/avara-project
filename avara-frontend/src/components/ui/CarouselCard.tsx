import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BackgroundBeams } from "@/components/ui/background-beams"
import type { FC, ReactNode } from "react"
import '/src/css/carousel.css';

interface CarouselCardProps {
  title: string
  description: string
  layout?: "centered" | "left" | "right"
  children?: ReactNode
  onNext?: () => void
  onBack?: () => void
  showBack?: boolean
  nextLabel?: string
}

const CarouselCard: FC<CarouselCardProps> = ({
  title,
  description,
  layout,
  children,
  onNext,
  onBack,
  showBack = true,
  nextLabel = "Next"
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 card-bg" style={{ position: "relative" }}>
      <BackgroundBeams />
      <Card
        className="w-full min-h-[70vh] max-w-4xl sm:min-w-[80vw] md:min-w-[60vw] lg:min-w-[50vw] xl:min-w-[100vh] border shadow-xl flex justify-center card"
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "#2a2b32",
          borderColor: "#3f4047",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(16px)",
        }}
      >
        <CardContent
          className={`py-12 px-8 text-white card-content flex flex-col gap-6 ${
            layout === "left"
              ? "text-left items-start"
              : layout === "right"
              ? "text-right items-end"
              : "text-center items-center"
          }`}
        >
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-base">{description}</p>

          {/* Render input/children */}
          <div className="w-full">{children}</div>

          {/* Push buttons further down with gap */}
          <div className="flex justify-center gap-4 pt-10">
            {showBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                Back
              </Button>
            )}
            {onNext && (
              <Button
                onClick={onNext}
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                {nextLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CarouselCard
