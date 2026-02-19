import axios from 'axios';
import { authClient } from './auth-client';

export const api = axios.create({
  baseURL: "http://localhost:4000/api/",
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const { data: authData } = await authClient.token();

  console.log("Token yang dikirim:", authData?.token);

  if (authData?.token) {
    config.headers.Authorization = `Bearer ${authData.token}`;
  }
  return config;
});