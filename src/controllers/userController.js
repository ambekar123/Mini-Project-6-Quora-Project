const userModel = require("../models/userModel")
const bcrypt = require("bcrypt");
const encryption = require("../encryption/encryption")
const { isValid, isValidRequestBody, validateEmail, isValidObjectId, validatePhone } = require("../validator/validation")
const jwt = require("jsonwebtoken");

//Create User:
const createUser = async function (req, res) {
    try {
        const requestBody = req.body;
        const { fname, lname, email, phone, password, creditScore } = requestBody
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide user details' })
            return
        }

        if (!isValid(fname)) {
            res.status(400).send({ status: false, message: 'fname is required' })
            return
        }

        if (!isValid(lname)) {
            res.status(400).send({ status: false, message: `lname is required` })
            return
        }

        if (!isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }
        if (!validateEmail(email)) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        const isEmailAlreadyUsed = await userModel.findOne({ email }); // {email: email} object shorthand property 
        if (isEmailAlreadyUsed) {
            res.status(400).send({ status: false, message: `${email} email address is already registered` })
            return
        }
        if (phone) {
            if (!validatePhone(phone)) {
                res.status(400).send({ status: false, message: `phone should be a valid number` });
                return;
            }

            const isPhoneNumberAlreadyUsed = await userModel.findOne({ phone: phone });
            if (isPhoneNumberAlreadyUsed) {
                res.status(400).send({ status: false, message: `${phone} mobile number is already registered`, });
                return;
            }
        }
        if (!isValid(creditScore)) {
            res.status(400).send({ status: false, message: `CreditScore is required` })
            return
        }
        if (!(creditScore == 500)) {
            res.status(400).send({ status: false, message: `Credit Score must be 500` })
            return
        }

        if (!isValid(password)) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        }
        if (!(password.trim().length > 7 && password.trim().length < 16)) {
            res.status(400).send({ status: false, message: `${password} invalid` })
            return
        }

        const hashPassword = await encryption.hashPassword(password)
        requestBody.password = hashPassword;

        const userData = await userModel.create(requestBody)
        res.status(201).send({ status: true, msg: "User successfully created", data: userData })

    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}
module.exports.createUser = createUser

//Login User:
const loginUser = async function (req, res) {
    try {
        const requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
            return
        }
        const { email, password } = requestBody;
        if (!isValid(email)) {
            res.status(400).send({ status: false, message: `Email is required` })
            return
        }
        if (!validateEmail(email)) {
            res.status(400).send({ status: false, message: `Email should be a valid email address` })
            return
        }
        if (!isValid(password)) {
            res.status(400).send({ status: false, message: `Password is required` })
            return
        }
        if (!(password.trim().length > 7 && password.trim().length < 16)) {
            res.status(400).send({ status: false, message: `${password} is invalid` })
            return
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            res.status(401).send({ status: false, message: `Invalid login credentials` });
            return
        }
        const passOfUser = user.password
        const isValidPass = bcrypt.compareSync(password, passOfUser);
        if (!isValidPass) {
            res.status(401).send({ status: false, message: `Invalid login credentials` });
            return
        }
        userId = user._id
        let payload = { userId: userId }
        let token = await jwt.sign(payload,

            '4th-Jan-Quora-Project', { expiresIn: '10hr' })

        res.header('Authorization', token);
        res.status(200).send({ status: true, message: `User logged in successfully`, data: { userId, token } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}
module.exports.loginUser = loginUser

//Get User Details by UserId:
const getUserById = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!(isValid(userId) && isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: "userId is not valid" })
        }
        const tokenUserId = req.userId
        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        const getUserDetails = await userModel.findOne({ _id: userId })
        if (!getUserDetails) {
            res.status(404).send({ status: false, message: `User not found` })
            return
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }
        return res.status(200).send({ status: true, message: "User profile Details", data: getUserDetails })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.getUserById = getUserById

//Update User Details:
const updateUserDetails = async function (req, res) {
    try {
        const userId = req.params.userId
        if (!(isValid(userId) && isValidObjectId(userId))) {
            return res.status(400).send({ status: false, message: "productId is not valid" })
        }
        const tokenUserId = req.userId

        if (!isValidObjectId(userId) && !isValidObjectId(tokenUserId)) {
            return res.status(404).send({ status: false, message: "userId or token is not valid" })
        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            res.status(404).send({ status: false, message: `user not found` })
            return
        }
        if (!(userId.toString() == tokenUserId.toString())) {
            return res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
        }

        const requestBody = req.body
        const { fname, lname, email, phone } = requestBody
        const filter = {}
        if (isValid(fname)) {
            filter['fname'] = fname.trim()
        }
        if (isValid(lname)) {
            filter['lname'] = lname.trim()
        }

        if (email) {
            if (isValid(email)) {
                const checkEmail = await userModel.findOne({ email: email })
                if (!(checkEmail.length == 0)) {
                    return res.status(400).send({ status: false, message: `${email} is not unique` })
                }
                if (!validateEmail(email)) {
                    res.status(400).send({ status: false, message: `Email should be a valid email address` })
                    return
                }
                const isEmailAlreadyUsed = await userModel.findOne({ email }); // {email: email} object shorthand property 
                if (isEmailAlreadyUsed) {
                    res.status(400).send({ status: false, message: `${email} email address is already registered` })
                    return
                }
                filter['email'] = email.trim()
            }
        }
        if (phone) {
            if (isValid(phone)) {
                const checkphone = await userModel.findOne({ phone: phone })
                if (!(checkphone.length == 0)) {
                    return res.status(400).send({ status: false, message: `${phone} is not unique` })
                }
                if (!validatePhone(phone)) {
                    res.status(400).send({ status: false, message: `phone should be a valid number` });
                    return;
                }
                const isPhoneNumberAlreadyUsed = await userModel.findOne({ phone: phone });
                if (isPhoneNumberAlreadyUsed) {
                    res.status(400).send({ status: false, message: `${phone} mobile number is already registered`, });
                    return;
                }
                filter['phone'] = phone.trim()
            }
        }
        const updateUserDetails = await userModel.findOneAndUpdate({ _id: userId }, filter, { new: true })
        return res.status(200).send({ status: true, message: "Updated User Details", data: updateUserDetails })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
module.exports.updateUserDetails = updateUserDetails