import express from "express";
import {loginUser, logoutUser, registerUser} from '../controller/userController.js'
import { isAuth } from "../middleware/Authentication.js";


const router = express.Router()

// Register User /api/user
router.post('/', registerUser)
router.post('/login', loginUser)
router.get('/logout',isAuth, logoutUser)

export default router