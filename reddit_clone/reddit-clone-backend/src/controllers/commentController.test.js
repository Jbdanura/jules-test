const commentController = require('./commentController');
const db = require('../models');

// Mock the models
jest.mock('../models', () => ({
  Comment: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(), // Added findByPk for fetching comment with author details
  },
  Post: { findByPk: jest.fn() },
  User: { findByPk: jest.fn() }, // User model might not be directly used here but good to have if controller logic changes
}));

// Mock response object methods
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Comment Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    req = {
      user: { id: 1, username: 'testuser' }, // Mock authenticated user
      params: {},
      body: {},
    };
  });

  // --- createComment Tests ---
  describe('createComment', () => {
    beforeEach(() => {
      req.params.postId = 'post1';
      req.body.content = 'This is a comment.';
    });

    it('should create a comment successfully and return it with author details', async () => {
      const mockPost = { id: 'post1' };
      const createdComment = { 
        id: 'comment123', 
        content: 'This is a comment.', 
        userId: 1, 
        postId: 'post1',
        // Simulate what findByPk after create would return:
        author: { id: 1, username: 'testuser' },
        toJSON: () => ({  // if controller calls .toJSON()
            id: 'comment123', 
            content: 'This is a comment.', 
            userId: 1, 
            postId: 'post1',
            author: { id: 1, username: 'testuser' }
        })
      };
      const createdCommentRaw = { // what Comment.create might return before eager loading
        id: 'comment123', 
        content: 'This is a comment.', 
        userId: 1, 
        postId: 'post1'
      };


      db.Post.findByPk.mockResolvedValue(mockPost);
      db.Comment.create.mockResolvedValue(createdCommentRaw);
      // Mock the findByPk call that happens after creation to include the author
      db.Comment.findByPk.mockResolvedValue(createdComment);


      await commentController.createComment(req, res);

      expect(db.Post.findByPk).toHaveBeenCalledWith('post1');
      expect(db.Comment.create).toHaveBeenCalledWith({
        content: 'This is a comment.',
        userId: 1,
        postId: 'post1',
      });
      expect(db.Comment.findByPk).toHaveBeenCalledWith('comment123', expect.any(Object)); // For author details
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Comment created successfully!',
        comment: createdComment, // This should be the version with author details
      });
      // Verify response structure includes comment.author.username
      expect(res.json.mock.calls[0][0].comment.author.username).toBe('testuser');
    });

    it('should return 400 if content is empty or whitespace', async () => {
      req.body.content = '   '; // Empty content
      await commentController.createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment content cannot be empty.' });
    });

    it('should return 404 if post to comment on is not found', async () => {
      db.Post.findByPk.mockResolvedValue(null);
      await commentController.createComment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Post not found.' });
    });

    it('should handle unauthenticated comment attempt (if protect middleware is bypassed/not unit tested)', async () => {
      // This test assumes that if `req.user` is not set (e.g. by a failing/bypassed middleware),
      // the controller would throw an error when trying to access `req.user.id`.
      req.user = undefined; // Simulate unauthenticated user
      // We expect an error because `req.user.id` will be undefined.
      // The controller doesn't explicitly check for req.user itself, it relies on authMiddleware.
      // So, this test will likely result in a 500 if not for a try-catch for `req.user.id`
      // For a unit test, we'd ideally test the controller's behavior if req.user is missing.
      // The current controller would throw a TypeError.
      // Let's assume the test is to ensure it doesn't proceed.
      try {
        await commentController.createComment(req, res);
      } catch (e) {
        expect(e).toBeInstanceOf(TypeError); // Or specific error if controller handled it
      }
      // If it doesn't throw, check that no comment was created and an error was sent.
      // This depends on how robust the controller is to missing req.user.
      // Given typical Express patterns, this scenario is more for integration testing with middleware.
      // For a pure unit test, we assume req.user is populated by middleware.
      // If we were to test the "unauthenticated" path at unit level without middleware,
      // we'd expect a 500 or specific error if `req.user.id` access is not guarded.
      // The controller doesn't have a specific "unauthenticated" message, so it would be a server error.
      expect(db.Comment.create).not.toHaveBeenCalled();
      // res.status might be 500 if error isn't caught gracefully by a higher-level handler in real app
    });
  });

  // --- getCommentsByPost Tests ---
  describe('getCommentsByPost', () => {
    beforeEach(() => {
      req.params.postId = 'post1';
    });

    it('should return comments for a valid post with comments', async () => {
      const mockPost = { id: 'post1' };
      const mockComments = [{ id: 'comment1', content: 'First comment' }];
      db.Post.findByPk.mockResolvedValue(mockPost);
      db.Comment.findAll.mockResolvedValue(mockComments);

      await commentController.getCommentsByPost(req, res);

      expect(db.Post.findByPk).toHaveBeenCalledWith('post1');
      expect(db.Comment.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { postId: 'post1' },
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockComments);
    });

    it('should return an empty array for a valid post with no comments', async () => {
      const mockPost = { id: 'post1' };
      db.Post.findByPk.mockResolvedValue(mockPost);
      db.Comment.findAll.mockResolvedValue([]);

      await commentController.getCommentsByPost(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 404 if the post is not found when fetching comments', async () => {
      db.Post.findByPk.mockResolvedValue(null);

      await commentController.getCommentsByPost(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Post not found when fetching comments.' });
    });
  });
});
