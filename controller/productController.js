import { uploadImage } from "../config/cloudinaryConfig.js"
import pool from "../database/db.js"

export const readProduct = async (req, res)=>{
    try{
        const result = await pool.query(`
            SELECT * FROM products ORDER BY id ASC           
       `)
        if(result.rows.length===0){
            return res.json({message:"Products not Found"})
        }
        res.status(200).json({
            success:true,
            count:result.rows.length,
            data:result.rows
        })    

    }catch(err){
        res.json({
            success:false,
            error:`Internal Error ${err}`
        })
    }
}

export const addProduct = async (req , res)=>{
    const {product_name, price, count, image} = req.body
    try{
        console.log(image)
        if(!product_name || !price){
            return res.json({message:"All fields are Required"})
        }
        // //Convert product name in lower case
        const p_name = product_name.toLowerCase()
        // // check product is already exist
        const product = await pool.query(`SELECT * FROM products WHERE product_name = $1`,[p_name])
        if(product.rows.length > 0){
            return res.json({message:"Product already exist"})
        }
        // // Check image if exists upload in cloudnari
        if(image){
            var image_url = await uploadImage(image)
        }
        //Generate product code
        const code = Math.floor((Math.random()*1000000)+1)
        const countValue = count ?? 1 
        await pool.query(`
            INSERT INTO products (product_name, product_code, count, price, images) VALUES ($1, $2, $3, $4, $5)
        `,[p_name, code, countValue, price, image_url]
        )
        //Get add item
        const result = await pool.query(`SELECT * FROM products WHERE product_name = $1`,[p_name])
        res.status(201).json({
            success:true,
            message:"Product Add Successfully",
            data:result.rows
        })

    }catch(err){
        res.status(400).json({
            success:false,
            message:`Error in Add product ${err}`
        })
    }
};

export const deleteProduct = async(req, res)=>{
    const id = req.params.id
    try{
        //Check product exist or not
        const result = await pool.query(`SELECT * FROM products WHERE id = $1`,[id])
        if(result.rows.length === 0 ){
            return res.json({message:"Product not Found"})
        }
        
        await pool.query(`
            DELETE FROM products WHERE id = $1            
        `,[id])

        res.json({
            success:true,
            message:"User Delete Successful"
        })
    }catch(err){
        res.json({
            success:false,
            error:`Internal Error ${err}`
        })
    }
};

export const updateProduct = async (req, res) => {
    const id = req.params.id;
    const { product_name, price, count } = req.body;

    try {
        if (!id) {
            return res.json({ message: "Id Required for Update Product" });
        }

        // Check product exists
        const existing = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);
        if (existing.rows.length === 0) {
            return res.json({ message: "Product not found" });
        }

        // --- Dynamic update fields ---
        const fields = [];
        const values = [];
        let index = 1;

        if (product_name) {
            fields.push(`product_name = $${index++}`);
            values.push(product_name);
        }
        if (price) {
            fields.push(`price = $${index++}`);
            values.push(price);
        }
        if (count) {
            fields.push(`count = $${index++}`);
            values.push(count);
        }

        // If no field provided
        if (fields.length === 0) {
            return res.json({ message: "No fields provided to update" });
        }

        // Add id in values
        values.push(id);

        // Build final query
        const query = `
            UPDATE products
            SET ${fields.join(", ")}
            WHERE id = $${index}
            RETURNING *
        `;

        const updated = await pool.query(query, values);

        return res.json({
            message: "Product updated successfully",
            product: updated.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating product", error: err });
    }
};
