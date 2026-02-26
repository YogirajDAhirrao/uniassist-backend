import express from "express";
import cors from "cors";

const app = express();

app.get("/",(req,res)=> res.send("Hey") )
app.listen(3001,()=>{
    console.log("Started");
    
})
