import { verifyAccessToken } from '../utils/jwt.js';
import AppError from '../utils/appError.js';
import pool from '../database/db.js';


export const isAuth = async (req,res,next)=>{
    try {
        // Accept token from Authorization header (Bearer) or cookie as fallback
        let authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided, Please login.', 401);
        }
        
        const token = authHeader.split(' ')[1];

        if(!token){
            return next(new AppError('No token provided, Please login.',401))
        }

        const decode = verifyAccessToken(token);

        //Check if user still exists
        const result = await pool.query(`
            SELECT id, name, email, role FROM users WHERE id=$1    
        `,[decode.id])

        if(result.rows.length === 0){
            throw new AppError('User no longer exists',401)
        }

        const user = result.rows[0]
        if(!decode){
            return next(new AppError('Invalid token', 401));
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error)
        // If it's an AppError (our custom), pass it through
        if (error && error.isOperation) {
            return next(error);
        }
        // JWT library errors
        if(error.name === 'JsonWebTokenError'){
            return next(new AppError('Invalid token',401))
        }
        if(error.name === 'TokenExpiredError'){
            return next(new AppError('Token Expired',401))
        }
        next(error)
    }
}

export const isAdmin = (req, res, next)=> {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Admin only." });
    }
    next();
}
