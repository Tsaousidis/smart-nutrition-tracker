import OpenAI from "openai";

if (!process.env.AZURE_OPENAI_API_KEY) {
  throw new Error("Missing AZURE_OPENAI_API_KEY in .env");
}

if (!process.env.AZURE_OPENAI_ENDPOINT) {
  throw new Error("Missing AZURE_OPENAI_ENDPOINT in .env");
}

if (!process.env.AZURE_OPENAI_DEPLOYMENT_NAME) {
  throw new Error("Missing AZURE_OPENAI_DEPLOYMENT_NAME in .env");
}

export const azureOpenAI = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { "api-version": "2025-01-01-preview" },
  defaultHeaders: {
    "api-key": process.env.AZURE_OPENAI_API_KEY,
  },
});