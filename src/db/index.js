import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectionToDatabase = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log('MongoDb connected SUCCESFULLY! db_host: ' , connectionInstance.connection.host)

    } catch (error) {
        console.log('Mongo DB connection FAILED!' , error)
        process.exit(1);
    }
}

export default connectionToDatabase;