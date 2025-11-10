import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BackgroundBeams } from "@/components/ui/background-beams"
import type { FC, ReactNode } from "react"
import "/src/css/carousel.css"

interface CarouselCardProps {
  title: string
  description: string
  layout?: "centered" | "left" | "right"
  children?: ReactNode
  onNext?: () => void
  onBack?: () => void
  showBack?: boolean
  nextLabel?: string
  compact?: boolean
  /** new: per-page styling hooks */
  titleClassName?: string
  descClassName?: string
}

const CarouselCard: FC<CarouselCardProps> = ({
  title,
  description,
  layout,
  children,
  onNext,
  onBack,
  showBack = true,
  nextLabel = "Next",
  compact = false,
  titleClassName,
  descClassName,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 card-bg" style={{ position: "relative" }}>
      <BackgroundBeams />
      <Card
        className="w-full max-w-4xl sm:min-w-[80vw] md:min-w-[60vw] lg:min-w-[50vw] xl:min-w-[100vh] border shadow-xl flex justify-center card"
        style={{
          position: "relative",
          zIndex: 1,
          backgroundColor: "#2a2b32",
          borderColor: "#3f4047",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          backdropFilter: "blur(16px)",
          minHeight: "70vh", 
          maxHeight: "85vh", 
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}

      >

        <CardContent
          className={`py-12 px-8 text-white card-content flex flex-col ${compact ? "gap-3" : "gap-6"
            } ${layout === "left"
              ? "text-left items-start"
              : layout === "right"
                ? "text-right items-end"
                : "text-center items-center"
            }`}
          style={{ overflowY: "auto", width: "100%" }}
        >
          <h1 className={`carousel-title ${titleClassName || ""}`}>{title}</h1>
          <p className={`carousel-desc ${descClassName || ""}`}>{description}</p>

          <div className="w-full">{children}</div>

          <div className={`flex justify-center gap-4 ${compact ? "mt-3" : "mt-6"}`}>
            {showBack && (
              <Button variant="outline" onClick={onBack} className="bg-yellow-500 text-black hover:bg-yellow-600">
                Back
              </Button>
            )}
            {onNext && (
              <Button onClick={onNext} className="bg-yellow-500 text-black hover:bg-yellow-600">
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
