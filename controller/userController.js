import pool from '../database/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// register user
export const registerUser = async (req , res)=>{
    const {name, email, password, confirmPassword, role} = req.body
    try{
            //Check All fields
        if(!name || !email || !password || !confirmPassword){
            return res.json({message:"Required All Fields"})
        }
        // type of password must be string
        if(typeof password != 'string'){
            return res.json({message:"password must be in string"})
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
        await pool.query(`
            INSERT INTO users(name,email,password,role) VALUES ($1, $2, $3, $4)   
        `,[name, email, hashPassword, userRole]
        )
        res.status(201).json({
            success:true,
            message:"User Added Successfuly",
            data:{
                name, 
                email,
                userRole
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
    const {email, password} = req.body
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
            return res.json({message:"Incorrect Email (user not found)"})
        }
        // if user exist check password using bcrypt
        const isPasswordMatch = await bcrypt.compare(password,user.rows[0].password)
        // check password true or not
        if(!isPasswordMatch){
            return res.json({message:"Incorrect Password"})
        }
        // JWT Token
        const token = await jwt.sign(
            {id:user.rows[0].id , role:user.rows[0].role},
            process.env.SECRET_KEY,
            {expiresIn:'1D'}
        )
        // res and store token in cookie
        res.status(200).cookie("token",token,{httpOnly:true,sameSite:'lax',secure:false}).json({
            success:true,
            message:"Thanks For Login",
            token:token
        })
    }catch(err){
        res.status(400).json({
            success:false,
            error:`Error Occuered: ${err}`
        })
    }
}


export const logoutUser = async(req, res)=>{
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "Lax"
        });

        return res.json({ message: "Logout Successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}