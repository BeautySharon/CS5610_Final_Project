// import mongodb from "mongodb";
// const ObjectId = mongodb.ObjectId;

// let reviews;
// export default class ReviewsDAO {
//   static async injectDB(conn) {
//     if (reviews) {
//       return;
//     }
//     try {
//       reviews = await conn.db(process.env.PawTrust_db).collection("reviews");
//     } catch (e) {
//       console.error(`Unable to connect to reviewsDAO: ${e}`);
//     }
//   }
//   static async getReview() {
//     try {
//       return await reviews.find().toArray();
//     } catch (e) {
//       console.error(`Unable to fetch users: ${e}`);
//       return [];
//     }
//   }
//   static async addReview(movieId, user, review, date) {
//     try {
//       const reviewDoc = {
//         name: user.name,
//         user_id: user._id,
//         date: date,
//         review: review,
//         movie_id: new ObjectId(movieId),
//       };
//       return await reviews.insertOne(reviewDoc);
//     } catch (e) {
//       console.error(`Unable to post review: ${e}`);
//       return { error: e };
//     }
//   }

//   static async updateReview(reviewId, user, review, date) {
//     try {
//       const updateResponse = await reviews.updateOne(
//         {
//           _id: new ObjectId(reviewId),
//           user_id: user._id,
//         },
//         {
//           $set: {
//             review: review,
//             date: date,
//           },
//         }
//       );
//       return updateResponse;
//     } catch (e) {
//       console.error(`Unable to update review: ${e}`);
//       return { error: e };
//     }
//   }
//   static async deleteReview(reviewId, userId) {
//     try {
//       const deleteResponse = await reviews.deleteOne({
//         _id: new ObjectId(reviewId),
//         user_id: userId,
//       });

//       return deleteResponse;
//     } catch (e) {
//       console.error(`Unable to delete review: ${e}`);
//       return { error: e };
//     }
//   }
// }
// dao/reviewsDAO.js
// dao/reviewsDAO.js
import mongodb from "mongodb";
const { ObjectId } = mongodb;

let reviews;

/** 统一安全转换为 ObjectId；传入非法值会抛出明确的错误 */
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
    // 索引：按保姆查询、按任务唯一
    await reviews.createIndex({ sitterId: 1, createdAt: -1 });
    await reviews.createIndex({ taskId: 1 }, { unique: true });
  }

  /** 新增评价 */
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

  /** 按保姆取评价列表（倒序） */
  static async getReviewsBySitter(sitterId) {
    return reviews
      .find({ sitterId: toObjId(sitterId, "sitterId") })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /** 按任务取唯一评价 */
  static async getReviewByTask(taskId) {
    return reviews.findOne({ taskId: toObjId(taskId, "taskId") });
  }
}
