const questionModel = require("../models/questionModel")
const answerModel = require("../models/answerModel")
const userModel = require("../models/userModel")
const { isValid, isValidRequestBody, isValidObjectId} = require("../validator/validation")

//Create Question:
const createQuestion = async function (req, res) {
    try {
        let requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide user details' })
            return
        }
        let userId = requestBody.userId
        if (!(isValid(userId) && isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: "userId is not valid" })
        }
        const isUserIdExist = await userModel.findOne({ _id: userId })
        if (!isUserIdExist) return res.status(400).send({ status: false, message: `${userId} does not exist` })

        const tokenUserId = req.userId
        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }
        let { description, tag, isDeleted } = requestBody
        if (!isValid(description)) {
            res.status(400).send({ status: false, message: 'description is required' })
            return
        }

        const user = await userModel.findOne({ _id: userId })
        let askedBy = user._id
        const getCreditSCore = user.creditScore
        if(getCreditSCore>=100){
        const questionData = {
            "description": requestBody.description,
            "tag": requestBody.tag,
            "askedBy": askedBy,
            isDeleted: isDeleted ? isDeleted : false,
            deletedAt: isDeleted ? new Date() : null
        }
        await userModel.findOneAndUpdate({_id:userId},{$inc:{creditScore:-100}})
        const question = await questionModel.create(questionData)
        res.status(201).send({ status: true, message: 'Question created successfully', data: question })
        }else{
            return res.status(400).send({status:false,msg:'Do not have enof credit score to add a question'})
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.createQuestion = createQuestion

//Get Questions:
const getQuestion = async function (req, res) {
    try {
        let query = req.query
        let { tag, Sort } = query
        let filter = { isDeleted: false }
        if (isValid(tag)) {
            const arrtag = tag.split(',')
            filter['tag'] = {$all:arrtag} //$regex: tag.trim() }
        }
        if (Sort) {
            if (!(Sort == -1 || Sort == 1)) {
                return res.status(400).send({ status: false, message: ' Please provide Sort value 1 || -1 ' })
            }
        }
        let QuestionsOfQuery = await questionModel.find(filter).lean().sort({ createdAt: Sort })

        for(let i = 0; i<QuestionsOfQuery.length; i++){
            let answer = await answerModel.find({questionId:QuestionsOfQuery[i]._id}).select({text:1,answeredBy:1,createdAt:1}).sort({createdAt:-1})
            QuestionsOfQuery[i].answers = answer
        }

        if (Array.isArray(QuestionsOfQuery) && QuestionsOfQuery.length === 0) {
            return res.status(404).send({ status: false, message: 'No questions found' })
        }
        return res.status(200).send({ status: true, message: 'Questions list', data: QuestionsOfQuery })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.getQuestion = getQuestion

//Get Questions by questionID:
const getQuestionsById = async function (req, res) {
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
        let answer = await answerModel.find({ questionId: questionId, isDeleted:false }).select({ text: 1, answeredBy: 1 ,createdAt:1}).sort({createdAt:-1})
        getQuestions.answers = answer
        return res.status(200).send({ status: true, message: "List of Question and Answer", data: getQuestions })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.getQuestionsById = getQuestionsById

//Update Question:
const updateQuestion = async function (req, res) {
    try {
        const questionId = req.params.questionId
        if (!(isValid(questionId) && isValidObjectId(questionId))) {
            return res.status(400).send({ status: false, message: "questionId is not valid" })
        }
        const tokenUserId = req.userId

        if (!isValidObjectId(questionId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "questionId or token is not valid" })
        }
        const question = await questionModel.findOne({ _id: questionId, isDeleted:false })
        if (!question) {
            res.status(404).send({ status: false, message: `question not found or question has been deleted` })
            return
        }
        let user = question.askedBy
        if (!(tokenUserId == user)) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }
        const requestBody = req.body
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Please provide details to update question' })
            return
        }
        const { description, tag } = requestBody
        const filter = {}
        if (isValid(description)) {
            filter['description'] = description.trim()
        }
        if (Object.prototype.hasOwnProperty.call(requestBody, 'tag')) {
            if (isValid(tag)) {
                return res.status(400).send({ status: false, message: `tag is required` })
            }
            filter['tag'] = tag
        }
        const updateQuestionDetails = await questionModel.findOneAndUpdate({ _id:questionId }, filter, { new: true })
        return res.status(200).send({ status: true, message: "Updated Question Details", data: updateQuestionDetails })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.updateQuestion = updateQuestion

//Delete Question:
const deleteQuestion = async function (req, res) {
    try {
        const questionId = req.params.questionId
        if (!(isValid(questionId) && isValidObjectId(questionId))) {
            return res.status(404).send({ status: false, message: "questionId is not valid" })
        }
        const tokenUserId = req.userId

        if (!isValidObjectId(questionId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "questionId or token is not valid" })
        }
        const question = await questionModel.findOne({ _id: questionId })
        if (!question) {
            res.status(404).send({ status: false, message: `question not found` })
            return
        }
        let user = question.askedBy
        if (!(tokenUserId == user)) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }
        const deletedQuestion = await questionModel.findOneAndUpdate({ _id: questionId, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true })
        if (deletedQuestion) {
            res.status(200).send({ status: true, msg: "The question has been succesfully deleted" })
            return
        }
        res.status(404).send({ status: false, message: `Question already deleted not found` })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.deleteQuestion = deleteQuestion
