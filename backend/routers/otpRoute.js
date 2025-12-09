import express from 'express'
// import { addProduct, deleteProduct, readProduct, updateProduct } from '../controller/productController.js'
import { generateOtp, verifyOtp } from '../controller/otpController.js'

const router = express.Router()

router.post('/generate-otp',generateOtp)
router.post('/verify-otp',verifyOtp)

export default router