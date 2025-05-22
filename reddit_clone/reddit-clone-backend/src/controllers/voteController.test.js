const voteController = require('./voteController');
const db = require('../models'); // Assuming this is the path to your models

// Mock the models
jest.mock('../models', () => ({
  Post: { findByPk: jest.fn() },
  Comment: { findByPk: jest.fn() },
  PostLike: { findOne: jest.fn(), create: jest.fn(), destroy: jest.fn() },
  CommentLike: { findOne: jest.fn(), create: jest.fn(), destroy: jest.fn() },
  sequelize: { transaction: jest.fn(async (cb) => await cb()) } // Mock transaction
}));

// Mock response object methods
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Vote Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    req = {
      user: { id: 1 }, // Mock authenticated user
      params: {},
      body: {},
    };
  });

  // --- Post Voting Tests ---
  describe('votePost', () => {
    beforeEach(() => {
      req.params.postId = 'post1';
    });

    it('should successfully cast a "like" (upvote) on a post', async () => {
      req.body.type = 'like';
      const mockPost = { id: 'post1', save: jest.fn() };
      db.Post.findByPk.mockResolvedValue(mockPost);
      db.PostLike.findOne.mockResolvedValue(null); // No existing vote
      db.PostLike.create.mockResolvedValue({ type: 'like', userId: 1, postId: 'post1' });
      
      // Mock the getPostLikes method that might be called by hooks in PostLike model
      // This is a simplification; actual hooks might need more specific mocking
      const mockUpdatedPost = { id: 'post1', score: 1, /* other fields */toJSON: () => ({ id: 'post1', score: 1 }) };
      mockPost.reload = jest.fn().mockResolvedValue(mockUpdatedPost);


      await voteController.votePost(req, res);

      expect(db.Post.findByPk).toHaveBeenCalledWith('post1');
      expect(db.PostLike.create).toHaveBeenCalledWith({
        type: 'like',
        userId: 1,
        postId: 'post1',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      // The actual response structure depends on the controller logic after vote
      // Assuming it returns the updated post or a success message with score
      // For this test, we'll check for a success status and that json was called.
      // The controller returns the reloaded post with its new score.
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 1 })); 
    });

    it('should successfully cast a "dislike" (downvote) on a post', async () => {
        req.body.type = 'dislike';
        const mockPost = { id: 'post1', save: jest.fn(), reload: jest.fn().mockResolvedValue({ id: 'post1', score: -1, toJSON: () => ({ id: 'post1', score: -1 }) }) };
        db.Post.findByPk.mockResolvedValue(mockPost);
        db.PostLike.findOne.mockResolvedValue(null); // No existing vote
        db.PostLike.create.mockResolvedValue({ type: 'dislike', userId: 1, postId: 'post1' });
  
        await voteController.votePost(req, res);
  
        expect(db.PostLike.create).toHaveBeenCalledWith({
          type: 'dislike',
          userId: 1,
          postId: 'post1',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: -1 }));
      });

    it('should remove an existing "like" if "like" is cast again', async () => {
      req.body.type = 'like';
      const mockExistingVote = { type: 'like', userId: 1, postId: 'post1', destroy: jest.fn() };
      const mockPost = { id: 'post1', save: jest.fn(), reload: jest.fn().mockResolvedValue({ id: 'post1', score: 0, toJSON: () => ({ id: 'post1', score: 0 }) }) };
      db.Post.findByPk.mockResolvedValue(mockPost);
      db.PostLike.findOne.mockResolvedValue(mockExistingVote);

      await voteController.votePost(req, res);

      expect(mockExistingVote.destroy).toHaveBeenCalled();
      expect(db.PostLike.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 0 }));
    });
    
    it('should change an existing "dislike" to "like"', async () => {
        req.body.type = 'like';
        const mockExistingVote = { type: 'dislike', userId: 1, postId: 'post1', destroy: jest.fn() };
        const mockPost = { id: 'post1', save: jest.fn(), reload: jest.fn().mockResolvedValue({ id: 'post1', score: 1, toJSON: () => ({ id: 'post1', score: 1 }) }) };
        db.Post.findByPk.mockResolvedValue(mockPost);
        db.PostLike.findOne.mockResolvedValue(mockExistingVote);
        db.PostLike.create.mockResolvedValue({ type: 'like', userId: 1, postId: 'post1' }); // New vote created
  
        await voteController.votePost(req, res);
  
        expect(mockExistingVote.destroy).toHaveBeenCalled(); // Old vote removed
        expect(db.PostLike.create).toHaveBeenCalledWith({ type: 'like', userId: 1, postId: 'post1' }); // New vote created
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 1 }));
      });

    it('should return 400 for an invalid vote type', async () => {
      req.body.type = 'invalid_type';
      const mockPost = { id: 'post1' };
      db.Post.findByPk.mockResolvedValue(mockPost);

      await voteController.votePost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid vote type.' });
    });

    it('should return 404 if the post does not exist', async () => {
      req.body.type = 'like';
      db.Post.findByPk.mockResolvedValue(null);

      await voteController.votePost(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Post not found.' });
    });
  });

  // --- Comment Voting Tests (similar structure) ---
  describe('voteComment', () => {
    beforeEach(() => {
      req.params.commentId = 'comment1';
    });

    it('should successfully cast a "like" on a comment', async () => {
        req.body.type = 'like';
        const mockComment = { id: 'comment1', save: jest.fn(), reload: jest.fn().mockResolvedValue({ id: 'comment1', score: 1, toJSON: () => ({ id: 'comment1', score: 1 }) }) };
        db.Comment.findByPk.mockResolvedValue(mockComment);
        db.CommentLike.findOne.mockResolvedValue(null);
        db.CommentLike.create.mockResolvedValue({ type: 'like', userId: 1, commentId: 'comment1' });
  
        await voteController.voteComment(req, res);
  
        expect(db.Comment.findByPk).toHaveBeenCalledWith('comment1');
        expect(db.CommentLike.create).toHaveBeenCalledWith({
          type: 'like',
          userId: 1,
          commentId: 'comment1',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ score: 1 }));
      });

      it('should return 404 if the comment does not exist', async () => {
        req.body.type = 'like';
        db.Comment.findByPk.mockResolvedValue(null);
  
        await voteController.voteComment(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found.' });
      });

      it('should return 400 for an invalid vote type on a comment', async () => {
        req.body.type = 'invalid_type';
        const mockComment = { id: 'comment1' };
        db.Comment.findByPk.mockResolvedValue(mockComment);
  
        await voteController.voteComment(req, res);
  
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid vote type.' });
      });
  });
});
