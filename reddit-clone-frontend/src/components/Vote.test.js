import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Vote from './Vote';
import { votePost, voteComment } from '../services/api';

// Mock the API service
jest.mock('../services/api');

const mockAuthContextValue = (isAuthenticated, userId = 'user123') => ({
  isAuthenticated,
  user: isAuthenticated ? { id: userId, username: 'testuser' } : null,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateUserConfig: jest.fn(),
  fetchUserConfig: jest.fn(),
});

const renderVoteComponent = (authValue, props) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <Vote {...props} />
    </AuthContext.Provider>
  );
};

describe('Vote Component', () => {
  const entityId = 'post1';
  const entityTypePost = 'post';
  const entityTypeComment = 'comment';
  const initialScore = 5;

  beforeEach(() => {
    // Clear all mocks before each test
    votePost.mockClear();
    voteComment.mockClear();
  });

  // Test Cases for Score Update
  test('updates score on upvote for post when authenticated', async () => {
    const expectedLikeCount = initialScore + 1;
    const expectedDislikeCount = 0;
    votePost.mockResolvedValueOnce({ data: { post: { likeCount: expectedLikeCount, dislikeCount: expectedDislikeCount } } });
    const authValue = mockAuthContextValue(true);
    renderVoteComponent(authValue, { entityId, entityType: entityTypePost, initialScore });

    expect(screen.getByText(initialScore.toString())).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Upvote'));

    await waitFor(() => {
      expect(screen.getByText((expectedLikeCount - expectedDislikeCount).toString())).toBeInTheDocument();
    });
    expect(votePost).toHaveBeenCalledWith(entityId, { type: 'like' });
  });

  test('updates score on downvote for post when authenticated', async () => {
    const expectedLikeCount = initialScore;
    const expectedDislikeCount = 1; // Assuming downvote adds one dislike
    votePost.mockResolvedValueOnce({ data: { post: { likeCount: expectedLikeCount, dislikeCount: expectedDislikeCount } } });
    const authValue = mockAuthContextValue(true);
    renderVoteComponent(authValue, { entityId, entityType: entityTypePost, initialScore });

    expect(screen.getByText(initialScore.toString())).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Downvote'));

    await waitFor(() => {
      expect(screen.getByText((expectedLikeCount - expectedDislikeCount).toString())).toBeInTheDocument();
    });
    expect(votePost).toHaveBeenCalledWith(entityId, { type: 'dislike' });
  });

  test('updates score on upvote for comment when authenticated', async () => {
    const commentEntityId = 'comment1';
    const commentInitialScore = 3;
    const expectedLikeCount = commentInitialScore + 1;
    const expectedDislikeCount = 0;
    voteComment.mockResolvedValueOnce({ data: { comment: { likeCount: expectedLikeCount, dislikeCount: expectedDislikeCount } } });
    const authValue = mockAuthContextValue(true);
    renderVoteComponent(authValue, { entityId: commentEntityId, entityType: entityTypeComment, initialScore: commentInitialScore });

    expect(screen.getByText(commentInitialScore.toString())).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Upvote'));

    await waitFor(() => {
      expect(screen.getByText((expectedLikeCount - expectedDislikeCount).toString())).toBeInTheDocument();
    });
    expect(voteComment).toHaveBeenCalledWith(commentEntityId, { type: 'like' });
  });
  
  test('updates score on downvote for comment when authenticated', async () => {
    const commentEntityId = 'comment2';
    const commentInitialScore = 7;
    const expectedLikeCount = commentInitialScore; 
    const expectedDislikeCount = 1;
    voteComment.mockResolvedValueOnce({ data: { comment: { likeCount: expectedLikeCount, dislikeCount: expectedDislikeCount } } });
    const authValue = mockAuthContextValue(true);
    renderVoteComponent(authValue, { entityId: commentEntityId, entityType: entityTypeComment, initialScore: commentInitialScore });

    expect(screen.getByText(commentInitialScore.toString())).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Downvote'));

    await waitFor(() => {
      expect(screen.getByText((expectedLikeCount - expectedDislikeCount).toString())).toBeInTheDocument();
    });
    expect(voteComment).toHaveBeenCalledWith(commentEntityId, { type: 'dislike' });
  });

  // Test Cases for Login Prompt
  test('shows login prompt on upvote when unauthenticated', async () => {
    const authValue = mockAuthContextValue(false);
    renderVoteComponent(authValue, { entityId, entityType: entityTypePost, initialScore });

    fireEvent.click(screen.getByLabelText('Upvote'));

    await waitFor(() => {
      expect(screen.getByText('Please login to vote.')).toBeInTheDocument();
    });
    expect(votePost).not.toHaveBeenCalled();
  });
  
  test('shows login prompt on downvote when unauthenticated', async () => {
    const authValue = mockAuthContextValue(false);
    renderVoteComponent(authValue, { entityId, entityType: entityTypePost, initialScore });

    fireEvent.click(screen.getByLabelText('Downvote'));

    await waitFor(() => {
      expect(screen.getByText('Please login to vote.')).toBeInTheDocument();
    });
    expect(votePost).not.toHaveBeenCalled();
  });

  // Test Cases for Error Handling
  test('handles API error gracefully on upvote and reverts score', async () => {
    const errorMessage = 'Failed to cast vote.';
    votePost.mockRejectedValueOnce(new Error(errorMessage));
    const authValue = mockAuthContextValue(true);
    renderVoteComponent(authValue, { entityId, entityType: entityTypePost, initialScore });

    const originalScoreText = initialScore.toString();
    expect(screen.getByText(originalScoreText)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Upvote'));

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, "i"))).toBeInTheDocument();
    });
    
    // Score should revert to initialScore.
    expect(screen.getByText(originalScoreText)).toBeInTheDocument();
    expect(votePost).toHaveBeenCalledWith(entityId, { type: 'like' });
  });

  test('handles API error gracefully on downvote for a comment and reverts score', async () => {
    const errorMessage = 'Network Error';
    voteComment.mockRejectedValueOnce({ response: { data: { message: errorMessage } } }); // More realistic error
    const authValue = mockAuthContextValue(true);
    const commentInitialScore = 7;
    const commentEntityId = "commentXYZ";
    renderVoteComponent(authValue, { entityId: commentEntityId, entityType: entityTypeComment, initialScore: commentInitialScore });

    const originalScoreText = commentInitialScore.toString();
    expect(screen.getByText(originalScoreText)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Downvote'));

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, "i"))).toBeInTheDocument();
    });
    
    expect(screen.getByText(originalScoreText)).toBeInTheDocument();
    expect(voteComment).toHaveBeenCalledWith(commentEntityId, { type: 'dislike' });
  });
});
