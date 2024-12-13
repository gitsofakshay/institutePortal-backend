const jwt = require('jsonwebtoken');
require('dotenv').config();

const fetchuser = (req,res,next)=>{
    //Get the token to the jwt and add id to the req object
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({error:"Please authenticate using valid token"});
    }
    try {
        const data = jwt.verify(token,process.env.JWT_SECRET);
        req.user = data.user;
        next();
    } catch (error) {
        res.status(401).send({error:"Please authenticate using valid token"});        
    }
}
module.exports = fetchuser;