import mongoose from "mongoose";

const { Schema } = mongoose;

const ResearchSectionSchema = new Schema(
    {
        id: { type: String },
        title: { type: String },
        kind: { type: String },
        html: { type: String },
    },
    { _id: false }
);

const ResearchExperimentSchema = new Schema(
    {
        id: { type: String },
        title: { type: String },
        hypothesis: { type: String },
        metric: { type: String },
        status: { type: String },
    },
    { _id: false }
);

const PersonaSchema = new Schema(
    {
        id: { type: String },
        type: { type: String }, // "primary" | "secondary" | "future"
        title: { type: String },
        description: { type: String },
        confidence: { type: Number },
        updatedBy: { type: String },
        updatedAt: { type: Date },
    },
    { _id: false }
);

const CompetitorSchema = new Schema(
    {
        name: { type: String },
        positioning: { type: String },
        strengths: { type: String },
        weaknesses: { type: String },
        overlap: { type: String },
    },
    { _id: false }
);

const TimelineItemSchema = new Schema(
    {
        label: { type: String },
        etaDays: { type: Number },
    },
    { _id: false }
);

const SPASchema = new Schema(
    {
        sizeScore: { type: Number },
        painScore: { type: Number },
        accessibilityScore: { type: Number },
        commentary: { type: String },
    },
    { _id: false }
);

const MetaSchema = new Schema(
    {
        spa: { type: SPASchema, default: undefined },
        clarifyingQuestions: { type: [String], default: [] },
        needMoreInput: { type: Boolean, default: false },
        industryRecommendation: {
            recommendedIndustry: { type: String },
            alternatives: { type: [String], default: [] },
            reasoning: { type: String },
        },
        problemRefinement: { type: Schema.Types.Mixed },
        niche: { type: String },
        experimentHints: { type: [String], default: [] },
        reliability: { type: Schema.Types.Mixed },
        clarificationAnswers: {
            type: [
                {
                    answer: String,
                    date: Date,
                },
            ],
            default: [],
        },
    },
    { _id: false }
);

const CoreSchema = new Schema(
    {
        problem: {
            text: { type: String },
            state: { type: String, default: "draft" }, // "draft" | "validated"
        },
        solution: {
            text: { type: String },
            state: { type: String, default: "draft" },
        },
        personaPrimaryId: { type: String, default: null },
        locked: { type: Boolean, default: false },
        dirtyDownstream: { type: Boolean, default: false },
    },
    { _id: false }
);

const SummarySchema = new Schema(
    {
        problem: {
            state: { type: String }, // "validated" | "unvalidated" | "unclear"
            notes: { type: String },
        },
        solution: {
            state: { type: String }, // "validated" | "unvalidated" | "none"
            notes: { type: String },
        },
        nextStep: { type: String },
        etaDays: { type: Number },
        gtm: {
            strategy: { type: String },
            summary: { type: String },
            channels: { type: [String], default: [] },
            confidence: { type: Number },
        },
    },
    { _id: false }
);

const AnalysisSchema = new Schema(
    {
        pest: {
            political: { type: String },
            economic: { type: String },
            social: { type: String },
            technological: { type: String },
            environmental: { type: String },
            legal: { type: String },
        },
        swot: {
            strengths: { type: [String], default: [] },
            weaknesses: { type: [String], default: [] },
            opportunities: { type: [String], default: [] },
            threats: { type: [String], default: [] },
        },
    },
    { _id: false }
);

const ResearchDocSchema = new Schema(
    {
        userId: { type: String, required: true, index: true },
        projectId: { type: String, required: true, index: true },

        pathType: {
            type: String,
            enum: ["problem", "resource"],
            default: "problem",
        },

        state: {
            type: String,
            default: "research",
        },

        intake: {
            projectId: { type: String },
            name: { type: String },
            industry: { type: String },
            problem: { type: String },
            problemValidated: { type: Boolean, default: false },
            solution: { type: String },
            solutionExists: { type: Boolean, default: false },
            solutionValidated: { type: Boolean, default: false },
            pathType: { type: String },
            resourceDescription: { type: String },
            resourceIntent: { type: String },
            progressBrief: { type: String },
            teamCount: { type: Number },
            teamSkills: { type: [String], default: [] },
            capital: { type: Number },
            region: { type: String },
        },

        core: { type: CoreSchema, default: () => ({}) },

        meta: {
            type: MetaSchema,
            default: () => ({ clarifyingQuestions: [] }),
        },

        sections: {
            type: [ResearchSectionSchema],
            default: [],
        },

        experiments: {
            type: [ResearchExperimentSchema],
            default: [],
        },

        personas: {
            type: [PersonaSchema],
            default: [],
        },

        competitors: {
            type: [CompetitorSchema],
            default: [],
        },

        timeline: {
            type: [TimelineItemSchema],
            default: [],
        },

        summary: {
            type: SummarySchema,
            default: () => ({}),
        },

        analysis: {
            type: AnalysisSchema,
            default: () => ({}),
        },
    },
    { timestamps: true }
);

ResearchDocSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const ResearchDoc =
    mongoose.models.ResearchDoc ||
    mongoose.model("ResearchDoc", ResearchDocSchema);

export default ResearchDoc;
