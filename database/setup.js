import pool from "./db.js"

const startDB = async ()=>{
    try{
        console.log("Setting up Database...")
        await pool.query(`
                CREATE TABLE IF NOT EXISTS users(
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(30) NOT NULL,
                    email VARCHAR(120) NOT NULL UNIQUE,
                    password VARCHAR(120) NOT NULL ,
                    role VARCHAR(120) DEFAULT 'user' CHECK (role IN ('user','admin')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) 
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products(
                id SERIAL PRIMARY KEY,
                product_name VARCHAR(30) NOT NULL,
                product_code VARCHAR(120) NOT NULL,
                count INTEGER,
                images TEXT,
                price INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) 
        `)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            quantity INT NOT NULL,
            total_price NUMERIC(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
        );
        `)
        
        console.log("Table created successfully")
        console.log("Database successfully setup")
        process.exit(0)
    }catch(err){
        console.log("Error Occuered: ",err)
        process.exit(1)
    }
}

startDB()