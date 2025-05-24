import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import HomePage from './HomePage';
import { getAllPosts, deletePost } from '../services/api';

// Mock services/api
jest.mock('../services/api');

const mockPostsData = [
  { id: 'p1', _id: 'p1', title: 'Post 1 by Author1', author: { id: 'user123', _id: 'user123', username: 'Author1' }, community: {id: 'c1', _id: 'c1', name: 'Community1'}, likeCount: 10, dislikeCount: 2, score: 8 },
  { id: 'p2', _id: 'p2', title: 'Post 2 by Author2', author: { id: 'user456', _id: 'user456', username: 'Author2' }, community: {id: 'c1', _id: 'c1', name: 'Community1'}, likeCount: 5, dislikeCount: 1, score: 4 },
  { id: 'p3', _id: 'p3', title: 'Post 3 by Author1', author: { id: 'user123', _id: 'user123', username: 'Author1' }, community: {id: 'c1', _id: 'c1', name: 'Community1'}, likeCount: 0, dislikeCount: 0, score: 0 },
];

const defaultAuthContextValue = (isAuthenticated, user) => ({
  isAuthenticated,
  user,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateUserConfig: jest.fn(),
  fetchUserConfig: jest.fn(),
});

const renderHomePage = (authContextValue) => {
  // Reset mocks for each render to ensure clean state
  getAllPosts.mockReset();
  deletePost.mockReset();
  
  // Setup default mocks
  getAllPosts.mockResolvedValue({ data: mockPostsData });
  deletePost.mockResolvedValue({ data: { message: 'Post deleted successfully.' } });

  return render(
    <AuthContext.Provider value={authContextValue}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('HomePage Component - Edit/Delete Buttons', () => {
  
  test('Authenticated Owner sees Edit/Delete buttons for their own posts', async () => {
    const ownerUser = { id: 'user123', _id: 'user123', username: 'Author1' };
    renderHomePage(defaultAuthContextValue(true, ownerUser));

    await waitFor(() => {
      expect(screen.getByText('Post 1 by Author1')).toBeInTheDocument();
    });

    // For "Post 1 by Author1" (owned)
    const post1 = screen.getByText('Post 1 by Author1').closest('.card'); // Find the parent card
    expect(within(post1).getByRole('link', { name: /edit/i })).toBeInTheDocument();
    expect(within(post1).getByRole('button', { name: /delete/i })).toBeInTheDocument();

    // For "Post 2 by Author2" (not owned)
    const post2 = screen.getByText('Post 2 by Author2').closest('.card');
    expect(within(post2).queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();
    expect(within(post2).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    
    // For "Post 3 by Author1" (owned)
    const post3 = screen.getByText('Post 3 by Author1').closest('.card');
    expect(within(post3).getByRole('link', { name: /edit/i })).toBeInTheDocument();
    expect(within(post3).getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('Authenticated Non-Owner does NOT see Edit/Delete buttons', async () => {
    const nonOwnerUser = { id: 'user789', _id: 'user789', username: 'NonOwnerUser' };
    renderHomePage(defaultAuthContextValue(true, nonOwnerUser));

    await waitFor(() => {
      expect(screen.getByText('Post 1 by Author1')).toBeInTheDocument();
    });

    mockPostsData.forEach(postData => {
      const postElement = screen.getByText(postData.title).closest('.card');
      expect(within(postElement).queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();
      expect(within(postElement).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  test('Unauthenticated User does NOT see Edit/Delete buttons', async () => {
    renderHomePage(defaultAuthContextValue(false, null));

    await waitFor(() => {
      expect(screen.getByText('Post 1 by Author1')).toBeInTheDocument();
    });

    mockPostsData.forEach(postData => {
      const postElement = screen.getByText(postData.title).closest('.card');
      expect(within(postElement).queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();
      expect(within(postElement).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });
  
  // Example of a delete test, can be expanded
  test('Authenticated owner can delete their post', async () => {
    window.confirm = jest.fn(() => true); // Mock window.confirm

    const ownerUser = { id: 'user123', _id: 'user123', username: 'Author1' };
    renderHomePage(defaultAuthContextValue(true, ownerUser));

    await waitFor(() => {
      expect(screen.getByText('Post 1 by Author1')).toBeInTheDocument();
    });

    const post1 = screen.getByText('Post 1 by Author1').closest('.card');
    fireEvent.click(within(post1).getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(deletePost).toHaveBeenCalledWith('p1'); // Check if API was called
      expect(screen.queryByText('Post 1 by Author1')).not.toBeInTheDocument(); // Post is removed
    });
  });

});
