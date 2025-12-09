import jwt from 'jsonwebtoken'
import pool from '../database/db.js'
import AppError from './appError.js';

//Generate Access/JWT Token
export const generateAccessToken = (user)=>{
    const payload = {
        id:user.id,
        email:user.email,
        role:user.role
    };
    return jwt.sign(payload, process.env.SECRET_KEY,{expiresIn:'1D'})
}

//Generate Refresh Token
export const generateRefreshToken = (user)=>{
    const payload = {
        id:user.id,
        tokenVersion: Date.now()
    }

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET,{expiresIn:'7d'})
}

//Verify Access Token
export const verifyAccessToken = (token)=>{
    try{
        return jwt.verify(token, process.env.SECRET_KEY)
    }catch(err){
        console.log("Access Token Verification Error",err)
        throw new AppError("Invalid or expired token",401)
    }
}

// Verify refresh token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        console.error('Refresh token verification error:', error);
        throw new AppError('Invalid or expired Refresh Token',401);
    }
};

// Store refresh token in database
export const storeRefreshToken = async (userId, token) => {
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await pool.query(`
    INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
    );
};

// Revoke refresh token
export const  revokeRefreshToken = async (token) => {
    await pool.query(`
    UPDATE refresh_tokens SET revoked = true WHERE token = $1`,
    [token]
    );
};

// Revoke all user's refresh tokens (for logout from all devices)
export const revokeAllUserTokens = async (userId) => {
    await pool.query(`
    UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`,
    [userId]
    );
};
// Check if refresh token is valid (not revoked and not expired)
export const isRefreshTokenValid = async (token) => {
    const result = await pool.query(
        `SELECT * FROM refresh_tokens
        WHERE token = $1 AND revoked = false AND expires_at > NOW()`,
        [token]
    );
    return result.rows.length > 0;
};
// Clean up expired refresh tokens (run periodically)
export const cleanupExpiredRefreshTokens = async () => {
    await pool.query(
        `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = true`
    );
    return result.rowCount;
};

