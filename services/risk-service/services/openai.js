import OpenAI from "openai";
let client;

export const getOpenAI = () => {
    if (!client) {
        if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
        client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return client;
};

export const MODELS = {
    PLANNER: process.env.OPENAI_MODEL_PLANNER || "gpt-4o-mini",
    SYNTH: process.env.OPENAI_MODEL_SYNTH || "gpt-4.1"
};
