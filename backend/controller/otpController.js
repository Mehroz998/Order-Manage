import nodemailer from 'nodemailer';
import pool from '../database/db.js';

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  service: 'gmail',  
  secure: false, // true for 465, false for other ports
  auth: {
    user: "mehrozali689@gmail.com",
    pass: "nywf xqwy lohh dryc",
  },
});


let otpStore = {};

const otp = (length = 4) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
};

const sendOtpEmail = async (to, otpCode) => {
  const info = await transporter.sendMail({
    from: 'mehrozali689@gmail.com',
    to,
    subject: "OTP Verification",
    text: `Your OTP is ${otpCode}`,
  });

  console.log("Message sent:", info.messageId);
};

export const generateOtp = async (req, res) => {
  //start time
  const startTime =  Date.now()
  console.log("Generate OTP start Time",startTime)
  const { email } = req.body;
  
  try {
    //check email is valid or not
    const user = await pool.query(`SELECT * FROM users WHERE email=$1`,[email])
    if(user.rows.length === 0){
      return res.status(404).json({ success:false, message: "User not found" });
    }
    const otpCode = otp();
    
    // Save OTP in memory
    otpStore[email] = {
      code: otpCode,
      expiresAt: Date.now() + 60 * 1000
    };
    
    await sendOtpEmail(email, otpCode);
    //End Time
    const endTime =  Date.now()
    console.log("Generate Otp End Time",endTime)
    console.log("Time",endTime-startTime)
    
    res.json({
      success: true,
      message: "OTP generated and sent successfully",
    });

    // Auto-delete OTP after 60 seconds
    setTimeout(() => {
      delete otpStore[email];
      console.log("OTP expired for:", email);
    }, 60 * 1000);

  } catch (err) {
    console.log(err)
    res.json({
      success: false,
      message: "Error generating OTP",
      error: err
    });
  }
};



export const verifyOtp = (req, res) => {
  //start time
  const startTime =  Date.now()
  console.log("Verify OTP start Time",startTime)
  const { email, otp } = req.body;
  
  const entry = otpStore[email];
  
  if (!entry) {
    return res.json({ success: false, message: "OTP expired or not found" });
  }
  
  if (Date.now() > entry.expiresAt) {
    delete otpStore[email];
    return res.json({ success: false, message: "OTP expired" });
  }
  
  if (entry.code !== otp) {
    return res.json({ success: false, message: "Invalid OTP" });
  }
  
  delete otpStore[email];
  //end time
  const endTime =  Date.now()
  console.log("Verify Otp End Time",endTime)
  console.log("Time",endTime-startTime)
  
  res.json({ success: true, message: "OTP verified successfully",  });
};

// console.log("Generated OTP:", otpCode);
// console.log(await sendOtpEmail());
// console.log("new Otp",otpCode)