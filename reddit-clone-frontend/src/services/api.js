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

// Communities
export const getAllCommunities = () => api.get('/communities');
export const getCommunityById = (identifier) => api.get(`/communities/${identifier}`);
export const createCommunity = (communityData) => api.post('/communities', communityData);

// Comments
export const getCommentsByPostId = (postId) => api.get(`/comments/post/${postId}`);
export const createComment = (commentData) => api.post('/comments', commentData);

// Votes
export const votePost = (postId, voteData) => api.post(`/votes/post/${postId}`, voteData);
export const voteComment = (commentId, voteData) => api.post(`/votes/comment/${commentId}`, voteData);

export default api;
