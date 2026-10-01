import axios from 'axios';

const API_BASE_URL = "https://btechbuddy-production.up.railway.app";


const api = axios.create({
  baseURL: API_BASE_URL,
});

export const signupUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('password', password);
  return await api.post('/auth/signup', formData);
};

export const verifyOtp = async (email, otp) => {
  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('otp', otp);
  return await api.post('/auth/verify-otp', formData);
};

export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('email', email);
  formData.append('password', password);
  return await api.post('/auth/login', formData);
};

export const getSubjects = async () => {
  return await api.get('/subjects/');
};

export default api;