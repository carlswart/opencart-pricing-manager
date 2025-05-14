import bcrypt from "bcrypt";

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hash(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password against a hash
 * @param plainPassword Plain text password
 * @param hashedPassword Hashed password
 * @returns True if password matches hash
 */
export async function compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}