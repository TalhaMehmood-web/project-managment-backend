import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    if (connectionInstance) {
      console.log("Database Connected");
    }
  } catch (error) {
    console.log("MongoDB Connection Error", error);
  }
};
export default connectDB;
