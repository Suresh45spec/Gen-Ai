const express=require('express');
const cookieParser=require('cookie-parser');
const cors=require('cors');
const app=express();

// Allow requests from the frontend origin with credentials (cookies)
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

//require all routes here
const authRouter=require('./routes/auth.route');
const interviewRouter = require("./routes/interview.routes")

//using all routes here
app.use('/api/auth',authRouter);
app.use("/api/interview", interviewRouter)

module.exports=app;