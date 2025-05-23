import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import HomePage from './HomePage';
import * as api from '../services/api';

// Mock API calls
jest.mock('../services/api', () => ({
  getAllPosts: jest.fn(),
  deletePost: jest.fn(),
  // getAllCommunities: jest.fn(), // If CommunityList makes its own call and needs mocking
}));

// Mock components that might be complex or make their own API calls
jest.mock('../components/CommunityList', () => () => <div data-testid="community-list-mock">Community List</div>);
jest.mock('../components/Vote', () => ({ entityId, entityType, initialScore }) => (
  <div data-testid={`vote-mock-${entityId}`}>Vote (Score: {initialScore})</div>
));


const mockUser = { _id: 'user123', id: 'user123', username: 'TestUser' };
const mockPostsList = [
  { _id: 'post1', id: 'post1', title: 'Post 1 by TestUser', content: 'Content 1', author: mockUser, community: { _id: 'c1', id: 'c1', name: 'Tech' }, score: 5, createdAt: new Date().toISOString() },
  { _id: 'post2', id: 'post2', title: 'Post 2 by OtherUser', content: 'Content 2', author: { _id: 'user456', id: 'user456', username: 'OtherUser' }, community: { _id: 'c2', id: 'c2', name: 'Gaming' }, score: 10, createdAt: new Date().toISOString() },
  { _id: 'post3', id: 'post3', title: 'Post 3 by TestUser', content: 'Content 3', author: mockUser, community: { _id: 'c1', id: 'c1', name: 'Tech' }, score: 2, createdAt: new Date().toISOString() },
];

const renderHomePage = (authState = { isAuthenticated: true, user: mockUser }) => {
  api.getAllPosts.mockResolvedValue({ data: [...mockPostsList] }); // Return a copy
  api.deletePost.mockClear();
  // if (api.getAllCommunities) api.getAllCommunities.mockResolvedValue({ data: [] });


  return render(
    <AuthContext.Provider value={authState}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Add other routes like /edit-post/:postId if Link clicks are fully tested */}
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays all posts', async () => {
    renderHomePage({ isAuthenticated: false, user: null }); // Render as unauthenticated
    await waitFor(() => {
      expect(api.getAllPosts).toHaveBeenCalledTimes(1);
    });

    mockPostsList.forEach(post => {
      // Check post title is displayed
      expect(screen.getByText(post.title)).toBeInTheDocument();
      
      // Check author username is displayed and is a link to their profile
      if (post.author) {
        const authorLink = screen.getByText(post.author.username, { exact: false }).closest('a'); // Use exact: false if 'by' is part of the text node
        expect(authorLink).toBeInTheDocument();
        expect(authorLink).toHaveAttribute('href', `/profile/${post.author._id || post.author.id}`);
      } else {
        // Handle case where post might not have an author, if applicable
        // For this test, all mock posts have authors
      }
    });
  });

  describe('Authenticated User - Post Actions (Edit/Delete)', () => {
    const authState = { isAuthenticated: true, user: mockUser };

    it('shows Edit and Delete buttons only for posts authored by the logged-in user', async () => {
      renderHomePage(authState);
      await waitFor(() => {
        expect(screen.getByText('Post 1 by TestUser')).toBeInTheDocument();
      });

      // Post 1 (authored by mockUser)
      const post1Item = screen.getByText('Post 1 by TestUser').closest(`.${styles.postItem}`); // Assuming styles.postItem is on the card div
      expect(post1Item).toBeInTheDocument();
      // Use within to scope queries to post1Item
      const { within } = require('@testing-library/dom'); // Ensure within is imported/required

      const post1Item = screen.getByText(mockPostsList[0].title).closest(`.${styles.postItem}`);
      expect(post1Item).toBeInTheDocument();
      expect(within(post1Item).getByRole('link', { name: /Edit/i})).toBeInTheDocument();
      expect(within(post1Item).getByRole('button', { name: /Delete/i})).toBeInTheDocument();


      // Post 2 (authored by OtherUser)
      const post2Item = screen.getByText(mockPostsList[1].title).closest(`.${styles.postItem}`);
      expect(post2Item).toBeInTheDocument();
      expect(within(post2Item).queryByRole('link', { name: /Edit/i})).not.toBeInTheDocument();
      expect(within(post2Item).queryByRole('button', { name: /Delete/i})).not.toBeInTheDocument();
      
      // Post 3 (authored by mockUser)
      const post3Item = screen.getByText(mockPostsList[2].title).closest(`.${styles.postItem}`);
      expect(post3Item).toBeInTheDocument();
      expect(within(post3Item).getByRole('link', { name: /Edit/i})).toBeInTheDocument();
      expect(within(post3Item).getByRole('button', { name: /Delete/i})).toBeInTheDocument();
    });

    it('handles post deletion successfully from homepage', async () => {
      const { within } = require('@testing-library/dom');
      
      api.getAllPosts.mockResolvedValueOnce({ data: [...mockPostsList] });
      api.deletePost.mockResolvedValueOnce({});
      window.confirm = jest.fn(() => true);

      renderHomePage(authState);

      await waitFor(() => {
        expect(screen.getByText(mockPostsList[0].title)).toBeInTheDocument();
      });

      const post1Item = screen.getByText(mockPostsList[0].title).closest(`.${styles.postItem}`);
      const deleteButtonPost1 = within(post1Item).getByRole('button', { name: /Delete/i});
      
      fireEvent.click(deleteButtonPost1);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this post?');
      
      await waitFor(() => {
        expect(api.deletePost).toHaveBeenCalledWith(mockPostsList[0]._id);
      });
      expect(screen.queryByText(mockPostsList[0].title)).not.toBeInTheDocument();
      expect(screen.getByText(mockPostsList[1].title)).toBeInTheDocument();
      expect(screen.getByText(mockPostsList[2].title)).toBeInTheDocument();
    });
    
    it('shows an error message if post deletion fails on homepage', async () => {
        const { within } = require('@testing-library/dom');
        api.getAllPosts.mockResolvedValueOnce({ data: [...mockPostsList] });
        api.deletePost.mockRejectedValueOnce({ response: { data: { message: 'Deletion failed on home' } } });
        window.confirm = jest.fn(() => true);
  
        renderHomePage(authState);
  
        await waitFor(() => {
          expect(screen.getByText(mockPostsList[0].title)).toBeInTheDocument();
        });
        
        const post1Item = screen.getByText(mockPostsList[0].title).closest(`.${styles.postItem}`);
        const deleteButtonPost1 = within(post1Item).getByRole('button', { name: /Delete/i});
        fireEvent.click(deleteButtonPost1);
  
        await waitFor(() => {
          expect(screen.getByText('Deletion failed on home')).toBeInTheDocument(); 
        });
        expect(screen.getByText(mockPostsList[0].title)).toBeInTheDocument();
      });
  });

  it('shows "Create Post" and "Create Community" buttons for authenticated users', async () => {
    renderHomePage({ isAuthenticated: true, user: mockUser });
    await waitFor(() => { expect(api.getAllPosts).toHaveBeenCalled() }); // Ensure page has loaded
    expect(screen.getByText('Create Post')).toBeInTheDocument();
    expect(screen.getByText('Create Community')).toBeInTheDocument();
  });

  it('does not show "Create Post" and "Create Community" buttons for unauthenticated users', async () => {
    renderHomePage({ isAuthenticated: false, user: null });
    await waitFor(() => { expect(api.getAllPosts).toHaveBeenCalled() });
    expect(screen.queryByText('Create Post')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Community')).not.toBeInTheDocument();
  });
});
