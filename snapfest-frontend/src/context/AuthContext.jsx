import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { userAPI, vendorAPI, adminAPI } from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  SET_LOADING: 'SET_LOADING',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.user.role,
        isAuthenticated: true,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.user.role,
        isAuthenticated: true,
        isLoading: false,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      console.log('🔍 AuthContext Reducer: UPDATE_USER called with payload:', action.payload);
      console.log('🔍 AuthContext Reducer: Current user before merge:', state.user);
      const mergedUser = { ...state.user, ...action.payload };
      console.log('🔍 AuthContext Reducer: Merged user:', mergedUser);
      return {
        ...state,
        user: mergedUser,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          const userData = JSON.parse(user);
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER,
            payload: { user: userData, token },
          });
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials, userType = 'user') => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      let response;
      if (userType === 'vendor') {
        response = await vendorAPI.login(credentials);
      } else if (userType === 'admin') {
        response = await adminAPI.login(credentials);
      } else {
        response = await userAPI.login(credentials);
      }

      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData, userType = 'user') => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      let response;
      if (userType === 'vendor') {
        response = await vendorAPI.register(userData);
      } else {
        response = await userAPI.register(userData);
      }

      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API if user is authenticated
      if (state.isAuthenticated) {
        if (state.role === 'vendor') {
          await vendorAPI.logout();
        } else {
          await userAPI.logout();
        }
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateUser = (userData) => {
    console.log('🔍 AuthContext: updateUser called with:', userData);
    console.log('🔍 AuthContext: Current user before update:', state.user);
    const updatedUser = { ...state.user, ...userData };
    console.log('🔍 AuthContext: Updated user object:', updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.role === role;
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.role === 'admin';
  };

  // Check if user is vendor
  const isVendor = () => {
    return state.role === 'vendor';
  };

  // Check if user is regular user
  const isUser = () => {
    return state.role === 'user';
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isVendor,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
