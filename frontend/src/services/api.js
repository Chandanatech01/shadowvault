import axios from 'axios';
import { API_BASE } from '../config';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login - calls POST /api/auth/login
// Body: { email, password }  ->  Response: { token: "JWT token" }
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Register - calls POST /api/auth/register
// Body: { name, email, password } -> Response: { message: "User registered successfully" }
export const registerUser = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export default api;