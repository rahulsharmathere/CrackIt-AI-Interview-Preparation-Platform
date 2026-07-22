const mongoose = require("mongoose")

const blacklistedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to be added to the blacklist"],
    }
},{timestamps:true})

const tokenBlacklistModel=mongoose.model("BlacklistedToken", blacklistedTokenSchema)

module.exports=tokenBlacklistModel