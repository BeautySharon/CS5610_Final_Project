import mongodb from "mongodb";
import dotenv from "dotenv";
import app from "./server.js";
import TasksDAO from "./dao/tasksDAO.js";
import ReviewsDAO from "./dao/reviewsDAO.js"; // Import the DAO for handling review operations in MongoDB
import UsersDAO from "./dao/usersDAO.js";
import ApplicationsDAO from "./dao/applicationsDAO.js";

async function main() {
  dotenv.config();

  const client = new mongodb.MongoClient(process.env.PawTrust_DB_URI);
  const port = process.env.PORT || 8000;

  try {
    // Connect to MongoDB.server
    await client.connect();
    await TasksDAO.injectDB(client);
    await ReviewsDAO.injectDB(client); // Initialize the ReviewsDAO with the MongoDB client to enable database access
    await UsersDAO.injectDB(client);
    await ApplicationsDAO.injectDB(client);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main().catch(console.error);

export default main;
