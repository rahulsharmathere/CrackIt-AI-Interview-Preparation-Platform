require("dotenv").config()

const mongoose = require("mongoose")
const { GoogleGenAI } = require("@google/genai")
const questionModel = require("../models/questions.model")
const questions = require("../data/questions.json")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
})

const EMBEDDING_MODEL = "gemini-embedding-001"
const EMBEDDING_DIMENSIONS = 768
const DELAY_BETWEEN_CALLS_MS = 2000  // pause between each request to stay under free-tier rate limits
const MAX_RETRIES = 5

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generates an embedding vector for a single piece of text.
 * Retries with increasing delay if we hit a rate limit (HTTP 429).
 */
async function embedText(text, attempt = 1) {
    try {
        const response = await ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: text,
            config: {
                taskType: "RETRIEVAL_DOCUMENT",
                outputDimensionality: EMBEDDING_DIMENSIONS,
            },
        })

        return response.embeddings[0].values
    } catch (err) {
        const isRateLimit = err.status === 429 || (err.message && err.message.includes("RESOURCE_EXHAUSTED"))

        if (isRateLimit && attempt <= MAX_RETRIES) {
            const backoffMs = 5000 * attempt  // wait longer each retry: 5s, 10s, 15s...
            console.log(`   Rate limited. Retrying in ${backoffMs / 1000}s... (attempt ${attempt}/${MAX_RETRIES})`)
            await sleep(backoffMs)
            return embedText(text, attempt + 1)
        }

        throw err
    }
}

/**
 * Reads backend/src/data/questions.json, embeds each question,
 * and upserts it into the "questions" collection in MongoDB.
 *
 * Run with: node src/scripts/ingestQuestions.js
 */
async function ingestQuestions() {
    console.log(`Connecting to MongoDB...`)
    await mongoose.connect(process.env.MONGO_URI)
    console.log(`Connected. Found ${questions.length} questions to ingest.`)

    let successCount = 0
    let failCount = 0

    for (const [index, q] of questions.entries()) {
        try {
            // Skip if this question was already ingested in a previous (partial) run
            const existing = await questionModel.findOne({ question: q.question })
            if (existing) {
                console.log(`[${index + 1}/${questions.length}] Skipped (already exists): "${q.question.slice(0, 60)}..."`)
                successCount++
                continue
            }

            // Embed a combination of category + question text for better retrieval context
            const textToEmbed = `${q.category} question: ${q.question}`
            const embedding = await embedText(textToEmbed)

            await questionModel.updateOne(
                { question: q.question },
                {
                    question: q.question,
                    category: q.category,
                    role: q.role,
                    difficulty: q.difficulty,
                    embedding: embedding,
                },
                { upsert: true }
            )

            successCount++
            console.log(`[${index + 1}/${questions.length}] Ingested: "${q.question.slice(0, 60)}..."`)

            await sleep(DELAY_BETWEEN_CALLS_MS)
        } catch (err) {
            failCount++
            console.error(`[${index + 1}/${questions.length}] Failed: "${q.question.slice(0, 60)}..."`, err.message)
        }
    }

    console.log(`\nDone. Success: ${successCount}, Failed: ${failCount}`)
    await mongoose.disconnect()
    process.exit(0)
}

ingestQuestions().catch((err) => {
    console.error("Ingestion script crashed:", err)
    process.exit(1)
})