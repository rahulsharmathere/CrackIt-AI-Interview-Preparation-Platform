require("dotenv").config()
const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
})

async function test() {
    console.log("API Key present:", !!process.env.GOOGLE_GENAI_API_KEY)
    try {
        const response = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: "test question about backend",
        })
        console.log("SUCCESS:", JSON.stringify(response).slice(0, 300))
    } catch (err) {
        console.log("FULL ERROR:", err)
    }
}
test()