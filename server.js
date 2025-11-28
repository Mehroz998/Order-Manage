import express from 'express'
import userRouter from './routers/userRoute.js'
import productRoute from './routers/productRoute.js'
import orderRoute from './routers/orderRoute.js'
import cookieParser from 'cookie-parser'
import { cloudinaryConfig , uploadImage } from './config/cloudinaryConfig.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

//Cloudinary Setup
cloudinaryConfig()

//MiddleWares
app.use(express.json())
app.use(cookieParser())

// User Router
app.use('/api/users',userRouter)
app.use('/api/products',productRoute)
app.use('/api/orders',orderRoute)

app.get('/',(req,res)=>{
    res.send("Hello world")
    console.log(req.cookies.token)
})



app.listen(port,()=>{
    console.log(`Server Started at port http://localhost:${port}`)
})