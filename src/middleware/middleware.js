const jwt = require("jsonwebtoken")

const authToken = function (req, res, next) {
    try {
         let token = req.header('Authorization', 'Bearer Token')
         if(!token){
             return res.status(401).send({ status: false, msg: "Missing authentication token" })
         }
         token= token.split(' ')
         
         if (!token[0] && !token[1]) {
             return res.status(401).send({ status: false, msg: "no authentication token" })
         } else {
             
             let decodeToken = jwt.decode(token[1], '4th-Jan-Quora-Project')
                 if (decodeToken) {
                 req.userId = decodeToken.userId
                 next()
             } else {
                 res.status(401).send({ status: false, msg: "not a valid token" })
             }
         }
 
     } catch (err) {
         console.log(err)
         res.status(500).send({ status: false, msg: err.message})
     }
 }
 module.exports.authToken = authToken