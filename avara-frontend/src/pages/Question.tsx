"use client"
import CarouselCard from "@/components/ui/CarouselCard"
import { useState } from "react"

const steps: {
    title: string
    description: string
    layout: "centered" | "left" | "right"
}[] = [
        {
            title: "Let’s Build Something Great",
            description: "Answer a few quick questions. Get a roadmap built for your startup.",
            layout: "centered",
        },
        {
            title: "What’s your startup called?",
            description: "Give us a name. You can always change this later.",
            layout: "left",
        },
        {
            title: "What industry or sector does it belong to?",
            description: "Help us understand your space.",
            layout: "left",

        },
        {
            title: "How many founders are on your team?",
            description: "We’ll use this to guide planning and task allocation.",
            layout: "left",

        },
    ]

export default function Question() {
    const [step, setStep] = useState(0)

    const goNext = () => {
        if (step < steps.length - 1) setStep((prev: number) => prev + 1)
    }

    const goBack = () => {
        if (step > 0) setStep((prev: number) => prev - 1)
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
        </CarouselCard>
    )
}
