const mongoose = require('mongoose')

/**
 * Question bank model, used for RAG-based retrieval.
 *
 * -question: String
 * -category: String   (e.g. dsa, backend, frontend, system-design, behavioral, cs-fundamentals)
 * -role: String        (e.g. SDE-1)
 * -difficulty: String  (easy | medium | hard)
 * -embedding: [Number] (vector generated from the question text, used by $vectorSearch)
 */

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Question is required"]
    },
    category: {
        type: String,
        required: [true, "Category is required"]
    },
    role: {
        type: String,
        required: [true, "Role is required"]
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: [true, "Difficulty is required"]
    },
    embedding: {
        type: [Number],
        required: [true, "Embedding is required"]
    }
}, {
    timestamps: true
})

const questionModel = mongoose.model('Question', questionSchema)

module.exports = questionModel