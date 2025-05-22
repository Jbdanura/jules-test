import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthContext } from '../contexts/AuthContext';
import Vote from './Vote';
import * as api from '../services/api'; // To mock votePost and voteComment

// Mock the API service functions
jest.mock('../services/api', () => ({
  votePost: jest.fn(),
  voteComment: jest.fn(),
}));

const mockAuthContext = (isAuthenticated) => ({
  isAuthenticated,
  user: isAuthenticated ? { id: 'user123', username: 'TestUser' } : null,
});

const renderVoteComponent = (props, authState = { isAuthenticated: true }) => {
  return render(
    <AuthContext.Provider value={mockAuthContext(authState.isAuthenticated)}>
      <Vote {...props} />
    </AuthContext.Provider>
  );
};

describe('Vote Component', () => {
  const entityId = 'entity1';
  const initialScore = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test for Post Votes
  describe('Voting on a Post', () => {
    const entityType = 'post';

    it('sends { type: "like" } when upvote is clicked for a post and updates score', async () => {
      api.votePost.mockResolvedValueOnce({ data: { score: initialScore + 1 } });
      renderVoteComponent({ entityId, entityType, initialScore });

      fireEvent.click(screen.getByLabelText('Upvote'));

      await waitFor(() => {
        expect(api.votePost).toHaveBeenCalledWith(entityId, { type: 'like' });
      });
      expect(screen.getByText(initialScore + 1)).toBeInTheDocument();
    });

    it('sends { type: "dislike" } when downvote is clicked for a post and updates score', async () => {
      api.votePost.mockResolvedValueOnce({ data: { score: initialScore - 1 } });
      renderVoteComponent({ entityId, entityType, initialScore });

      fireEvent.click(screen.getByLabelText('Downvote'));

      await waitFor(() => {
        expect(api.votePost).toHaveBeenCalledWith(entityId, { type: 'dislike' });
      });
      expect(screen.getByText(initialScore - 1)).toBeInTheDocument();
    });

    it('displays an error message if voting on a post fails', async () => {
      api.votePost.mockRejectedValueOnce({ response: { data: { message: 'Post vote failed' } } });
      renderVoteComponent({ entityId, entityType, initialScore });

      fireEvent.click(screen.getByLabelText('Upvote'));

      await waitFor(() => {
        expect(screen.getByText('Post vote failed')).toBeInTheDocument();
      });
      // Score should revert or remain initialScore on error
      expect(screen.getByText(initialScore)).toBeInTheDocument();
    });
  });

  // Test for Comment Votes
  describe('Voting on a Comment', () => {
    const entityType = 'comment';

    it('sends { type: "like" } when upvote is clicked for a comment and updates score', async () => {
      api.voteComment.mockResolvedValueOnce({ data: { score: initialScore + 1 } });
      renderVoteComponent({ entityId, entityType, initialScore });

      fireEvent.click(screen.getByLabelText('Upvote'));

      await waitFor(() => {
        expect(api.voteComment).toHaveBeenCalledWith(entityId, { type: 'like' });
      });
      expect(screen.getByText(initialScore + 1)).toBeInTheDocument();
    });

    it('sends { type: "dislike" } when downvote is clicked for a comment and updates score', async () => {
      api.voteComment.mockResolvedValueOnce({ data: { score: initialScore - 1 } });
      renderVoteComponent({ entityId, entityType, initialScore });

      fireEvent.click(screen.getByLabelText('Downvote'));

      await waitFor(() => {
        expect(api.voteComment).toHaveBeenCalledWith(entityId, { type: 'dislike' });
      });
      expect(screen.getByText(initialScore - 1)).toBeInTheDocument();
    });
  });

  // Test for Unauthenticated User
  describe('Unauthenticated User', () => {
    it('displays an error message when an unauthenticated user tries to vote', async () => {
      renderVoteComponent({ entityId, entityType: 'post', initialScore }, { isAuthenticated: false });

      fireEvent.click(screen.getByLabelText('Upvote'));

      // Error message "Please login to vote." should appear
      await waitFor(() => {
        expect(screen.getByText('Please login to vote.')).toBeInTheDocument();
      });
      // API should not have been called
      expect(api.votePost).not.toHaveBeenCalled();
      expect(api.voteComment).not.toHaveBeenCalled();
      // Score should remain unchanged
      expect(screen.getByText(initialScore)).toBeInTheDocument();
    });
  });
});
