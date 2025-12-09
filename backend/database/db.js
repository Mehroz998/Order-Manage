//Import Packages
import { Pool } from "pg";
import dotenv from 'dotenv'

//Load Environment Variables
dotenv.config()

//Create Pool
const pool = new Pool({
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    host:process.env.DB_HOST,
    port: process.env.DB_PORT,
    max: 20, 
    idleTimeoutMillis: 1000, 
    connectionTimeoutMillis: 1000, 
    maxUses: 7500,
  });
  
  pool.connect().then(()=>{
      console.log("DataBase Connected Successfully!")
  }).catch((err)=>{
      console.log("Error Occured ",err)
  })
  
  pool.on('error', function (error) {
      console.log("Error :",error)
  })
  
  export default pool