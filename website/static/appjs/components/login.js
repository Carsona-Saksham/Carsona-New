import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import AuthState from '../authState.js';

const Login = Vue.component('Login', {
    template : `
<div >
    <div v-if="alertMessage" class="alert-warning" :class="alertClass" role="alert">
      {{ alertMessage }}
      <button type="button" class="btn-close" @click="alertMessage = null"></button>
    </div>
    <div class="container-login">
    <div class="background-image-login"></div>
        
  <div>
      <div class="content-container-login">
        <h1>Luxury & Comfort for Your Drive</h1>
        <p>Experience the ultimate in style and comfort with our premium car seat covers. Designed for elegance, durability, and a perfect fit for your car.</p>
      </div>
  </div>
  <div>
    <div class="login-container-login">
      <h2>Login</h2>
      <form @submit.prevent="login">
        <input v-model="email" type="email" class="input-field-login" placeholder="Email Address" required>
        <input v-model="password" type="password" class="input-field-login" placeholder="Password" required>
        <button type="submit" class="login-button-login">Login</button>
      </form>
      
      <!-- Google Login Button with SVG -->
      <div class="google-login-container">
        <button @click="loginWithGoogle" class="google-login-button">
          <svg class="google-logo" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
      
      <router-link to="/sign_up" class="register-link-login">Don't have an account? Register</router-link>
    </div>    
  </div>
  </div>
</div>
    `,
    data() {
        return {
            password: '',
            email: '',
            is_admin:'',
            my_cars: {},
            alertMessage: null,
            alertClass: '',
        }
    },
    methods: {
      fetchMyCars() {
          return axios.get('/my_cars')
              .then(response => {
                  this.my_cars = response.data.my_cars;
                  console.log('Fetched my cars:', this.my_cars);
                  return this.my_cars; // Return my_cars for further checks
              })
              .catch(error => {
                  console.error('Error fetching my cars:', error);
                  throw new Error('Failed to fetch cars'); // Rethrow error to be caught in login
              });
      },
      login() {
          console.log('🔐 Login attempt started with email:', this.email);
          
          // Clear any previous error messages
          this.alertMessage = null;
          
          fetch('/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  username: this.email,
                  password: this.password,
              })
          })
          .then(response => {
              console.log('🔐 Login response status:', response.status);
              if (response.ok) { // Check if response status is OK
                  return response.json();
              } else {
                  console.error('Login failed with status:', response.status);
                  return response.json().then(errorData => {
                      console.error('Login error data:', errorData);
                      throw new Error(errorData.message || "Invalid credentials");
                  });
              }
          })
          .then(data => {
              console.log('✅ Login successful, data:', data);
              
              // Store the access token and admin status
              if (data.access_token) {
                  localStorage.setItem('access_token', data.access_token);
                  localStorage.setItem('is_admin', data.is_admin);
                  console.log('💾 Token stored:', data.access_token);
                  console.log('👤 Is admin:', data.is_admin);
                  
                  // Update global auth state
                  AuthState.login(data.access_token, data.is_admin);
                  console.log('🔄 Auth state updated');
              } else {
                  console.error('❌ No access token in response');
                  throw new Error("Invalid login response");
              }

              // Check for redirect context first
              const redirectContext = localStorage.getItem('loginRedirectContext');
              const anonymousSelection = localStorage.getItem('anonymousCarSelection');
              
              console.log('🔄 Checking redirect context:', redirectContext);
              console.log('🔄 Checking anonymous selection:', anonymousSelection);
              
              if (redirectContext) {
                  const context = JSON.parse(redirectContext);
                  console.log('🔄 Found login redirect context:', context);
                  
                  // Clear the redirect context
                  localStorage.removeItem('loginRedirectContext');
                  
                  // Handle anonymous car selection if it exists
                  if (anonymousSelection && !data.is_admin) {
                      const selectionData = JSON.parse(anonymousSelection);
                      console.log('🔄 Restoring anonymous car selection:', selectionData);
                      
                      // Clear the anonymous selection
                      localStorage.removeItem('anonymousCarSelection');
                      localStorage.removeItem('anonymousUserId');
                      
                      // Make the car selection API call
                      return axios.post('/setUp', {
                          selectedBrand: selectionData.selectedBrand,
                          selectedCar: selectionData.selectedCar
                      }, {
                          headers: { 'Authorization': 'Bearer ' + data.access_token }
                      }).then(() => {
                          // After successful car setup, redirect based on context
                          console.log('✅ Anonymous car selection restored, redirecting to:', context.destination);
                          // Add small delay to ensure auth state propagates
                          setTimeout(() => {
                              this.$router.push(context.destination);
                          }, 200);
                      }).catch(error => {
                          console.error('❌ Error restoring anonymous car selection:', error);
                          // Fall back to context redirect
                          setTimeout(() => {
                              this.$router.push(context.destination);
                          }, 200);
                      });
                  } else {
                      // No anonymous selection, just redirect based on context
                      console.log('✅ Redirecting to stored context:', context.destination);
                      // Add small delay to ensure auth state propagates
                      setTimeout(() => {
                          this.$router.push(context.destination);
                      }, 200);
                  }
              } else if (anonymousSelection && !data.is_admin) {
                  // Legacy handling for anonymous car selection without redirect context
                  const selectionData = JSON.parse(anonymousSelection);
                  console.log('🔄 Restoring anonymous car selection:', selectionData);
                  
                  // Clear the anonymous selection
                  localStorage.removeItem('anonymousCarSelection');
                  localStorage.removeItem('anonymousUserId');
                  
                  // Make the car selection API call
                  return axios.post('/setUp', {
                      selectedBrand: selectionData.selectedBrand,
                      selectedCar: selectionData.selectedCar
                  }, {
                      headers: { 'Authorization': 'Bearer ' + data.access_token }
                  }).then(() => {
                      // After successful car setup, redirect to seat covers
                      console.log('✅ Anonymous car selection restored, redirecting to seat covers');
                      // Add small delay to ensure auth state propagates
                      setTimeout(() => {
                          this.$router.push('/seat-covers');
                      }, 200);
                  }).catch(error => {
                      console.error('❌ Error restoring anonymous car selection:', error);
                      // Fall back to normal flow
                      return this.handleNormalLoginFlow(data);
                  });
              } else {
                  // Normal login flow
                  console.log('📋 Using normal login flow');
                  return this.handleNormalLoginFlow(data);
              }
          })
          .catch(error => {
              console.error('❌ Error during login process:', error); // Log specific errors
              this.alertMessage = error.message || "Invalid credentials. Please try again.";
              this.alertClass = 'alert-danger';
          });
      },
      loginWithGoogle() {
        console.log('Google login initiated');
        
        // Redirect to the Google OAuth endpoint
        window.location.href = '/api/login/google';
      },
      
      handleNormalLoginFlow(data) {
          // Fetch my cars after successful login
          return this.fetchMyCars().then(my_cars => {
              console.log('Current my_cars:', this.my_cars);
              
              // Check if user is admin
              if (data.is_admin) {
                  setTimeout(() => this.$router.push('/home'), 200);
              } else if (!my_cars || my_cars.length === 0) {
                  setTimeout(() => this.$router.push('/car_brands'), 200);
              } else {
                  console.log('User has cars:', my_cars.length);
                  setTimeout(() => this.$router.push('/seat-covers'), 200);
              }
          });
      },
      handleOAuthCallback() {
        // If we're here, it means the OAuth flow completed
        // The server response should be available
        // You might need to adjust this based on how your server returns the data
        
        // For now, let's check if we have the necessary data in localStorage
        const accessToken = localStorage.getItem('access_token');
        const isAdmin = localStorage.getItem('is_admin');
        
        if (accessToken) {
            // We have a token, redirect appropriately
            if (isAdmin === 'true') {
                this.$router.push('/home');
            } else {
                // Check if user has cars
                this.fetchMyCars().then(my_cars => {
                    if (!my_cars || my_cars.length === 0) {
                        this.$router.push('/car_brands');
                    } else {
                        this.$router.push('/seat-covers');
                    }
                });
            }
        }
      },
      handleGoogleOAuthSuccess(data) {
          console.log('🔐 Processing Google OAuth success');
          
          // Check for redirect context first
          const redirectContext = localStorage.getItem('loginRedirectContext');
          const anonymousSelection = localStorage.getItem('anonymousCarSelection');
          
          console.log('🔄 Checking redirect context:', redirectContext);
          console.log('🔄 Checking anonymous selection:', anonymousSelection);
          
          if (redirectContext) {
              const context = JSON.parse(redirectContext);
              console.log('🔄 Found login redirect context:', context);
              
              // Clear the redirect context
              localStorage.removeItem('loginRedirectContext');
              
              // Handle anonymous car selection if it exists
              if (anonymousSelection && !data.is_admin) {
                  const selectionData = JSON.parse(anonymousSelection);
                  console.log('🔄 Restoring anonymous car selection:', selectionData);
                  
                  // Clear the anonymous selection
                  localStorage.removeItem('anonymousCarSelection');
                  localStorage.removeItem('anonymousUserId');
                  
                  // Make the car selection API call
                  return axios.post('/setUp', {
                      selectedBrand: selectionData.selectedBrand,
                      selectedCar: selectionData.selectedCar
                  }, {
                      headers: { 'Authorization': 'Bearer ' + data.access_token }
                  }).then(() => {
                      // After successful car setup, redirect based on context
                      console.log('✅ Anonymous car selection restored, redirecting to:', context.destination);
                      // Add small delay to ensure auth state propagates
                      setTimeout(() => {
                          this.$router.push(context.destination);
                      }, 200);
                  }).catch(error => {
                      console.error('❌ Error restoring anonymous car selection:', error);
                      // Fall back to context redirect
                      setTimeout(() => {
                          this.$router.push(context.destination);
                      }, 200);
                  });
              } else {
                  // No anonymous selection, just redirect based on context
                  console.log('✅ Redirecting to stored context:', context.destination);
                  // Add small delay to ensure auth state propagates
                  setTimeout(() => {
                      this.$router.push(context.destination);
                  }, 200);
              }
          } else if (anonymousSelection && !data.is_admin) {
              // Legacy handling for anonymous car selection without redirect context
              const selectionData = JSON.parse(anonymousSelection);
              console.log('🔄 Restoring anonymous car selection:', selectionData);
              
              // Clear the anonymous selection
              localStorage.removeItem('anonymousCarSelection');
              localStorage.removeItem('anonymousUserId');
              
              // Make the car selection API call
              return axios.post('/setUp', {
                  selectedBrand: selectionData.selectedBrand,
                  selectedCar: selectionData.selectedCar
              }, {
                  headers: { 'Authorization': 'Bearer ' + data.access_token }
              }).then(() => {
                  // After successful car setup, redirect to seat covers
                  console.log('✅ Anonymous car selection restored, redirecting to seat covers');
                  // Add small delay to ensure auth state propagates
                  setTimeout(() => {
                      this.$router.push('/seat-covers');
                  }, 200);
              }).catch(error => {
                  console.error('❌ Error restoring anonymous car selection:', error);
                  // Fall back to normal flow
                  return this.handleNormalLoginFlow(data);
              });
          } else {
              // Normal login flow
              console.log('📋 Using normal login flow');
              return this.handleNormalLoginFlow(data);
          }
      },
  },
  mounted() {
    // Check if we're on the callback page with OAuth response data
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for direct OAuth token in URL parameters (from backend redirect)
    if (urlParams.has('token') && urlParams.has('is_admin')) {
        console.log('🔐 Google OAuth token found in URL parameters');
        const token = urlParams.get('token');
        const isAdmin = urlParams.get('is_admin') === 'true';
        
        // Store the token and admin status
        localStorage.setItem('access_token', token);
        localStorage.setItem('is_admin', isAdmin);
        console.log('💾 Google OAuth token stored:', token);
        console.log('👤 Is admin:', isAdmin);
        
        // Update global auth state
        AuthState.login(token, isAdmin);
        console.log('🔄 Auth state updated from Google OAuth');
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Handle redirect context if exists
        this.handleGoogleOAuthSuccess({ access_token: token, is_admin: isAdmin });
        return;
    }
    
    // Check for OAuth callback patterns
    if (urlParams.has('code') || window.location.pathname === '/login/callback') {
        // We're being redirected back from Google
        // The server should have already processed this and returned JSON
        // Check if there's response data in the URL or handle it appropriately
        this.handleOAuthCallback();
    }
  }
})


export default Login