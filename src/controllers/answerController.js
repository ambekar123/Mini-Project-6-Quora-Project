
const answerModel = require("../models/answerModel")
const questionModel = require("../models/questionModel")
const userModel = require("../models/userModel")
const { isValid, isValidRequestBody, isValidObjectId } = require("../validator/validation")

//Create Answer:
const createAnswer = async function (req, res) {
    try {
        const requestBody = req.body
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide answer details' })
            return
        }
        let { answeredBy, text, questionId } = requestBody
        const tokenUserId = req.userId
        if (!(isValid(answeredBy) && isValidObjectId(answeredBy))) {
            return res.status(400).send({ status: false, message: "userId/answeredBy is not valid" })
        }
        if (!(isValid(questionId) && isValidObjectId(questionId))) {
            return res.status(400).send({ status: false, message: "questionId is not valid" })
        }
        if (!isValidObjectId(answeredBy) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId/answeredBy or token is not valid" })
        }
        if (!(answeredBy == tokenUserId)) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }
        if (!isValid(text)) {
            res.status(400).send({ status: false, message: 'text is required' })
            return
        }
        let foundQuestion = await questionModel.findOne({ _id: questionId, isDeleted: false })
        if (!foundQuestion) {
            return res.status(400).send({ status: false, msg: 'Question is deleted or not found.' })
        }              
        if(!(answeredBy == foundQuestion.askedBy)){
            await userModel.findOneAndUpdate({_id:answeredBy},{$inc:{creditScore:+200}})
        const answerData = { answeredBy, text, questionId }
        const answer = await answerModel.create(answerData)
        res.status(201).send({ status: true, message: 'Answer created successfully', data: answer })
        }else{
            return res.status(400).send({ status: false, msg: 'You do not have access to answer the question which you have posted' })
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.createAnswer = createAnswer

//Get Questions By Id with answers:
const getQuestionsWithAnswers = async function (req, res) {
    try {
        let questionId = req.params.questionId
        if (!(isValid(questionId) && isValidObjectId(questionId))) {
            return res.status(400).send({ status: false, message: "questionId is not valid" })
        }
        const getQuestions = await questionModel.findOne({ _id: questionId, isDeleted: false }).lean()
        if (!getQuestions) {
            res.status(404).send({ status: false, message: `Question not found` })
            return
        }
        // let questions = getQuestions.toObject()
        let answer = await answerModel.find({ questionId: questionId, isDeleted: false }).select({ text: 1, answeredBy: 1, createdAt:1 }).sort({createdAt:-1})
        getQuestions.answers = answer
        return res.status(200).send({ status: true, message: "List of Question and Answer", data: getQuestions })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

module.exports.getQuestionsWithAnswers = getQuestionsWithAnswers

//Update Answer:
const updateAnswer = async function (req, res) {
    try {
        const answerId = req.params.answerId
        if (!(isValid(answerId) && isValidObjectId(answerId))) {
            return res.status(400).send({ status: false, message: "answerId is not valid" })
        }
        const tokenUserId = req.userId

        if (!isValidObjectId(answerId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "answerId or token is not valid" })
        }
        const answer = await answerModel.findOne({ _id: answerId, isDeleted: false })
        if (!answer) {
            res.status(404).send({ status: false, message: `answer not found or answer has been deleted` })
            return
        }
        let user = answer.answeredBy
        if (!(tokenUserId == user)) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }
        const requestBody = req.body
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Please provide details to update question' })
            return
        }
        const { text } = requestBody
        const filter = {}
        if (isValid(text)) {
            filter['text'] = text.trim()
        }

        const updateAnswerDetails = await answerModel.findOneAndUpdate({ _id: answerId, isDeleted: false }, filter, { new: true })
        return res.status(200).send({ status: true, message: "Updated Answer Details", data: updateAnswerDetails })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.updateAnswer = updateAnswer

//Delete Answer:
const deleteAnswer = async function (req, res) {
    try {
        const answerId = req.params.answerId
        if (!(isValidObjectId(answerId))) {
            return res.status(404).send({ status: false, message: "answerId is not valid" })
        };
        const tokenUserId = req.userId;

        if (!(isValidObjectId(tokenUserId))) {
            return res.status(404).send({ status: false, message: "token is not valid" })
        };
        const answer = await answerModel.findOne({ _id: answerId, isDeleted: false })
        if (!answer) {
            return res.status(404).send({ status: false, message: 'Answer not found or deleted' })
        }
        let user = answer.answeredBy
        if (!(tokenUserId == user)) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        };
        const deleteAnswer = await answerModel.findOneAndUpdate({ _id: answerId }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (deleteAnswer) {
            res.status(200).send({ status: true, msg: "The answer has been succesfully deleted" })
            return
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.deleteAnswer = deleteAnswer

