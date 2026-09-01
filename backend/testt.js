require("dotenv").config()

const mongoose = require("mongoose")
const { retrieveRelevantQuestions } = require("./src/services/ai.service")

const SAMPLE_JOB_DESCRIPTION = `
We are looking for a Backend Engineer (SDE-1) with strong knowledge of
Node.js, Express, and MongoDB. You will be responsible for building and
maintaining REST APIs, working with authentication systems, and writing
efficient database queries. Experience with system design fundamentals
and debugging production issues is a plus.
`

async function test() {
    console.log("Connecting to MongoDB...")
    await mongoose.connect(process.env.MONGO_URI)
    console.log("Connected.\n")

    console.log("Job description:")
    console.log(SAMPLE_JOB_DESCRIPTION.trim())
    console.log("\nRetrieving relevant questions...\n")

    const results = await retrieveRelevantQuestions(SAMPLE_JOB_DESCRIPTION, 8)

    results.forEach((r, i) => {
        console.log(`${i + 1}. [${r.category} | ${r.difficulty}] ${r.question}`)
        console.log(`   score: ${r.score.toFixed(4)}\n`)
    })

    await mongoose.disconnect()
    process.exit(0)
}

test().catch((err) => {
    console.error("Test script crashed:", err)
    process.exit(1)
})