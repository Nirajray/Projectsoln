const jwt = require("jsonwebtoken")

const authorAuth =  function(req, res, next){
try{
    const token = req.header('x-api-key')
    if(!token){
        res.status(403).send({status:false, message:'Missing authentication token request'})
        return;
    }

    const decoded= jwt.verify(token, 'somesecureprivatekey')

    if(!decoded){
        res.status(403).send({status:false, message:'Invalid token'})
        return;
    }
req.authorId = decoded.authorId
next()
}
catch (error) {
        res.status(500).send({ status: false, message: error.message })
    
  }
}

module.exports.authorAuth=authorAuth