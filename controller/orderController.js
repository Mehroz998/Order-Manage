import pool from "../database/db.js";

export const createOrder = async (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    try {
        if (!user_id || !product_id || !quantity) {
            return res.json({ message: "user id, product id and quantity required" });
        }

        // Check user
        const user = await pool.query(`SELECT * FROM users WHERE id = $1`, [user_id]);
        if (user.rows.length === 0) {
            return res.json({ message: "User not found" });
        }

        // Check product
        const product = await pool.query(`SELECT * FROM products WHERE id = $1`, [product_id]);
        if (product.rows.length === 0) {
            return res.json({ message: "Product not found" });
        }

        const p = product.rows[0];

        // Check stock
        if (p.count < quantity) {
            return res.json({ message: "Not enough stock available" });
        }

        // Check if order already exists for same user + product
        const existingOrder = await pool.query(
            `SELECT * FROM orders WHERE user_id = $1 AND product_id = $2`,
            [user_id, product_id]
        );

        let finalOrder;

        if (existingOrder.rows.length > 0) {
            // ------- UPDATE EXISTING ORDER -------
            const oldOrder = existingOrder.rows[0];

            const newQuantity = Number(oldOrder.quantity) + Number(quantity);
            const newTotal = Number(p.price) * newQuantity;

            finalOrder = await pool.query(
                `UPDATE orders 
                 SET quantity = $1, total_price = $2 
                 WHERE id = $3
                 RETURNING *`,
                [newQuantity, newTotal, oldOrder.id]
            );
        } else {
            // ------- INSERT NEW ORDER -------
            const total_price = Number(p.price) * Number(quantity);

            finalOrder = await pool.query(
                `INSERT INTO orders (user_id, product_id, quantity, total_price)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [user_id, product_id, quantity, total_price]
            );
        }

        // Reduce stock
        await pool.query(
            `UPDATE products SET count = count - $1 WHERE id = $2`,
            [quantity, product_id]
        );

        res.json({
            message: "Order placed successfully",
            order: finalOrder.rows[0]
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error creating order", error: err });
    }
};

export const getUserOrders = async (req, res) => {
    const userId = req.params.userId;
    let overall_price = 0
    try {
        const orders = await pool.query(`
            SELECT 
                products.product_name,
                orders.id AS order_id,
                orders.quantity,
                orders.total_price,
                orders.status,
                orders.created_at,
                products.price
            FROM orders
            JOIN products ON products.id = orders.product_id
            WHERE orders.user_id = $1
            ORDER BY orders.created_at DESC
        `, [userId]);

        if (orders.rows.length === 0) {
            return res.json({ message: "No orders found for this user" });
        }

        orders.rows.map(order =>(
            overall_price = overall_price + JSON.parse(order.total_price)
        ))

        res.json({
            count: orders.rows.length,
            total_price:overall_price,
            message: "Orders fetched successfully",
            orders: orders.rows
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching orders", error: err });
    }
};


