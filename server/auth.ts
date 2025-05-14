import express from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export const authRouter = express.Router();

// Configure passport to use local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      console.log('Local strategy authenticating user:', username);
      
      const user = await storage.getUserByUsername(username);
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('User not found');
        return done(null, false, { message: "Incorrect username" });
      }
      
      console.log('Comparing password...');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('Invalid password');
        return done(null, false, { message: "Incorrect password" });
      }
      
      console.log('Authentication successful');
      return done(null, user);
    } catch (error) {
      console.error('Error in authentication:', error);
      return done(error);
    }
  })
);

// Serialize user to the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Login route
authRouter.post("/login", (req, res, next) => {
  console.log('Login request received:', req.body);
  
  passport.authenticate("local", (err: any, user: User, info: any) => {
    console.log('Passport authenticate result:', { err, user: user?.username, info });
    
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }
    
    if (!user) {
      console.log('Authentication failed - no user');
      return res.status(401).json({ message: info?.message || "Authentication failed" });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      
      console.log('User logged in successfully:', user.username);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    });
  })(req, res, next);
});

// Logout route
authRouter.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Current user route
authRouter.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const user = req.user as User;
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Register route - only for admins
authRouter.post("/register", async (req, res, next) => {
  try {
    // Check if the current user is an admin
    if (!req.isAuthenticated() || (req.user as User).role !== "admin") {
      return res.status(403).json({ message: "Only admins can register new users" });
    }
    
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(validatedData.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    const newUser = await storage.createUser({
      ...validatedData,
      password: hashedPassword,
    });
    
    // Don't return password in response
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    next(error);
  }
});

export default authRouter;
