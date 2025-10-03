"use client"
import CarouselCard from "@/components/ui/CarouselCard"
import { useState } from "react"
import { Input } from "@/components/ui/input"

const steps = [
  {
    title: "Let’s Build Something Great",
    description: "Answer a few quick questions. Get a roadmap built for your startup.",
    layout: "centered" as const,
  },
  {
    title: "What’s your startup called?",
    description: "Give us a name. You can always change this later.",
    layout: "left" as const,
  },
  {
    title: "What industry or sector does it belong to?",
    description: "Help us understand your space.",
    layout: "left" as const,
  },
  {
    title: "How many founders are on your team?",
    description: "We’ll use this to guide planning and task allocation.",
    layout: "left" as const,
  },
]

export default function Question() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})

  const goNext = () => {
    if (step < steps.length - 1) setStep((prev) => prev + 1)
  }

  const goBack = () => {
    if (step > 0) setStep((prev) => prev - 1)
  }

  const { title, description, layout } = steps[step]

  return (
    <CarouselCard
      title={title}
      description={description}
      layout={layout}
      onNext={goNext}
      onBack={goBack}
      showBack={step !== 0}
      nextLabel={step === steps.length - 1 ? "Finish" : "Next"}
    >
      {layout === "left" && (
        <Input
          type="text"
          placeholder="Type your answer..."
          value={answers[step] || ""}
          onChange={(e) =>
            setAnswers((prev) => ({ ...prev, [step]: e.target.value }))
          }
          className="mt-4 w-full"
        />
      )}
    </CarouselCard>
  )
}
