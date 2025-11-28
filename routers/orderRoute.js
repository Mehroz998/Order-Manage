import express from 'express'
import { isAuth } from '../middleware/Authentication.js'
import { createOrder, getUserOrders } from '../controller/orderController.js'

const router = express.Router()

router.post('/',isAuth,createOrder)
router.get('/:userId',isAuth,getUserOrders)

export default router