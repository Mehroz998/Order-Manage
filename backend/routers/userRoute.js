import express from "express";
import {deleteUser, loginUser, logoutUser, refreshToken, registerUser, getAllUsers, forgetPassword, updateUser} from '../controller/userController.js'
import { isAdmin, isAuth } from "../middleware/Authentication.js";
import {body} from 'express-validator';


const router = express.Router()

// Register User /api/user
router.post('/register', [
    body('name').trim().notEmpty().escape(),
    body('email').normalizeEmail().trim().escape(),
    body('password').trim().escape(),
    body('confirmPassword').trim().escape(),
    body('role').optional().trim().escape()
] ,registerUser)
router.post('/login',[
    body('email').normalizeEmail().trim().escape(),
    body('password').trim().escape()
] ,loginUser)
router.post('/logout',isAuth, logoutUser)
// Refresh token endpoint should be public (does not require access token)
router.post('/refresh', refreshToken)
router.get('/', isAuth, isAdmin, getAllUsers)
router.delete('/delete/:id',isAuth,isAdmin,deleteUser)
router.put('/forget-password',forgetPassword)
router.put('/update/:id',isAuth,isAdmin,updateUser)



export default router