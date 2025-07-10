import dotenv from 'dotenv';
import connectDB from './db/index.js';
import {app} from './app.js';
dotenv.config({
    path: './.env'
})// it will enable us using environment variables that are defined in '.env'

const port = process.env.PORT || 8000;
connectDB()
.then(()=>{
    app.listen(port, ()=>{
        console.log(`Server is running at ${port}`);
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed!", err);
});
