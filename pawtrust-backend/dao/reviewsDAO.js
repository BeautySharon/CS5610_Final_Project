import mongodb from "mongodb";
const ObjectId = mongodb.ObjectId;

let reviews;
export default class ReviewsDAO {
  static async injectDB(conn) {
    if (reviews) {
      return;
    }
    try {
      reviews = await conn.db(process.env.PawTrust_db).collection("reviews");
    } catch (e) {
      console.error(`Unable to connect to reviewsDAO: ${e}`);
    }
  }
  static async getReview() {
    try {
      return await reviews.find().toArray();
    } catch (e) {
      console.error(`Unable to fetch users: ${e}`);
      return [];
    }
  }
  static async addReview(movieId, user, review, date) {
    try {
      const reviewDoc = {
        name: user.name,
        user_id: user._id,
        date: date,
        review: review,
        movie_id: new ObjectId(movieId),
      };
      return await reviews.insertOne(reviewDoc);
    } catch (e) {
      console.error(`Unable to post review: ${e}`);
      return { error: e };
    }
  }

  static async updateReview(reviewId, user, review, date) {
    try {
      const updateResponse = await reviews.updateOne(
        {
          _id: new ObjectId(reviewId),
          user_id: user._id,
        },
        {
          $set: {
            review: review,
            date: date,
          },
        }
      );
      return updateResponse;
    } catch (e) {
      console.error(`Unable to update review: ${e}`);
      return { error: e };
    }
  }
  static async deleteReview(reviewId, userId) {
    try {
      const deleteResponse = await reviews.deleteOne({
        _id: new ObjectId(reviewId),
        user_id: userId,
      });

      return deleteResponse;
    } catch (e) {
      console.error(`Unable to delete review: ${e}`);
      return { error: e };
    }
  }
}
