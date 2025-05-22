import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);

// Posts
export const getAllPosts = () => api.get('/posts');
export const getPostsByCommunity = (communityIdentifier) => api.get(`/posts/community/${communityIdentifier}`);
export const getPostById = (postId) => api.get(`/posts/${postId}`);
export const createPost = (postData) => api.post('/posts', postData);
export const getPostsByAuthorId = (userId) => api.get(`/posts/author/${userId}`);
export const updatePost = (postId, postData) => api.put(`/posts/${postId}`, postData); // Added updatePost
export const deletePost = (postId) => api.delete(`/posts/${postId}`); // Added deletePost

// Communities
export const getAllCommunities = () => api.get('/communities');
export const getCommunityById = (identifier) => api.get(`/communities/${identifier}`);
export const createCommunity = (communityData) => api.post('/communities', communityData);

// Comments
export const getCommentsByPostId = (postId) => api.get(`/comments/post/${postId}`);
// Modified createComment to take postId as a separate parameter and use the correct route
export const createComment = (postId, commentData) => api.post(`/comments/post/${postId}`, commentData);

// Votes
export const votePost = (postId, voteData) => api.post(`/votes/post/${postId}`, voteData);
export const voteComment = (commentId, voteData) => api.post(`/votes/comment/${commentId}`, voteData);

export default api;
