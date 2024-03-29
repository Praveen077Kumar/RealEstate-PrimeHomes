import express from 'express';
import mongoose from 'mongoose'
import dotenv from 'dotenv';
import cors from 'cors'
import cookieParser from 'cookie-parser';

const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}


dotenv.config();
import userRouter from './routes/user.route.js'
import authRouter from './routes/auth.route.js'
import listRouter from './routes/listing.route.js'



mongoose.connect(process.env.MONGO).then(()=>{
    console.log('connected to MongoDb');
}).catch(err => console.log(err));

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors(corsOptions));


app.use('/api/user',userRouter);
app.use('/api/auth',authRouter);
app.use('/api/listings',listRouter)



app.use((err, req, res, next) =>{
    const statusCode= err.statusCode || 500;
    const message = err.message || 'Internal Server Error !'
    return res.status(statusCode).json({
        success:false,
        statusCode,
        message});
})











app.listen(3000,()=>{
    try {
        console.log('listening on port 3000')
    }
    catch (e) {
        console.error('error listening on port 3000', e);
    }
});


