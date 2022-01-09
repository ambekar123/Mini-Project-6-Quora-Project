const express = require("express");
const router = express.Router();
const userController= require('../controllers/userController')
const questionController = require('../controllers/questionController')
const answerController = require('../controllers/answerController')
const middleware = require("../middleware/middleware")

//User API:
router.post("/register", userController.createUser)
router.post("/login", userController.loginUser)
router.get('/user/:userId/profile', middleware.authToken, userController.getUserById);
router.put('/user/:userId/profile', middleware.authToken, userController.updateUserDetails);

//Question API:
router.post('/question', middleware.authToken, questionController.createQuestion);
router.get('/questions', questionController.getQuestion);
router.get('/questions/:questionId', questionController.getQuestionsById);
router.put('/questions/:questionId', middleware.authToken,questionController.updateQuestion);
router.delete('/questions/:questionId', middleware.authToken,questionController.deleteQuestion);

//Answer API:
router.post('/answer', middleware.authToken, answerController.createAnswer);
router.get('/questions/:questionId/answer', answerController.getQuestionsWithAnswers);
router.put('/answer/:answerId', middleware.authToken,answerController.updateAnswer);
router.delete('/answer/:answerId', middleware.authToken,answerController.deleteAnswer);
module.exports = router;
