import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@repo/database";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_production";

// Registration is disabled — guest-only login while we're in visualization mode.
// authRouter.post("/signup", async (req, res) => {
//   const { email, name, password } = req.body;
//
//   if (!email || !password) {
//     res.status(400).json({ error: "Email and password are required" });
//     return;
//   }
//
//   const existing = await prisma.user.findUnique({ where: { email } });
//   if (existing) {
//     res.status(409).json({ error: "Email already in use" });
//     return;
//   }
//
//   const hashed = await bcrypt.hash(password, 10);
//   const user = await prisma.user.create({
//     data: { email, name, password: hashed },
//     select: { id: true, email: true, name: true, type: true },
//   });
//
//   const token = jwt.sign(
//     { userId: user.id.toString(), email: user.email },
//     JWT_SECRET,
//     {
//       expiresIn: "7d",
//     },
//   );
//
//   res.status(201).json({ token, user });
// });
authRouter.post("/signup", (req, res) => {
  res.status(403).json({ error: "Registration is currently disabled" });
});

authRouter.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  console.log(valid);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { userId: user.id.toString(), email: user.email },
    JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.json({
    token,
    user: {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      type: user.type,
    },
  });
});
