import bcrypt from "bcrypt";
import mongodb from "mongodb";
const ObjectId = mongodb.ObjectId;

let users;

export default class UsersDAO {
  static async injectDB(conn) {
    if (users) return;
    try {
      users = await conn.db(process.env.PawTrust_db).collection("users");
    } catch (e) {
      console.error(`Unable to connect to usersDAO: ${e}`);
    }
  }

  static async getUserByEmail(email) {
    try {
      return await users.findOne({ email: email });
    } catch (e) {
      console.error(`Unable to find user: ${e}`);
      return null;
    }
  }

  static async validateUserPassword(user, plainPassword) {
    try {
      return await bcrypt.compare(plainPassword, user.passwordHash);
    } catch (e) {
      console.error("Password compare error:", e);
      return false;
    }
  }

  static async addUser({ name, email, password, userType, bio, location }) {
    try {
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        throw new Error("Email already registered.");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const userDoc = {
        name,
        email,
        passwordHash: hashedPassword,
        userType,
        bio,
        location,
        profileImage: "", // 默认值
        availability: [],
        createdAt: new Date(),
      };

      const result = await users.insertOne(userDoc);

      // 返回不含 passwordHash 的用户对象
      return {
        _id: result.insertedId,
        name,
        email,
        userType,
        bio,
        location,
        profileImage: "",
        availability: [],
        createdAt: userDoc.createdAt,
      };
    } catch (e) {
      console.error(`Unable to add user: ${e}`);
      throw e;
    }
  }
  static async getUsersByType(userType) {
    try {
      return await users.find({ userType: userType }).toArray();
    } catch (e) {
      console.error(`Unable to get users by type: ${e}`);
      return [];
    }
  }
}
