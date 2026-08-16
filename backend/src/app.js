const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}))
// require all the routes here 
const authRouter=require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

// using all the routes here 
app.use("/api/auth",authRouter)
app.use("/api/interview",interviewRouter)

// global error handler - catches errors from fileFilter, multer limits,
// and any async controller error Express forwards via next(err)
app.use((err, req, res, next) => {
    console.error(err)
    const status = err.statusCode || err.status || 500
    res.status(status).json({
        message: err.message || "Something went wrong. Please try again."
    })
})

module.exports=app 