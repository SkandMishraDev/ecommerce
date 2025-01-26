import dotenv from "dotenv"
import dbConnect from "./db"


dotenv.config({
    path:'./.env'
})

dbConnect
.then(
    ()=>{
    app.listen(process.env.PORT||5000,()=>{
        console.log(`Server is listening at ${process.env.PORT}`)
    });
    }
)
.catch(
    (error)=>{
        console.log(`Server is unable to listen ${error}`)
    }
)