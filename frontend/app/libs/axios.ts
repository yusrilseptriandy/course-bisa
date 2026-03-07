import axios from 'axios';
import { authClient } from './auth-client';

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const { data: authData } = await authClient.token();
  if (authData?.token) {
    config.headers.Authorization = `Bearer ${authData.token}`;
  }
  return config;
});