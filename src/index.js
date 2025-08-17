import dontenv from 'dotenv';
import connectionToDatabase from './db/index.js';
import { app } from './app.js';

dontenv.config({
    path: './.env'
});

connectionToDatabase()
.then(() => {
    app.listen(process.env.PORT || 3000 , () => {
        console.log(`⚙ Server is running at port: ${process.env.PORT}`)
    })

})
.catch((err) => {
    console.log('MongoDB error: ' , err)
})

// repeated Process DONE!!










/*
const port = process.env.PORT || 3000;
import express from "exress";
const app = express(); 

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONDODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.error("Error in Express app:", error);
            throw error;
        });

        // listing on app
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
})()

*/ // This code is commented out as it is not currently in use.            