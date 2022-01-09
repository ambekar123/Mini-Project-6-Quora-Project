const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId
const answerSchema = new mongoose.Schema({

    answeredBy: {type: ObjectId, ref:'quser', required:true},
    questionId: {type: ObjectId, ref:'question', required:true}, 
    text: {type: String, required: true},
    deletedAt: {type:Date}, 
    isDeleted: {type:Boolean, default: false},
   
},{timestamps:true})

module.exports = mongoose.model("answer",answerSchema)