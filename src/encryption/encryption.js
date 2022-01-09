const bcrypt = require('bcrypt');
const hashPassword = async (password, saltRounds = 2) => {
    // Hash password
    return await bcrypt.hash(password, saltRounds);  
}
module.exports.hashPassword = hashPassword ;