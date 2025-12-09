import express from 'express'
import { isAuth, isAdmin } from '../middleware/Authentication.js'
import { createOrder, getUserOrders, getAllOrders } from '../controller/orderController.js'

const router = express.Router()

router.post('/',isAuth,createOrder)
router.get('/',isAuth,isAdmin,getAllOrders)
router.get('/:userId',isAuth,getUserOrders)

export default router