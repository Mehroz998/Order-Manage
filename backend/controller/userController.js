import pool from '../database/db.js'
import bcrypt from 'bcrypt'
import AppError from '../utils/appError.js';
import { generateAccessToken, generateRefreshToken, isRefreshTokenValid, revokeAllUserTokens, revokeRefreshToken, storeRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sanitizeInput } from '../utils/sanitizeInput.js';

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// register user
export const registerUser = async (req , res)=>{
      //start time
    const startTime =  Date.now()
    console.log("Redister User start Time",startTime)
    const {name, email, password, confirmPassword, role} = sanitizeInput(req.body)
    try{
        //Check All fields
        if(!name || !email || !password || !confirmPassword){
            return res.json({message:"Required All Fields"})
        }
        // type of password must be string
        if(typeof password != 'string'){
            return res.json({message:"password must be in string"})
        }

        //Name only contain letter
        if (!/^[A-Za-z\s]+$/.test(name.trim())) {
            return res.json({message:"Name must only contain letters"})
        }

        if(!validateEmail(email)){
            return res.json({message:"Enter Email in right format"})
        }
        
        // Check Confirm Password
        if(password !== confirmPassword){
            return res.json({message: "Confirm Password not match"})
        }
        //Check user exist or not
        const exists = await pool.query(`SELECT * FROM users WHERE email= $1`,[email])
        if(exists.rows.length > 0){
            return res.json({message:"email is already exists"})
        }
        //Hash Password
        const hashPassword = await bcrypt.hash(password,10)
        const userRole = role ?? 'user'
        
        //Create User
        const result = await pool.query(`
            INSERT INTO users(name,email,password,role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at  
            `,[name, email, hashPassword, userRole]
        )
        const user = result.rows[0]
        //end time
        const endTime =  Date.now()
        console.log("Redister User End Time",endTime)
        console.log("Time",endTime-startTime)

        res.status(201).json({
            success:true,
            message:"Registration Successful",
            data:{
                id:user.id,
                name:user.name, 
                email:user.email,
                role:user.role,
                created_at:user.created_at
            }
        })
    }catch(err){
        res.status(400).json({
            success:false,
            Error:`Error Occured ${err}`
        })
    }

}

//login user
export const loginUser = async (req , res)=>{
        //start time
    const startTime =  Date.now()
    console.log("Login User start Time",startTime)
    const {email, password} = sanitizeInput(req.body)
    try{
        // Check both fields
        if(!email || !password){
            return res.json({message:"All fields are required"})
        }
        //Check password type
        if(typeof password != 'string'){
            return res.json({message:"All fields are required"})
        }
        // Check user exists or not by email
        const user = await pool.query(`SELECT * FROM users WHERE email=$1`,[email])
        // if user not exists
        if(user.rows.length === 0){
            return res.status(401).json({message:"Incorrect Email  or Password"})
        }
        // if user exist check password using bcrypt
        const isPasswordMatch = await bcrypt.compare(password,user.rows[0].password)
        // check password true or not
        if(!isPasswordMatch){
            return res.status(401).json({message:"Incorrect Email  or Password"})
        }

        // JWT Token
        const accessToken = generateAccessToken(user.rows[0])
        const refreshToken = generateRefreshToken(user.rows[0])
        
        //Store refresh token
        await storeRefreshToken(user.rows[0].id,refreshToken)
        
        //end time
        const endTime =  Date.now()
        console.log("Login User End Time",endTime)
        console.log("Time",endTime-startTime)

        // res and store token in cookie
        res.status(200).json({
            success:true,
            message:"Login Successful",
            data:{
                user:{
                    id:user.rows[0].id,
                    name:user.rows[0].name,
                    email:user.rows[0].email,
                    role:user.rows[0].role
                },
                tokens:{
                    accessToken,
                    refreshToken
                }
            }
        })
    }catch(err){
        console.log("Login Failed",err)
        throw new AppError("Internal Error",401)
    }
}

//Refresh Acces Token
export const refreshToken = async (req, res)=>{
      //start time
    const startTime =  Date.now()
    console.log("Refresh Token start Time",startTime)
    const {refreshToken} = req.body
    
    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    // Check if token is valid in database
    const isValid = await isRefreshTokenValid(refreshToken);
    if (!isValid) {
        throw new AppError('Invalid or expired refresh token', 401);
    }  

    // Verify token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user
    const result = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [decoded.id]
    );

    if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
    }

    const user = result.rows[0];

    //Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    //Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    // Store new refresh token
    await storeRefreshToken(user.id, newRefreshToken);
    
    //end time
    const endTime =  Date.now()
    console.log("Refresh Token End Time",endTime)
    console.log("Time",endTime-startTime)

    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            tokens: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        }
    });
}

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
      //start time
    const startTime =  Date.now()
    console.log("Get All Users start Time",startTime)
    try {
        const result = await pool.query(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`);
        //end time
        const endTime =  Date.now()
        console.log("Get All Users End Time",endTime)
        console.log("Time",endTime-startTime)

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching users", error: err });
    }
};

export const deleteUser = async (req, res)=>{
        //start time
    const startTime =  Date.now()
    console.log("Delete User start Time",startTime)
    const {id} = req.params
    
    if(!id){
        return res.json({message:"ID Required"})
    }

    //User exists or not
    const result = await pool.query(`
        SELECT id, name, email, role FROM users WHERE id=$1
        `,[id])
        const user = result.rows[0]

    if(!user){
        return res.json({message:"User not Found"})
    }
    // Admin not delete any admin
    if(req.user.id === id || user.role === 'admin'){
        return res.json({message:"Access Denied, You not delete Admin"})
    }
    
    //User Delete
    const deletedUser = await pool.query(`
        DELETE FROM users WHERE id=$1 RETURNING id, name, email   
        `,[id])
        
        //Logout From All Devices
        revokeAllUserTokens(id)

        //end time
        const endTime =  Date.now()
        console.log("Delete User End Time",endTime)
        console.log("Time",endTime-startTime)
        
        res.json({
            success:true,
            message:"User Deleted Successfully",
        data:{
            user:deletedUser.rows[0]
        }
    })
}

// logout user
export const logoutUser = async(req, res)=>{
      //start time
    const startTime =  Date.now()
    console.log("Logout User start Time",startTime)
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }
        // revoke refresh token
        await revokeRefreshToken(refreshToken);

        //end time
        const endTime =  Date.now()
        console.log("Logout User End Time",endTime)
        console.log("Time",endTime-startTime) 

        return res.json({ success:true,message: "Logout Successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

//Forget Password
export const forgetPassword = async (req, res)=>{
      //start time
    const startTime =  Date.now()
    console.log("Forget Password start Time",startTime)
    const {email, password, confirmPassword} = sanitizeInput(req.body)
    try{
        // Check all fields
        if(!email || !password || !confirmPassword){
            return res.json({message:"All fields are required"})
        }
        // Validate email format
        if(!validateEmail(email)){
            return res.json({message:"Enter Email in right format"})
        }
        // Check Confirm Password
        if(password !== confirmPassword){
            return res.json({message: "Confirm Password not match"})
        }
        // Check user exists or not by email
        const user = await pool.query(`SELECT * FROM users WHERE email=$1`,[email])
        // if user not exists
        if(user.rows.length === 0){
            return res.status(401).json({message:"Incorrect Email"})
        }
        //Hash New Password
        const hashPassword = await bcrypt.hash(password,10)
        //Update Password
        await pool.query(`
            UPDATE users SET password=$1 WHERE email=$2
            `,[hashPassword, email]
        )
        //end time
        const endTime =  Date.now()
        console.log("Forget Password End Time",endTime)
        console.log("Time",endTime-startTime)

        res.status(200).json({
        success:true,
        message:"Password Updated Successfully"
        })
    }catch(err){
        res.status(400).json({
            success:false,
            Error:`Error Occured ${err}`
        })
    }
}

//Edit User 
export const updateUser = async (req, res) => {
      //start time
    const startTime =  Date.now()
    console.log("Update User start Time",startTime)
    const id = req.params.id;
    const { name, email, role } = sanitizeInput(req.body);

    try {
        if (!id) {
            return res.json({ message: "Id Required for Update Product" });
        }

        // Check product exists
        const existing = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
        if (existing.rows.length === 0) {
            return res.json({ message: "User not found" });
        }

        // --- Dynamic update fields ---
        const fields = [];
        const values = [];
        let index = 1;

        if (name) {
            fields.push(`name = $${index++}`);
            values.push(name);
        }
        if (email) {
            fields.push(`email = $${index++}`);
            values.push(email);
        }
        if (role) {
            fields.push(`role = $${index++}`);
            values.push(role);
        }

        // If no field provided
        if (fields.length === 0) {
            return res.json({ message: "No fields provided to update" });
        }

        // Add id in values
        values.push(id);

        // Build final query
        const query = `
        UPDATE users
        SET ${fields.join(", ")}
            WHERE id = $${index}
            RETURNING *
        `;
        
        const updated = await pool.query(query, values);
        
        //end time
        const endTime =  Date.now()
        console.log("Update User End Time",endTime)
        console.log("Time",endTime-startTime)
        
        return res.json({
            message: "user updated successfully",
            user: updated.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating user", error: err });
    }
}
