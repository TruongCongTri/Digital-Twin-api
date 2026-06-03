/**
 * @file endpoints.ts
 * @description Registry of all API routes.
 * Prevents hardcoding URLs in controllers, services, or test suites.
 */

export const API_VERSION = '/api/v1';

export const ENDPOINTS = {
  BASE: {
    BASE: '/',
  },
  /* --- Authentication Module --- */
  AUTH: {
    BASE: '/auth',
    REGISTER: '/register',
    LOGIN: '/login',
    LOGOUT: '/logout',
    REFRESH_TOKEN: '/refresh-token',
    GOOGLE: '/google',
    GOOGLE_CALLBACK: '/google/callback',
    SEND_VERIFY_EMAIL: '/send-verify-email',
    VERIFY_EMAIL: '/verify-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    CHANGE_PASSWORD: '/change-password',
    SESSIONS: '/sessions',
    REVOKE_SESSION: '/sessions/:sessionId',
    REVOKE_OTHER_SESSIONS: '/sessions/others',
  },

  /* --- Example Endpoints --- */
  USER: {
    BASE: '/users',
    GET_BY_ID: '/:id',
    GET_ROLE_OF_USER: '/:id/role',
    PROFILE: '/me',
    LIST: '/',
    APPLICANTS: '/applicants',
    GET_APPLICANT: '/applicants/:id',
    UPDATE_STATUS: '/applicants/:id/status',
  },

  ASSET: {
    BASE: '/assets',
    GET_BY_ID: '/:id',
    UPDATE_STATUS: '/:id/status',
  },
} as const;
