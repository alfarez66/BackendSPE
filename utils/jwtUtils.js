const jwt = require('jsonwebtoken')


const secretKey = "1234567890!@#$%^&*()"
const generateJwtToken = (user) => {
    return jwt.sign(
        { userId:user.id, email:user.email }, 
        secretKey, 
        {expiresIn:'120s'} 
        )
}
const refreshToken = (user) => {
    return jwt.sign(
        { userId:user.id, email:user.email }, 
        secretKey, 
        {expiresIn:'1d'} 
        )
}

const verifyJwtToken = (token) => {
    try{
        const user = jwt.verify(token, secretKey)
        return user
    } catch (error) {
        return null; // invalid token
    }
}


module.exports = {
    generateJwtToken,
    verifyJwtToken,
    refreshToken
}