import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import AuthState from '../authState.js';

const SeatCovers = Vue.component('SeatCovers', {
    template: `
    <div class="container-mycars">
    <link rel="stylesheet" href="/static/seat_cover_fixes.css">
    <nav class="navbar-userhome">
      <!--<div class="container-fluid">-->
                            <router-link class="navbar-brand-userhome" :to="{ path: '/seat-covers' }" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
        <!--<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>-->
        <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
        <div class="nav-item">
          <router-link class="nav-link  white-text" aria-current="page" to="/home"  v-if="is_ad">Home</router-link>
            <router-link class="nav-link  white-text" aria-current="page" to="/my_orders" v-else-if="isLoggedIn">My Orders</router-link>
        </div>
        <div class="nav-item" >
            <router-link class="nav-link active  white-text" to="/add_seatcovers" v-if="is_ad">Add Seat Covers</router-link>
            <router-link class="nav-link  white-text" to="/my_cars" v-else-if="isLoggedIn">My Cars</router-link>
        </div>
        <ul class="navbar-nav navbar-nav mr-auto">
          
          <li class="nav-item dropdown" v-if="isLoggedIn">  
            <a class="dropdown-toggle  white-text" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              <span v-if="is_ad">Admin</span>
              <span v-else>User</span>
            </a>
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
              <li><router-link class="nav-link" to="/login">Logout</router-link></li>
            </ul>
          </li>
          <li class="nav-item" v-else>
            <a href="#" @click="handleNavbarLogin" class="white-text nav-link">Login</a>
          </li>
        </ul>
      <!--</div>-->
      </div>
    </nav>

    <!-- Main Content with Sidebar -->
    <div class="seat-covers-main-container">
      <!-- Sidebar -->
      <div class="seat-covers-sidebar" v-if="!is_ad">
        <div class="sidebar-content">
          <!-- Selected Car Section -->
          <div class="selected-car-section">
            <h4>Selected Car</h4>
            <div v-if="selectedCar" class="selected-car-card">
              <img :src="selectedCar.poster" alt="Car Image" class="selected-car-image">
              <div class="selected-car-info">
                <h5>{{ selectedCar.brand }} {{ selectedCar.name }}</h5>
                <button @click="goToMyCars" class="btn-change-car">Change Car</button>
              </div>
            </div>
            <div v-else class="no-car-selected">
              <p>No car selected</p>
              <button @click="goToMyCars" class="btn-select-car">Select Car</button>
            </div>
          </div>

          <!-- Sort Section -->
          <div class="sort-section">
            <h4>Sort By</h4>
            <div class="sort-options">
              <label class="sort-option">
                <input type="radio" v-model="sortBy" value="price-low" @change="applySortAndFilter">
                <span>Price: Low to High</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortBy" value="price-high" @change="applySortAndFilter">
                <span>Price: High to Low</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortBy" value="discount" @change="applySortAndFilter">
                <span>Highest Discount</span>
              </label>
              <label class="sort-option">
                <input type="radio" v-model="sortBy" value="name" @change="applySortAndFilter">
                <span>Name A-Z</span>
              </label>
            </div>
          </div>

          <!-- Filter Section -->
          <div class="filter-section">
            <h4>Filter by Price</h4>
            <div class="price-filter">
              <div class="price-range">
                <label>Min Price: ₹{{ minPrice }}</label>
                <input type="range" v-model="minPrice" :min="0" :max="maxPossiblePrice" @input="applySortAndFilter" class="price-slider">
              </div>
              <div class="price-range">
                <label>Max Price: ₹{{ maxPrice }}</label>
                <input type="range" v-model="maxPrice" :min="0" :max="maxPossiblePrice" @input="applySortAndFilter" class="price-slider">
              </div>
            </div>
            
            <!-- Discount Filter -->
            <div class="discount-filter">
              <h5>Minimum Discount</h5>
              <div class="discount-options">
                <label class="discount-option">
                  <input type="radio" v-model="minDiscount" value="0" @change="applySortAndFilter">
                  <span>All Products</span>
                </label>
                <label class="discount-option">
                  <input type="radio" v-model="minDiscount" value="10" @change="applySortAndFilter">
                  <span>10% or more</span>
                </label>
                <label class="discount-option">
                  <input type="radio" v-model="minDiscount" value="20" @change="applySortAndFilter">
                  <span>20% or more</span>
                </label>
                <label class="discount-option">
                  <input type="radio" v-model="minDiscount" value="30" @change="applySortAndFilter">
                  <span>30% or more</span>
                </label>
              </div>
            </div>

            <!-- Clear Filters -->
            <button @click="clearFilters" class="btn-clear-filters">Clear All Filters</button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="seat-covers-content" :class="{ 'full-width': is_ad }">
        <main class="container mx-auto mt-12">
          <section class="mt-20">
            <div class="flex items-center justify-center h-screen" style="margin-top: 60px;">
                <div class="text-center">
                    <h3 class="text-4xl font-bold text-gray-800 mb-4" v-if="!is_ad">Explore our personalised collection for your selected car</h3>
                    <h3 class="text-4xl font-bold text-gray-800 mb-4" v-else>Manage Seat Covers</h3>
                    <div v-if="!is_ad && filteredSeatCovers.length !== seatCovers.length && !isLoadingSeatCovers" class="filter-info">
                      <p class="text-lg text-gray-600">Showing {{ filteredSeatCovers.length }} of {{ seatCovers.length }} products</p>
                    </div>
                </div>
            </div>

            <!-- Loading Indicator -->
            <div v-if="isLoadingSeatCovers || isLoadingCar" class="loading-container">
              <div class="loading-content">
                <div class="loading-spinner"></div>
                <h3 class="loading-text" v-if="isLoadingCar">Finding your car...</h3>
                <h3 class="loading-text" v-else-if="isLoadingSeatCovers">Loading seat covers...</h3>
                <p class="loading-subtext">Please wait while we prepare your personalized collection</p>
              </div>
            </div>

            <!-- Seat Covers Grid -->
            <div v-else-if="initialLoadComplete" class="cards-list">
              <div v-for="seatCover in paginatedSeatCovers" :key="seatCover.id" class="product-card" @click="goToDetails(seatCover)">
                <div class="relative">
                  <img :src="seatCover.poster" alt="Product Image" class="product-image" />
                  <button class="close-button" @click.stop="deleteSeatCover(seatCover.id)" v-if="is_ad">✖</button>
                  <router-link :to="{ path: '/update_seatcover/' + seatCover.id }" class="card-link" v-if="is_ad">Update</router-link>
                  <div class="discount-badge" v-if="seatCover.discount > 0">
                    {{seatCover.discount}}% OFF
                  </div>
                </div>
                <div class="card-content">
                  <h2 class="product-title">{{ seatCover.name }}</h2>
                  <div class="price-info">
                    <p class="original-price" v-if="seatCover.discount > 0">₹{{seatCover.price}}</p>
                    <p class="product-price">₹{{(seatCover.price-seatCover.discount/100*seatCover.price).toFixed(0)}}</p>
                    <div class="variant-info">
                      <p v-if="seatCover.variants && seatCover.variants.length > 0">
                        Onwards
                      </p>
                      <p v-else>
                        Premium quality seat cover
                      </p>
                    </div>
                  </div>
                  
                  <!-- Color variants selector - Only show if there are actual color variants -->
                  <div v-if="seatCover.has_color_variants && seatCover.color_variants && seatCover.color_variants.length > 0" class="color-variants-preview">
                    <div class="color-dots">
                      <!-- Default variant circle -->
                      <span 
                        class="color-dot default-variant"
                        :class="{ 'selected': !seatCover.selectedColorId }"
                        :style="{ 
                          backgroundColor: !seatCover.selectedColorId ? '#4CAF50' : '#f0f0f0',
                          border: '2px solid #ccc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          color: !seatCover.selectedColorId ? 'white' : '#666'
                        }"
                        title="Default"
                        @click.stop="selectDefaultColor(seatCover)"
                      >
                        D
                      </span>
                      
                      <!-- Color variant circles (show up to 4 color variants) -->
                      <span 
                        v-for="color in seatCover.color_variants.slice(0, 4)" 
                        :key="color.id"
                        class="color-dot"
                        :class="{ 'selected': seatCover.selectedColorId === color.id }"
                        :style="{ backgroundColor: color.color_code }"
                        :title="color.display_name || color.color_name"
                        @click.stop="selectColor(seatCover, color)"
                      >
                        <!-- Dual color indicator -->
                        <span v-if="color.is_dual_color" 
                              class="dual-color-indicator"
                              :style="{ backgroundColor: color.secondary_color_code }">
                        </span>
                      </span>
                      <span v-if="seatCover.color_variants.length > 4" class="color-more">
                        +{{ seatCover.color_variants.length - 4 }}
                      </span>
                    </div>
                    <small class="color-text">
                      {{ seatCover.color_variants.length + 1 }} options available
                      <span v-if="seatCover.selectedColorVariant">
                        - {{ seatCover.selectedColorVariant.display_name || seatCover.selectedColorVariant.color_name }}
                      </span>
                      <span v-else-if="!seatCover.selectedColorId">
                        - Default
                      </span>
                    </small>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Pagination Controls -->
            <div v-if="!isLoadingSeatCovers && !isLoadingCar && initialLoadComplete && totalPages > 1" class="pagination-container">
              <!-- Pagination Info -->
              <div class="pagination-info">
                <p>Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalSeatCovers }} seat covers</p>
              </div>
              
              <div class="pagination-controls">
                <!-- First Page -->
                <button 
                  @click="goToFirst" 
                  :disabled="!hasPrevious"
                  class="pagination-btn"
                  title="First Page"
                >
                  &laquo;
                </button>
                
                <!-- Previous Page -->
                <button 
                  @click="goToPrevious" 
                  :disabled="!hasPrevious"
                  class="pagination-btn"
                  title="Previous Page"
                >
                  &lsaquo;
                </button>
                
                <!-- Page Numbers -->
                <button 
                  v-for="page in pageNumbers" 
                  :key="page"
                  @click="goToPage(page)"
                  :class="['pagination-btn', { 'active': page === currentPage }]"
                >
                  {{ page }}
                </button>
                
                <!-- Next Page -->
                <button 
                  @click="goToNext" 
                  :disabled="!hasNext"
                  class="pagination-btn"
                  title="Next Page"
                >
                  &rsaquo;
                </button>
                
                <!-- Last Page -->
                <button 
                  @click="goToLast" 
                  :disabled="!hasNext"
                  class="pagination-btn"
                  title="Last Page"
                >
                  &raquo;
                </button>
              </div>
              
              <!-- Page Info -->
              <div class="pagination-info-bottom">
                <span>Page {{ currentPage }} of {{ totalPages }}</span>
              </div>
            </div>

            <!-- No Results Message -->
            <div v-if="!isLoadingSeatCovers && !isLoadingCar && initialLoadComplete && filteredSeatCovers.length === 0 && seatCovers.length > 0" class="no-results">
              <div class="no-results-content">
                <h3>No products match your filters</h3>
                <p>Try adjusting your price range or discount filters</p>
                <button @click="clearFilters" class="btn-clear-filters">Clear All Filters</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>

    <footer class="footer white-text">
      <div class="footer__addr white-text">
        <h1 class="footer__logo white-text"><h2 class="logo-text white-text"><img class="logo footer_logo white-text" src="../static/logo.png">Carsona</h2></h1>
      </div>

      <ul class="footer__nav white-text">
        <li class="nav__item white-text">
          <h2 class="nav__title white-text">Quick Links</h2>
          <ul class="nav__ul white-text">
                                    <li><router-link :to="is_ad ? '/home' : '/seat-covers'" class="white-text">Home</router-link></li>
            <li><router-link to="/my_orders" class="white-text" v-if="!is_ad">My Orders</router-link></li>
            <li><router-link to="/my_cars" class="white-text" v-if="!is_ad">My Cars</router-link></li>
            <li><router-link to="/add_seatcovers" class="white-text" v-if="is_ad">Add Seat Covers</router-link></li>
          </ul>
        </li>

        <li class="nav__item white-text">
          <h2 class="nav__title white-text">Support</h2>
          <ul class="nav__ul white-text">
            <li>
              <a @click="openPolicyPage('/contact-us')" class="white-text" style="cursor: pointer;">Contact Us</a>
            </li>
            <li>
              <a @click="openPolicyPage('/shipping-policy')" class="white-text" style="cursor: pointer;">Shipping Policy</a>
            </li>
            <li>
              <a @click="openPolicyPage('/cancellations-and-refunds')" class="white-text" style="cursor: pointer;">Returns & Refunds</a>
            </li>
          </ul>
        </li>

        <li class="nav__item white-text">
          <h2 class="nav__title white-text">Legal</h2>
          <ul class="nav__ul white-text">
            <li>
              <a @click="openPolicyPage('/privacy-policy')" class="white-text" style="cursor: pointer;">Privacy Policy</a>
            </li>
            <li>
              <a @click="openPolicyPage('/terms-and-conditions')" class="white-text" style="cursor: pointer;">Terms & Conditions</a>
            </li>
          </ul>
        </li>
      </ul>

      <div class="legal">
        <p class="white-text">&copy; 2025 Carsona. All rights reserved.</p>
      </div>
    </footer>
    </div>
    `,
    data() {
      return {
        categories: {},
        is_ad: false,
        user: {
            isAuthenticated: false,
            isAdmin: localStorage.getItem('is_admin') === 'true' ? true : false,
            name: localStorage.getItem('name'),
          },
        seatCovers: [],
        filteredSeatCovers: [],
        selectedCar: null,
        newSeatCover: {
          name: '',
          price: 0,
          discount: 0,
          car_ids: []
        },
        // Sorting and filtering
        sortBy: '',
        minPrice: 0,
        maxPrice: 10000,
        maxPossiblePrice: 10000,
        minDiscount: '0',
        // Loading states
        isLoadingSeatCovers: true,
        isLoadingCar: false,
        initialLoadComplete: false,
        // Performance optimizations
        currentPage: 1,
        perPage: 10, // Changed from 12 to 10 for better pagination
        totalPages: 1,
        hasNextPage: false,
        isLoadingMore: false,
        // Caching
        cachedSeatCovers: new Map(),
        lastFetchTime: null,
        cacheTimeout: 5 * 60 * 1000 // 5 minutes cache
      };
    },
    computed: {
      displayedSeatCovers() {
        return this.is_ad ? this.seatCovers : this.filteredSeatCovers;
      },
      isLoggedIn() {
        return AuthState.isLoggedIn;
      },
      // Pagination computed properties
      totalSeatCovers() {
        return this.is_ad ? this.seatCovers.length : this.filteredSeatCovers.length;
      },
      startIndex() {
        return (this.currentPage - 1) * this.perPage;
      },
      endIndex() {
        return Math.min(this.startIndex + this.perPage, this.totalSeatCovers);
      },
      // Generate page numbers for pagination controls
      pageNumbers() {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust startPage if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
        return pages;
      },
      hasPrevious() {
        return this.currentPage > 1;
      },
      hasNext() {
        return this.currentPage < this.totalPages;
      },
      // Paginated seat covers for display
      paginatedSeatCovers() {
        const covers = this.displayedSeatCovers;
        const start = this.startIndex;
        const end = this.endIndex;
        return covers.slice(start, end);
      }
    },
    methods: {
      logPoster: function(poster) {
        console.log(poster);
        return poster;

      },
      fetchSeatCovers(loadMore = false) {
        console.log('🔄 Fetching seat covers...');
        console.log('🔍 Current selectedCar:', this.selectedCar);
        console.log('🔍 Current is_ad:', this.is_ad);
        
        // Check cache first for better performance
        const cacheKey = this.getCacheKey();
        if (!loadMore && this.isCacheValid(cacheKey)) {
          console.log('💾 Using cached seat covers');
          const cached = this.cachedSeatCovers.get(cacheKey);
          this.seatCovers = cached.data;
          this.totalPages = cached.totalPages;
          this.hasNextPage = cached.hasNextPage;
          this.isLoadingSeatCovers = false;
          this.initialLoadComplete = true;
          return;
        }
        
        // Set loading state
        this.isLoadingSeatCovers = true;
        this.currentPage = 1; // Reset to first page
        
        // Build URL - fetch all data at once for frontend pagination
        let url = '/api/seat_covers';
        const params = new URLSearchParams();
        
        // Fetch more items per request for better performance
        params.append('page', '1');
        params.append('per_page', '100'); // Fetch 100 items at once
        
        if (!this.is_ad && this.selectedCar && this.selectedCar.available_car_id) {
          params.append('car_id', this.selectedCar.available_car_id.toString());
          console.log(`🚗 FILTERING seat covers for car: ${this.selectedCar.brand} ${this.selectedCar.name} (AvailableCars ID: ${this.selectedCar.available_car_id})`);
        }
        
        url += '?' + params.toString();
        console.log(`📞 API URL: ${url}`);
        
        axios.get(url)
          .then(response => {
            console.log('✅ API Response:', response.data);
            
            const newSeatCovers = response.data.Seat_Covers || response.data.seat_covers || [];
            
            // For frontend pagination, we load all data at once
            this.seatCovers = newSeatCovers;
            
            console.log('📦 Loaded seat covers:', newSeatCovers.length);
            
            // Cache the results for better performance
            this.cacheResults(cacheKey, {
              data: this.seatCovers,
              totalPages: this.totalPages,
              hasNextPage: this.hasNextPage
            });
            
            // Log filtering info
            if (response.data.filtered_by_car) {
              console.log(`🎯 Results filtered for car ID: ${response.data.selected_car_id}`);
            }
            
            if (this.seatCovers.length === 0 && response.data.filtered_by_car) {
              console.log('⚠️ No seat covers compatible with selected car');
            }
          })
          .catch(error => {
            console.error('❌ Error fetching seat covers:', error);
            console.error('❌ Error details:', error.response?.data);
            
            this.seatCovers = [];
            
            // Show user-friendly error
            if (error.response?.status === 404) {
              console.warn('⚠️ Seat covers category not found');
            } else if (error.response?.status >= 500) {
              console.error('🔥 Server error when fetching seat covers');
            }
          })
          .finally(() => {
            // Always clear loading state
            this.isLoadingSeatCovers = false;
            this.initialLoadComplete = true;
          });
      },
      
      // Pagination navigation methods
      goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
          // Scroll to top of seat covers section
          this.$nextTick(() => {
            const seatCoversContent = document.querySelector('.seat-covers-content');
            if (seatCoversContent) {
              seatCoversContent.scrollIntoView({ behavior: 'smooth' });
            }
          });
        }
      },
      goToPrevious() {
        if (this.hasPrevious) {
          this.goToPage(this.currentPage - 1);
        }
      },
      goToNext() {
        if (this.hasNext) {
          this.goToPage(this.currentPage + 1);
        }
      },
      goToFirst() {
        this.goToPage(1);
      },
      goToLast() {
        this.goToPage(this.totalPages);
      },
      
      loadMoreSeatCovers() {
        // This method is now deprecated in favor of pagination
        console.warn('loadMoreSeatCovers is deprecated - using pagination instead');
      },
      
      // Performance optimization methods
      getCacheKey() {
        const carId = this.selectedCar?.available_car_id || 'no-car';
        const adminStatus = this.is_ad ? 'admin' : 'user';
        return `${adminStatus}-${carId}`;
      },
      
      isCacheValid(cacheKey) {
        if (!this.cachedSeatCovers.has(cacheKey)) return false;
        if (!this.lastFetchTime) return false;
        return (Date.now() - this.lastFetchTime) < this.cacheTimeout;
      },
      
      cacheResults(cacheKey, data) {
        this.cachedSeatCovers.set(cacheKey, data);
        this.lastFetchTime = Date.now();
      },
      
      clearCarCache(carId) {
        if (!carId) return;
        console.log(`Clearing all cache entries for car ID: ${carId}`);
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(`seatcovers-car-${carId}`)) {
                localStorage.removeItem(key);
                console.log(`Removed cache key: ${key}`);
            }
        });
      },
      fetchcategories() {
        axios.get('/categories',{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
          .then(response => {
            this.categories = response.data.category;
          })
          .catch(error => {
            console.error(error);
          });
      },
      confirmDelete(id) {
        if (confirm('Do you want to delete this Seat Cover?')) {
          this.deleteSeatCover(id);
        }
      },
      deleteSeatCover(id) {
        axios.delete('/api/removeSeatCover/' + id, {headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
          .then(response => {
            console.log(response.data);
            this.seatCovers = this.seatCovers.filter(cover => cover.id !== id);


          })
          .catch(error => {
            console.error("Error deleting Seat Cover:", error);
          });
      },
      addSeatCover() {
        axios.post('/api/add_seatcovers', this.newSeatCover, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
        })
        .then(response => {
          console.log('Seat cover added:', response.data);
          this.seatCovers.push(response.data.category); // Add the new seat cover to the list
          this.newSeatCover = { name: '', price: 0, discount: 0, car_ids: [] }; // Reset form
        })
        .catch(error => {
          console.error('Error adding seat cover:', error);
        });
      },
      goToDetails(seatCover) {
        console.log('🔗 Navigating to details for seat cover:', seatCover.id);
        console.log('🎨 Selected color variant:', seatCover.selectedColorVariant);
        console.log('🎯 Selected color ID:', seatCover.selectedColorId, typeof seatCover.selectedColorId);
        
        // Check if user is logged in - redirect anonymous users to login
        if (!this.isLoggedIn) {
          console.log('🔒 Anonymous user trying to access seat cover details, redirecting to login...');
          
          // Store the intended destination and seat cover details for after login
          const redirectContext = {
            origin: 'seat_cover_details',
            seatCoverId: seatCover.id,
            colorVariantId: seatCover.selectedColorId,
            colorName: seatCover.selectedColorVariant?.display_name || seatCover.selectedColorVariant?.color_name,
            destination: `/seat_cover/${seatCover.id}`
          };
          
          if (seatCover.selectedColorVariant && seatCover.selectedColorId) {
            redirectContext.destination += `?colorVariantId=${seatCover.selectedColorId}&colorName=${encodeURIComponent(redirectContext.colorName)}`;
          }
          
          localStorage.setItem('loginRedirectContext', JSON.stringify(redirectContext));
          console.log('📍 Stored login redirect context:', redirectContext);
          
          this.$router.push('/login');
          return;
        }
        
        // Build route with query parameters for color variant
        const route = { 
          name: 'SeatCoverDetails', 
          params: { id: seatCover.id } 
        };
        
        // If user has selected a specific color variant (including default), pass it via query parameters
        if (seatCover.selectedColorVariant && seatCover.selectedColorId) {
          route.query = {
            colorVariantId: seatCover.selectedColorId,
            colorName: seatCover.selectedColorVariant.display_name || seatCover.selectedColorVariant.color_name
          };
          console.log('🎨 Passing color variant to details:', route.query);
        } else {
          console.log('🎨 No color variant selected, will use default');
        }
        
        this.$router.push(route);
      },
      editSeatCover(id) {
        this.$router.push({ name: 'UpdateSeatCover', params: { id } });
      },
      goToMyCars() {
        this.$router.push({ name: 'MyCars' });
      },
      handleNavbarLogin() {
        console.log('🔒 User clicked login in navbar');
        
        // Store context that user came from seat covers page
        const redirectContext = {
          origin: 'navbar_login',
          destination: '/seat-covers'
        };
        
        localStorage.setItem('loginRedirectContext', JSON.stringify(redirectContext));
        console.log('📍 Stored navbar login redirect context:', redirectContext);
        
        this.$router.push('/login');
      },
      selectColor(seatCover, color) {
        console.log('🎨 Color selected:', color.display_name || color.color_name);
        console.log('🎯 Color ID:', color.id, typeof color.id);
        
        // Store original poster if not already stored
        if (!seatCover.original_poster) {
          seatCover.original_poster = seatCover.poster;
        }
        
        // Update the seat cover's poster to show the selected color
        seatCover.poster = color.poster || seatCover.original_poster;
        seatCover.selectedColorId = color.id;
        seatCover.selectedColorVariant = color;
        
        // Use Vue.set for better reactivity instead of $forceUpdate
        this.$set(seatCover, 'selectedColorId', color.id);
        this.$set(seatCover, 'selectedColorVariant', color);
        
        console.log('✅ Color selection updated:', {
          selectedColorId: seatCover.selectedColorId,
          selectedColorVariant: seatCover.selectedColorVariant?.color_name
        });
      },
      selectDefaultColor(seatCover) {
        console.log('🎨 Default color selected');
        
        // Restore original poster and clear selection
        if (seatCover.original_poster) {
          seatCover.poster = seatCover.original_poster;
        }
        
        // Instead of setting to null, mark as "default" selection
        // Use Vue.set for better reactivity instead of $forceUpdate
        this.$set(seatCover, 'selectedColorId', 'default');
        this.$set(seatCover, 'selectedColorVariant', { 
          id: 'default',
          color_name: 'Default',
          display_name: 'Default'
        });
        
        console.log('✅ Default color selection updated:', {
          selectedColorId: seatCover.selectedColorId,
          selectedColorVariant: seatCover.selectedColorVariant?.color_name
        });
      },
      fetchSelectedCar() {
        console.log('🚗 Fetching selected car...');
        console.log('🔍 Current is_ad status:', this.is_ad);
        
        if (!this.is_ad) {
          axios.get('/my_cars')
            .then(response => {
              console.log('✅ My cars response:', response.data);
              const cars = response.data.my_cars || [];
              console.log('🚗 Available cars:', cars);
              
              // Find the selected car
              this.selectedCar = cars.find(car => car.selected === true) || cars[0] || null;
              console.log('🎯 Selected car:', this.selectedCar);
              
              if (!this.selectedCar && cars.length > 0) {
                console.log('⚠️ No car marked as selected, using first car');
                this.selectedCar = cars[0];
              }
              
              if (!this.selectedCar) {
                console.log('❌ No cars found for user');
              }
            })
            .catch(error => {
              console.error('❌ Error fetching selected car:', error);
              console.error('❌ Error details:', error.response?.data);
              this.selectedCar = null;
            });
        } else {
          console.log('👤 User is admin, skipping car selection');
        }
      },
      fetchSelectedCarThenSeatCovers() {
        console.log('🚗 Fetching selected car then seat covers...');
        console.log('🔍 Current is_ad status:', this.is_ad);
        
        if (!this.is_ad) {
          this.isLoadingCar = true;
          
          // Check if we have cached car data (works for both authenticated and anonymous users)
          const cachedCar = localStorage.getItem('selectedCar');
          if (cachedCar) {
            try {
              this.selectedCar = JSON.parse(cachedCar);
              console.log('💾 Using cached selected car:', this.selectedCar);
              
              // Check if this is an anonymous selection
              if (this.selectedCar.anonymous) {
                console.log('👤 Anonymous car selection detected, proceeding with cached data');
                this.isLoadingCar = false;
                // selectedCar watcher will trigger seat covers fetch
                return;
              } else {
                console.log('🔐 Authenticated car selection, will verify with server');
              }
            } catch (e) {
              console.warn('⚠️ Invalid cached car data, fetching fresh');
            }
          }
          
          // Check if user is authenticated before making API call
          const token = localStorage.getItem('access_token');
          const sessionData = localStorage.getItem('sessionData');
          
          if (!token && !sessionData) {
            // User is not authenticated - check if we have anonymous car selection
            if (this.selectedCar && this.selectedCar.anonymous) {
              console.log('👤 Anonymous user with car selection, proceeding');
              this.isLoadingCar = false;
              return;
            } else {
              console.log('👤 Anonymous user without car selection, loading unfiltered seat covers');
              this.selectedCar = null;
              this.isLoadingCar = false;
              this.fetchSeatCovers();
              return;
            }
          }
          
          // Authenticated user - fetch from server
          axios.get('/my_cars', { params: { t: new Date().getTime() } })
            .then(response => {
              console.log('✅ My cars response:', response.data);
              const cars = response.data.my_cars || [];
              console.log('🚗 Available cars:', cars);
              
              // Find the selected car
              this.selectedCar = cars.find(car => car.selected === true) || cars[0] || null;
              console.log('🎯 Selected car:', this.selectedCar);
              
              if (!this.selectedCar && cars.length > 0) {
                console.log('⚠️ No car marked as selected, using first car');
                this.selectedCar = cars[0];
              }
              
              if (!this.selectedCar) {
                console.log('❌ No cars found for user');
              } else {
                // Cache the selected car for future use
                localStorage.setItem('selectedCar', JSON.stringify(this.selectedCar));
              }
              
              // selectedCar watcher will now fetch seat covers exactly once
            })
            .catch(error => {
              console.error('❌ Error fetching selected car:', error);
              console.error('❌ Error details:', error.response?.data);
              
              // If we have cached data, use it as fallback
              if (this.selectedCar) {
                console.log('🔄 Using cached car data as fallback');
              } else {
                console.log('🪑 No car data available, fetching seat covers without filter...');
                this.selectedCar = null;
                this.fetchSeatCovers();
              }
            })
            .finally(() => {
              this.isLoadingCar = false;
            });
        } else {
          console.log('👤 User is admin, skipping car selection');
          this.isLoadingCar = false;
          this.fetchSeatCovers();
        }
      },
      applySortAndFilter() {
        // First filter the seat covers
        this.filteredSeatCovers = this.seatCovers.filter(seatCover => {
          const finalPrice = seatCover.price - (seatCover.discount / 100 * seatCover.price);
          const priceFilter = finalPrice >= this.minPrice && finalPrice <= this.maxPrice;
          const discountFilter = this.minDiscount === '0' || (seatCover.discount >= parseInt(this.minDiscount));
          return priceFilter && discountFilter;
        });

        // Then sort the filtered results
        if (this.sortBy) {
          this.filteredSeatCovers.sort((a, b) => {
            const aFinalPrice = a.price - (a.discount / 100 * a.price);
            const bFinalPrice = b.price - (b.discount / 100 * b.price);
            
            switch (this.sortBy) {
              case 'price-low':
                return aFinalPrice - bFinalPrice;
              case 'price-high':
                return bFinalPrice - aFinalPrice;
              case 'discount':
                return b.discount - a.discount;
              case 'name':
                return a.name.localeCompare(b.name);
              default:
                return 0;
            }
          });
        }
        
        // Update pagination info
        this.totalPages = Math.ceil(this.totalSeatCovers / this.perPage);
        this.currentPage = 1; // Reset to first page when filtering
      },
      clearFilters() {
        this.sortBy = '';
        this.minPrice = 0;
        this.maxPrice = this.maxPossiblePrice;
        this.minDiscount = '0';
        this.applySortAndFilter();
      },
      initializePriceRange() {
        if (this.seatCovers.length > 0) {
          const prices = this.seatCovers.map(sc => sc.price - (sc.discount / 100 * sc.price));
          this.maxPossiblePrice = Math.max(...prices);
          this.maxPrice = this.maxPossiblePrice;
          this.minPrice = 0;
        }
      },
      openPolicyPage(url) {
        // Force full page navigation, bypassing Vue Router, using www domain for SSL compatibility
        window.open('https://www.carsona.in' + url, '_blank');
      },
      checkAuthenticationState() {
        console.log('🔍 Checking authentication state...');
        
        // Update global auth state
        AuthState.refreshAuthState();
        
        const token = localStorage.getItem('access_token');
        const sessionData = localStorage.getItem('sessionData');
        
        if (token || sessionData) {
          // Authenticated user - check admin status
          console.log('🔐 Authenticated user, checking admin status...');
          axios.get('/api/check_admin',{headers: { 'Authorization': 'Bearer ' + token }})
            .then(response => {
                this.is_ad = response.data.is_admin;
                console.log('👤 Admin status:', this.is_ad);
                console.log('🔍 Delete button should be visible:', this.is_ad ? 'YES' : 'NO');
                
                // Now that we know the admin status, fetch selected car if needed
                if (!this.is_ad) {
                  console.log('🚗 User is not admin, fetching selected car first...');
                  this.fetchSelectedCarThenSeatCovers();
                } else {
                  console.log('👤 User is admin, fetching seat covers directly');
                  this.fetchSeatCovers();
                }
            })
            .catch(error => {
                console.error("❌ Error checking admin status:", error);
                this.is_ad = false; // Default to non-admin
                
                console.log('🚗 Admin check failed, assuming non-admin and fetching car...');
                this.fetchSelectedCarThenSeatCovers();
            });
        } else {
          // Anonymous user - definitely not admin
          console.log('👤 Anonymous user detected, proceeding as non-admin...');
          this.is_ad = false;
          this.fetchSelectedCarThenSeatCovers();
        }
      }
    },
    mounted() {
      console.log('🚀 SeatCovers component mounted');
      
      // Check for Google OAuth token in URL parameters first
      const urlParams = new URLSearchParams(window.location.search);
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
        
        // Force refresh the auth state in this component
        this.$forceUpdate();
      }
      
      // Listen for auth state changes
      this.unsubscribeAuthState = AuthState.addListener((isLoggedIn, isAdmin) => {
        console.log('🔄 Auth state changed in SeatCovers:', { isLoggedIn, isAdmin });
        this.$forceUpdate(); // Force reactivity update
      });
      
      // Check authentication state
      this.checkAuthenticationState();
      
      console.log('📋 Fetching categories...');
      this.fetchcategories();
    },
    beforeDestroy() {
      // Clean up auth state listener
      if (this.unsubscribeAuthState) {
        this.unsubscribeAuthState();
      }
    },
    beforeRouteEnter(to, from, next) {
      // This is called before the route that renders this component is confirmed
      // We can use this to refresh authentication state when coming from login
      next(vm => {
        if (from.path === '/login') {
          console.log('🔄 Returning from login, refreshing authentication state...');
          setTimeout(() => {
            vm.checkAuthenticationState();
          }, 100);
        }
      });
    },
    watch: {
      seatCovers: {
        handler() {
          this.initializePriceRange();
          this.filteredSeatCovers = [...this.seatCovers];
          // Update pagination when seat covers change
          this.totalPages = Math.ceil(this.totalSeatCovers / this.perPage);
          this.currentPage = 1; // Reset to first page
        },
        immediate: true
      },
      selectedCar: {
        handler(newCar, oldCar) {
          // Re-fetch seat covers when selected car changes
          if (newCar && (!oldCar || newCar.id !== oldCar.id)) {
            console.log('🔄 Selected car changed, clearing cache and re-fetching seat covers...');
            if (oldCar && oldCar.id) {
                this.clearCarCache(oldCar.id);
            }
            this.currentPage = 1; // Reset pagination
            this.seatCovers = []; // Immediately clear the list
            this.fetchSeatCovers();
          }
        },
        deep: true
      }
    }
  });
  
  export default SeatCovers




//   <!-- <img :src="`/api/placeholder/400/300`" :alt="`Product ${item}`" class="w-full h-64 object-cover" /> -->