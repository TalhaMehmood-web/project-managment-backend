import dotenv from "dotenv";
dotenv.config();

export const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: isProduction ? "None" : "Lax",
  partitioned: isProduction,
};
export default cookieOptions;
