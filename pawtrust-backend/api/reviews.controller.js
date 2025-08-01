import ReviewsDAO from "../dao/reviewsDAO.js";

export default class ReviewsController {
  static async apiGetReviews(req, res) {
    const reviews = await ReviewsDAO.getReview();
    res.json(reviews);
  }
  static async apiPostReview(req, res, next) {
    try {
      const movieId = req.body.movie_id;
      const review = req.body.review;
      const userInfo = {
        name: req.body.name,
        _id: req.body.user_id,
      };
      const date = new Date();
      const reviewResponse = await ReviewsDAO.addReview(
        movieId,
        userInfo,
        review,
        date
      );

      var { error } = reviewResponse;

      if (error) {
        res.status(500).json({ error: "Unable to post review." });
      } else {
        res.json({
          status: "success",
          response: reviewResponse,
        });
      }
    } catch (e) {
      res.status(500).json({ error: e });
    }
  }
  static async apiUpdateReview(req, res, next) {
    try {
      const reviewId = req.body.review_id;
      const review = req.body.review;
      const userInfo = { _id: req.body.user_id };
      const date = new Date();

      const updateResponse = await ReviewsDAO.updateReview(
        reviewId,
        userInfo,
        review,
        date
      );

      if (updateResponse.modifiedCount === 0) {
        throw new Error(
          "No review was updated. Possibly wrong user_id or review_id."
        );
      }

      res.json({ status: "success" });
    } catch (e) {
      console.error(`Unable to update review: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }

  static async apiDeleteReview(req, res, next) {
    try {
      const reviewId = req.body.review_id;
      const userId = req.body.user_id;

      const deleteResponse = await ReviewsDAO.deleteReview(reviewId, userId);

      if (deleteResponse.deletedCount === 0) {
        throw new Error(
          "No review was deleted. Possibly wrong user_id or review_id."
        );
      }

      res.json({ status: "success" });
    } catch (e) {
      console.error(`Unable to delete review: ${e}`);
      res.status(500).json({ error: e.message });
    }
  }
}
