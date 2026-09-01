const { GoogleGenAI } = require("@google/genai")
const {z}=require("zod")
const puppeteer = require("puppeteer")
const questionModel = require("../models/questions.model")

const EMBEDDING_MODEL = "gemini-embedding-001"
const EMBEDDING_DIMENSIONS = 768



const interviewReportJsonSchema = {
    type:"object",
    properties:{
        matchScore:{
            type:"number",
            description:"A score between 0 and 100 indicating how well the candidate's profile matches the job description"
        },
        technicalQuestions:{
            type:"array",
            items:{
                type:"object",
                properties:{
                    question:{type:"string",description:"The technical questions can be asked in the interview"},
                    intention:{type:"string",description:"The intention of interviewer behind asking this question"},
                    answer:{type:"string",description:"How to answer this question,what points to cover,what approach to take etc."},
                },
                required:["question","intention","answer"]
                
            },
            description:"Technical questions that can be asked in the interview along with their intention and how to answer them"
        },
        behavioralQuestions:{
            type:"array",
            items:{
                type:"object",
                properties:{
                    question:{type:"string",description:"The behavioral questions can be asked in the interview"},
                    intention:{type:"string",description:"The intention of interviewer behind asking this question"},
                    answer:{type:"string",description:"How to answer this question,what points to cover,what approach to take etc."},
                },
                required:["question","intention","answer"]
            },
            description:"Behavioral questions that can be asked in the interview along with their intention and how to answer them"
        },
        skillGaps:{
            type:"array",
            items:{
                type:"object",
                properties:{
                    skill:{type:"string",description:"the skill which the candidate is lacking"},
                    severity:{type:"string",enum: ["low", "medium", "high"],description:"The severity of the skill gap"},
                },
                required:["skill","severity"]
            },
            description:"List of skill gaps in the candidate's profile along with their severity"
        },
        preparationPlan:{
            type:"array",
            items:{
                type:"object",
                properties:{
                    day:{type:"number",description:"The day number in the preparation plan, starting from 1"},
                    focus:{type:"string",description:"The main focus of this day in the preparation plan,eg. data structures,system design,mock interviews"},
                    tasks:{
                        type:"array",
                        items:{type:"string",description:"List of tasks to be done on this day to follow the preparation plan,eg. read a specific book"}
                    },
                },
                required:["day","focus","tasks"]
            },
            description:"A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"
        },
        title:{
            type:"string",description:"The title of the job foer which the interview report is generated"
        }
    },
    required: ["matchScore", "technicalQuestions", "behavioralQuestions","skillGaps","preparationPlan","title"]

};


const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
})


/**
 * Embeds a search query (e.g. a job description) and retrieves the
 * top-k most semantically similar questions from the question bank
 * using MongoDB Atlas Vector Search.
 *
 * This is the "R" (Retrieval) in RAG.
 */
async function retrieveRelevantQuestions(jobDescription, topK = 8) {
    // Embed the job description. taskType is RETRIEVAL_QUERY (not RETRIEVAL_DOCUMENT,
    // which we used during ingestion) since this text is a search query, not stored content.
    const queryEmbeddingResponse = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: jobDescription,
        config: {
            taskType: "RETRIEVAL_QUERY",
            outputDimensionality: EMBEDDING_DIMENSIONS,
        },
    })

    const queryEmbedding = queryEmbeddingResponse.embeddings[0].values

    const results = await questionModel.aggregate([
        {
            $vectorSearch: {
                index: "vector_index",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates: 150,
                limit: topK,
            },
        },
        {
            $project: {
                _id: 0,
                question: 1,
                category: 1,
                role: 1,
                difficulty: 1,
                score: { $meta: "vectorSearchScore" },
            },
        },
    ])

    return results
}


const interviewReportSchema = z.fromJSONSchema(interviewReportJsonSchema);

async function generateInterviewReport({resume,selfDescription,jobDescription}){
    // RAG step: retrieve real, relevant questions from our question bank
    // before asking Gemini to generate the report.
    const retrievedQuestions = await retrieveRelevantQuestions(jobDescription, 8)

    const questionBankContext = retrievedQuestions
        .map((q, i) => `${i + 1}. [${q.category}, ${q.difficulty}] ${q.question}`)
        .join("\n")

    const prompt = `Generate an interview report for a candidate with the following details:
                    Resume:${resume},
                    Self description:${selfDescription},
                    Job Description:${jobDescription}

                    Here are real interview questions from our question bank that are most
                    relevant to this job description (retrieved by semantic similarity):
                    ${questionBankContext}

                    When generating the technicalQuestions and behavioralQuestions fields,
                    prefer selecting and adapting questions from the list above where they fit
                    the candidate's profile and the job description. You may still generate
                    additional questions not in the list if needed to fully cover the role,
                    but ground your choices in the provided question bank first.
                    `

    const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
        response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: interviewReportJsonSchema
        },

    });
    const report = interviewReportSchema.parse(JSON.parse(interaction.output_text));
    return report;
}


async function generatePdfFromHtml(htmlContent){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent,{waitUntil:"networkidle0"})

    const pdfBuffer=await page.pdf({format:"A4",margin:{top:"20mm",bottom:"20mm",left:"15mm",right:"15mm"}})

    await browser.close()
    return pdfBuffer
}
    

async function generateResumePdf({resume,selfDescription,jobDescription}){
    const resumePdfJsonSchema = {
        type: "object",
        properties: {
            html: {
            type: "string",
            description: "The HTML content of the resume which can be converted to PDF using any library like puppeteer"
            }
        },
        required: ["html"]
    };

    const resumePdfSchema = z.fromJSONSchema(resumePdfJsonSchema);

    const prompt = `Generate resume for a candidate with the following details:
                    Resume:${resume},
                    Self description:${selfDescription},
                    Job Description:${jobDescription}    

                    The response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using library like Puppeteer.

                    The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience.

                    The content of the resume should not sound like it's generated by AI and should be as close as possible to a real human-written resume.

                    You can highlight the content using some colors or different font styles, but the overall design should be simple and professional.

                    the content should be ATS friendly, ie. should be easily parsable by ATS systems without loosing its important information.

                    The resume should not be so lengthy , it should ideally be 1-2 pages long when converted to pdf. Focus on quality rather than quantity. Make sure it includes all relevant information to increase the candidat's chances of getting interview call for the given job description
                    
                    `

    const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
        response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: resumePdfJsonSchema
        },

    });
    const resp_resume = resumePdfSchema.parse(JSON.parse(interaction.output_text));

    const pdfBuffer=await generatePdfFromHtml(resp_resume.html);

    return pdfBuffer
}


module.exports = {generateInterviewReport,generateResumePdf,retrieveRelevantQuestions }