import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signUpAdmin, validateSignUpData } from '../services/signupService';
import { Lock, Eye, EyeOff, UserPlus, User } from 'lucide-react';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Sign up form data
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    nationalId: ''
  });
  const [signUpErrors, setSignUpErrors] = useState({});
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setSignUpData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (signUpErrors[field]) {
      setSignUpErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to log in. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateSignUpData(signUpData);
    if (!validation.isValid) {
      setSignUpErrors(validation.errors);
      return;
    }

    try {
      setError('');
      setSignUpErrors({});
      setLoading(true);
      
      const result = await signUpAdmin(signUpData);
      alert(result.message);
      
      // Reset form and switch to login
      setSignUpData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobile: '',
        nationalId: ''
      });
      setIsSignUp(false);
      
    } catch (error) {
      console.error('Sign up error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pre-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            {isSignUp ? (
              <UserPlus className="h-6 w-6 text-pre-red" />
            ) : (
              <Lock className="h-6 w-6 text-pre-red" />
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            PRE Admin Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Request admin access' : 'Sign in to access the admin panel'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSignUpErrors({});
            }}
            className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              !isSignUp
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4 mr-2" />
            Sign In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSignUpErrors({});
            }}
            className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isSignUp
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </button>
        </div>
        
        {!isSignUp ? (
          // Login Form
          <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pre-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pre-red disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        ) : (
          // Sign Up Form
          <form className="mt-8 space-y-6" onSubmit={handleSignUpSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={signUpData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      signUpErrors.firstName ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm`}
                    placeholder="First name"
                  />
                  {signUpErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{signUpErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={signUpData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                      signUpErrors.lastName ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm`}
                    placeholder="Last name"
                  />
                  {signUpErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{signUpErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  value={signUpData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    signUpErrors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm`}
                  placeholder="Enter your email"
                />
                {signUpErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{signUpErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  value={signUpData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    signUpErrors.mobile ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm`}
                  placeholder="Enter mobile number"
                />
                {signUpErrors.mobile && (
                  <p className="mt-1 text-sm text-red-600">{signUpErrors.mobile}</p>
                )}
              </div>

              <div>
                <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700">
                  National ID
                </label>
                <input
                  id="nationalId"
                  name="nationalId"
                  type="text"
                  required
                  value={signUpData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    signUpErrors.nationalId ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm`}
                  placeholder="Enter national ID"
                />
                {signUpErrors.nationalId && (
                  <p className="mt-1 text-sm text-red-600">{signUpErrors.nationalId}</p>
                )}
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signUpData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                      signUpErrors.password ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {signUpErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{signUpErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={signUpData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    signUpErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pre-red focus:border-pre-red focus:z-10 sm:text-sm`}
                  placeholder="Confirm your password"
                />
                {signUpErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{signUpErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pre-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pre-red disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Request Admin Access'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Demo Credentials: admin@pre.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
