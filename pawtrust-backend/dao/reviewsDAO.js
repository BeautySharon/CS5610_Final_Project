import mongodb from "mongodb";
const { ObjectId } = mongodb;

let reviews;

function toObjId(value, fieldName = "id") {
  if (!value && value !== 0) {
    throw new Error(`Invalid ObjectId value for ${fieldName}`);
  }
  if (value instanceof ObjectId) return value;
  const str = String(value);
  if (!ObjectId.isValid(str)) {
    throw new Error(`Invalid ObjectId format for ${fieldName}`);
  }
  return new ObjectId(str);
}

export default class ReviewsDAO {
  static async injectDB(conn) {
    if (reviews) return;
    reviews = await conn.db(process.env.PawTrust_db).collection("reviews");

    await reviews.createIndex({ sitterId: 1, createdAt: -1 });
    await reviews.createIndex({ taskId: 1 }, { unique: true });
  }

  static async addReview({ taskId, sitterId, ownerId, rating, comment }) {
    const now = new Date();
    const doc = {
      taskId: toObjId(taskId, "taskId"),
      sitterId: toObjId(sitterId, "sitterId"),
      ownerId: toObjId(ownerId, "ownerId"),
      rating: Number(rating),
      comment: comment || "",
      createdAt: now,
      updatedAt: now,
    };
    const result = await reviews.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  static async getReviewsBySitter(sitterId) {
    return reviews
      .find({ sitterId: toObjId(sitterId, "sitterId") })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async getReviewByTask(taskId) {
    return reviews.findOne({ taskId: toObjId(taskId, "taskId") });
  }
}
