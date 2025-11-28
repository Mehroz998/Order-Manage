import express from 'express'
import { addProduct, deleteProduct, readProduct, updateProduct } from '../controller/productController.js'
import { isAdmin , isAuth } from '../middleware/Authentication.js'

const router = express.Router()

router.get('/',isAuth,isAdmin,readProduct)
router.post('/',isAuth,isAdmin,addProduct)
router.post('/delete/:id',isAuth,isAdmin,deleteProduct)
router.put('/update/:id',isAuth,isAdmin,updateProduct)

export default router