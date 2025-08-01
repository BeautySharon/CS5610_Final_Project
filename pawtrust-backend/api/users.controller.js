import UsersDAO from "../dao/usersDAO.js";

export default class UsersController {
  static async apiGetUsersByType(req, res) {
    try {
      const sitters = await UsersDAO.getUsersByType("sitter");
      console.log(`apiGetUsersByType: Found ${sitters.length} sitters`);
      res.json(sitters); // 👈 注意：直接返回数组
    } catch (e) {
      console.error(`apiGetUsersByType error: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }
  static async apiLogin(req, res) {
    try {
      const { email, password } = req.body;

      const user = await UsersDAO.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "User not found." });
      }

      const isMatch = await UsersDAO.validateUserPassword(user, password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password." });
      }

      // 不返回 passwordHash
      const { passwordHash, ...safeUser } = user;

      res.status(200).json({ message: "Login successful", user: safeUser });
    } catch (err) {
      console.error("Login failed:", err);
      res.status(500).json({ message: "Login failed" });
    }
  }

  static async apiRegister(req, res) {
    try {
      const { name, email, password, userType, location, bio } = req.body;

      const existingUser = await UsersDAO.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const newUser = {
        name,
        email,
        password, // 明文密码，DAO 中处理 hash
        userType,
        bio,
        location,
      };

      const insertedUser = await UsersDAO.addUser(newUser);

      res.status(201).json({ message: "User registered", user: insertedUser });
    } catch (err) {
      console.error("Registration failed:", err);
      res.status(500).json({ message: "Registration failed" });
    }
    // res.status(201).json({ message: "User registered" });
  }
}
