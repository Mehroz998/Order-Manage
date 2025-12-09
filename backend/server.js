import express from 'express'
import cors from 'cors'
import userRouter from './routers/userRoute.js'
import productRoute from './routers/productRoute.js'
import orderRoute from './routers/orderRoute.js'
import cookieParser from 'cookie-parser'
import otpRoute from './routers/otpRoute.js'
import { cloudinaryConfig , uploadImage } from './config/cloudinaryConfig.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

// Configure CORS to allow frontend origin and send cookies
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3001'
app.use(cors({ origin: clientOrigin, credentials: true }))
// don't register a global '*' options route (path-to-regexp treats '*' as invalid);
// the app.use(cors(...)) above already enables CORS and handles preflight for routes.

//Cloudinary Setup
cloudinaryConfig()

//MiddleWares
// increase body size limits to accept base64 image uploads from the frontend
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())
// note: cors already applied above with credentials support

// User Router
app.use('/api/users',userRouter)
//Product Router
app.use('/api/products',productRoute)
//Order Router
app.use('/api/orders',orderRoute)
// OTP Router
app.use('/api/otp',otpRoute)

app.get('/',(req,res)=>{
    res.send("Hello world")
    console.log(req.cookies.token)
})



app.listen(port,()=>{
    console.log(`Server Started at port http://localhost:${port}`)
})