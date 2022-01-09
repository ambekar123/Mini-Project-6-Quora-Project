const mongoose = require("mongoose")

const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === 'null') { return false } //if undefined or null occur rather than what we are expecting than this particular feild will be false.
    if (value.length == 0) { return false } //if user give spaces not any string eg:- "  " =>here this value is empty, only space is there so after trim if it becomes empty than false will be given. 
    if (typeof (value) === 'string' && value.length > 0) { return true } //to check only string is comming and after trim value should be their than only it will be true.
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const validateEmail = function (email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email.trim())
};

const validatePhone = function (phone) {
    var re =/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/ ;
    if(typeof(phone) == 'string'){
    return re.test(phone.trim())
    }else{
        return re.test(phone)
    }
};

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

module.exports = { isValid, isValidRequestBody, validateEmail,isValidObjectId,
    validatePhone}