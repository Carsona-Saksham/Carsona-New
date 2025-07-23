// Global Authentication State Manager
const AuthState = {
  // Authentication state
  isLoggedIn: false,
  isAdmin: false,
  
  // Event listeners for auth state changes
  listeners: [],
  
  // Check current authentication state
  checkAuthState() {
    const token = localStorage.getItem('access_token');
    const sessionData = localStorage.getItem('sessionData');
    const wasLoggedIn = this.isLoggedIn;
    
    this.isLoggedIn = !!(token || sessionData);
    this.isAdmin = localStorage.getItem('is_admin') === 'true';
    
    console.log('🔍 AuthState check:', { isLoggedIn: this.isLoggedIn, isAdmin: this.isAdmin });
    
    // Notify listeners if state changed
    if (wasLoggedIn !== this.isLoggedIn) {
      this.notifyListeners();
    }
    
    return this.isLoggedIn;
  },
  
  // Add listener for auth state changes
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  },
  
  // Notify all listeners of state change
  notifyListeners() {
    console.log('🔄 Notifying auth state listeners:', this.listeners.length);
    this.listeners.forEach(callback => {
      try {
        callback(this.isLoggedIn, this.isAdmin);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  },
  
  // Force refresh authentication state
  refreshAuthState() {
    console.log('🔄 Forcing auth state refresh...');
    this.checkAuthState();
  },
  
  // Login method
  login(token, isAdmin) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('is_admin', isAdmin);
    this.isLoggedIn = true;
    this.isAdmin = isAdmin;
    this.notifyListeners();
  },
  
  // Logout method
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('sessionData');
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.notifyListeners();
  }
};

// Initialize on load
AuthState.checkAuthState();

export default AuthState; 