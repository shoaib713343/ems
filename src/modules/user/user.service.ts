import "dotenv/config";
import z, { email } from "zod";
import { loginSchema, registerSchema } from "./user.schema";
import { db } from "../../config/db";
import {users} from "../../config/schema"
import { eq } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";


type RegisterUserOptions = z.infer<typeof registerSchema>['body'];
export async function registerUser(options: RegisterUserOptions ) {
    const {name, email, password} = options;
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if(existingUser.length > 0){
        throw new ApiError(409, "User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    

    
        const newUser = await db.insert(users).values({
            name,
            email,
            hashPassword: hashedPassword
        }).returning({ id: users.id, name: users.name, email: users.email});

        const newUserId = newUser[0].id;

        return newUser[0];
}

function generateAccessRefreshToken(foundUser: {id:number} ){
     const accessSecret = process.env.JWT_SECRET!;

    const accessExpiry = process.env.JWT_EXPIRY || '15m';

    const accessToken = jwt.sign(
        {
            id: foundUser.id
        },
        accessSecret,
        {
            expiresIn: accessExpiry
        } as SignOptions
    )
     

    const unHashedToken = crypto.randomBytes(64).toString('hex');
    const hashedRefreshToken = crypto.createHash('sha256').update(unHashedToken).digest('hex');

    return {accessToken, hashedRefreshToken, unHashedToken}
}

type loginUserOptions = z.infer<typeof loginSchema>['body'];
export async function loginUser(options: loginUserOptions){
    const {email, password} = options;

    const user = await db.select().from(users).where(eq(users.email, email));
    if(user.length === 0){
        throw new ApiError(401,"Invalid email or password");
    }
    const foundUser = user[0];
    if (!foundUser.hashPassword) {
    throw new ApiError(401, "Invalid email or password");
}
    const isPasswordCorrect = await bcrypt.compare(password, foundUser.hashPassword);
    
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid Email or password");
    }
    const {accessToken, hashedRefreshToken, unHashedToken} = generateAccessRefreshToken(foundUser);

   await db.update(users)
        .set({refreshToken: hashedRefreshToken})
        .where(eq(users.id, foundUser.id));

    const {hashPassword: _, ...userWithoutPassword} = foundUser;
    
    return {user:userWithoutPassword, accessToken, unHashedToken} 

}

export async function refreshToken(token:string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await db.select().from(users).where(eq(users.refreshToken, hashedToken));

    if(user.length === 0) {
        throw new ApiError(403, "Invalid or expired refresh token");
    }
    const foundUser = user[0];

    const newAccessToken = jwt.sign(
        {id: foundUser.id},
        process.env.JWT_SECRET!,
        {expiresIn: process.env.JWT_EXPIRY!} as SignOptions
    )

    return {accessToken: newAccessToken};

}

export async function logoutUser(userId: number) {
    const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

    if (user.length === 0) {
        throw new ApiError(404, "User not found");
    }

    await db
        .update(users)
        .set({ refreshToken: null })
        .where(eq(users.id, userId));

    return { message: "Logged out successfully" };
}

