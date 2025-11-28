import jwt from 'jsonwebtoken'

export const isAuth = (req,res,next)=>{
    try {
        const token = req.cookies.token;
        if(!token){
            return res.json({message:"User not Authenticated"})
        }
        const decode = jwt.verify(token,process.env.SECRET_KEY)
        if(!decode){
            return res.json({message:"Invalid Token"})
        }
        req.user = decode
        next();
    } catch (error) {
        console.log(error)
    }
}

export const isAdmin = (req, res, next)=> {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Admin only." });
    }
    next();
}
