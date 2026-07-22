const { GoogleGenAI } = require("@google/genai")
const {z}=require("zod")




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
                    skills:{type:"string",description:"the skill which the candidate is lacking"},
                    severity:{type:"string",enum: ["low", "medium", "high"],description:"The severity of the skill gap"},
                },
                required:["skills","severity"]
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
        }
    },
    required: ["matchScore", "technicalQuestions", "behavioralQuestions","skillGaps","preparationPlan"]

};


const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
})


const interviewReportSchema = z.fromJSONSchema(interviewReportJsonSchema);

async function generateInterviewReport({resume,selfDescription,jobDescription}){    
    const prompt = `Generate an interview report for a candidate with the following details:
                    Resume:${resume},
                    Self description:${selfDescription},
                    Job Description:${jobDescription}    
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

module.exports = generateInterviewReport