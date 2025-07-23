import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import AuthState from '../authState.js';
// import '../../styles.css'; // or .scss

const car_brands = Vue.component('car_brands', {
    template: `
<div class="container-carbrand">
    <nav class="navbar-carbrand">
        
              <router-link to="/car_brands" class="navbar-brand-carbrand">Carsona</router-link>
            <!-- <router-link to="/user_home" class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Select your Car Brand</router-link> 
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button> -->
            <div class="search-bar-carbrand">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input placeholder="Search for anything" v-model="searchQuery" @input="searchBrands">  
                <button @click.prevent="searchBrands">Search</button>
            </div>

            <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
                <div v-if="isLoggedIn && my_cars.length > 0">
                    <router-link to="/seat-covers"  class="white-text nav-link" aria-current="page" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Home</router-link>
                </div>
                <div v-if="isLoggedIn">
                    <router-link to="/my_orders" class="white-text nav-link" aria-current="page">My Orders</router-link>
                </div>
                <ul class="navbar-nav navbar-nav mr-auto">
                    <li class="nav-item dropdown" v-if="isLoggedIn">
                        <a class="white-text dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            {{ 'User' }}
                        </a> 
                        <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                            <li><router-link to="/login" class="nav-link" @click="logout">Logout</router-link></li>
                        </ul>
                    </li>
                    <li class="nav-item" v-else>
                        <a href="#" @click="handleNavbarLogin" class="white-text nav-link">Login</a>
                    </li>
                </ul>
            
        </div>
    </nav>
    
    <!-- <div>
        <h1>Select your Car Brand</h1>
    </div> -->

    <div class="hero-section-carbrand">
        <h1>Find the Perfect Seat Covers for Your Car</h1>
        <p>Browse by brand and upgrade your ride with style and comfort.</p>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoadingBrands" class="loading-container">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <h3 class="loading-text">Loading car brands...</h3>
            <p class="loading-subtext">Please wait while we fetch all available car brands for you</p>
        </div>
    </div>

    <!-- Brands Grid -->
    <div v-else-if="initialLoadComplete && filteredBrands.length > 0">
        <div class="cards-list-carbrand">
            <div
            v-for="brandData in filteredBrands"
            :key="brandData.brand.id"
            class="card-carbrand-wrapper"
            >
            <div class="card-carbrand" @click="openModal(brandData)">
                <img :src="brandData.brand.poster" alt="Brand Poster" />
            </div>
            <!-- <h2 class="brand-name">{{ brandData.brand.brand }}</h2> -->
            </div>
        </div>
    </div>
    
    <!-- No Brands Message -->
    <div v-else-if="!isLoadingBrands && initialLoadComplete && filteredBrands.length === 0">
        <h2>No Brands Available</h2>
    </div>

    <!-- Modal for displaying available cars -->
    <div v-if="showModal" class="modal" style="display: block;">
        <div class="modal-content car-brand-modal-content">
            <div class="modal-header-search">
                <span @click="closeModal" class="close">&times;</span>
                <h2>Available Cars for {{ selectedBrand.brand.brand }}</h2>
                <div class="modal-search-bar">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input 
                        type="text" 
                        placeholder="Search for your car..." 
                        v-model="carSearchQuery" 
                        @input="searchCars"
                    />
                </div>
            </div>
            <div v-if="warningMessage" class="modal" style="display: block;">     
                <div class="modal-content">
                    <nav class="navbar navbar-expand-lg navbar-light bg-light">
                        <div class="navbar-content">
                            <div class="alert" role="alert">
                                <h4><strong>{{ warningMessage }}</strong></h4>
                            </div>
                            <div class="navbar-right">
                                <router-link to="/seat-covers" class="btn-home">Home</router-link>
                            </div>
                        </div>
                    </nav>
                    <span @click.prevent="warningMessage = ''" class="close">&times;</span>
                </div>
            </div>
            <div class="cards-list-available-cars">
                <div v-for="car in filteredCars" :key="car.id" class="card-available-cars" @click.prevent="selectCar(selectedBrand.brand.brand, car.name)">
                    <img :src="car.poster" alt="Car Poster" class="car-poster"/>
                    <h2 class="card-title">{{ car.name }}</h2>
                </div>
            </div>
            <div v-if="filteredCars.length === 0 && carSearchQuery" class="no-cars-found">
                <p>No cars found matching "{{ carSearchQuery }}"</p>
            </div>
        </div>
    </div> 
</div>

    <!-- Modal for displaying available cars -->
    <!--
//     <div v-if="showColour" class="modal" style="display: block;">

//     <div class="modal-content">
//     <nav class="navbar navbar-expand-lg navbar-light bg-light">
//         <div v-if="alertMessage" class="alert" :class="alertClass" role="alert">
//             <h4><strong>{{ alertMessage }}</strong></h4>
//             <button type="button" class="btn-close" @click="alertMessage = null"></button>
//         </div>
//         <div v-if="alertMessage" class="alert" :class="alertClass" role="alert" class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
//         <ul class="navbar-nav navbar-nav mr-auto">
//           <li class="nav-item" >
//             <div>
//               <strong><h4><router-link class="nav-link" aria-current="page" to="/user_home">Home</router-link></h4></strong>
//             </div>
//           </li>
//         </ul>
//         </div>
//     </nav>
//         <span @click.prevent="closeColour()" class="close">&times;</span>
//         <h2>Available Colours for {{ selectedCar }}</h2>
//         <div class="cards-list">
//             <div  v-for="colour in availableColours" :key="car" class="card" @click.prevent="selectColourAndSetUp(colour)">
//                 <h3>{{ colour }}</h3>
//             </div>
//         </div>
//     </div>
// </div>
-->
</div>
    `,
    data() {
        return {
            car_brands: {}, // Initialize as an object
            // car_colours: {},
            my_cars:{},
            brands: [],  // Array to hold brand and car data
            searchQuery: '',
            my_cars: [],
            warningMessage: '',
            filteredBrands: [], // For filtered brands
            // filteredCarColours: [],
            searchQuery: '',
            carSearchQuery: '',
            filteredCars: [],
            showModal: false,
            showColour: false,
            selectedBrand: {},
            selectedCar: '',
            selectedCarPoster: '',
            // selectedColour: '',
            availableCars: [],
            // availableColours: [],
            alertMessage: null,
            alertClass: null,
            warningMessage: '',
            // Loading states
            isLoadingBrands: true,
            isLoadingCars: false,
            initialLoadComplete: false,
            // Authentication state
            anonymousUserId: null
        };
    },
    computed: {
        isLoggedIn() {
            return AuthState.isLoggedIn;
        }
    },
    methods: {
        setUp() {
            fetch('/setUp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedBrand: this.selectedBrand,
                    selectedCar: this.selectedCar,
                    poster: this.selectedCar.poster,
                    // selectedColour: this.selectedColour,
                })
            })
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    return response.json().then(data => {
                        throw new Error(data.msg || "Invalid Setup");
                    });
                }
            })
            .then(data => {
                // console.log(data.access_token,'hello');
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('is_admin', data.is_admin);
                // console.log(data.access_token,'hi');
                // if (data.is_admin) {
                this.$router.push('/seat-covers');
                // } else {
                //   this.$router.push('/seat-covers');
                // }
                
            })
            .catch(error => {
                this.alertMessage = 'Car Already Exist';
                console.error('Error:', error);
                // alert(error);
                // this.$router.push('/user_home');
            })
        },
        fetchMyCars(){
            axios.get('/my_cars')
                  .then(response => {
                      this.my_cars = response.data.my_cars;
                    //   console.log(this.my_cars);
                    //   console.log(this.my_cars);
                  });
          },
          fetchBrands() {
            console.log('🔄 Fetching car brands...');
            this.isLoadingBrands = true;
            
            axios.get('/api/car_brands')
                .then(response => {
                    console.log('✅ Brands loaded:', response.data.brands.length);
                    this.brands = response.data.brands;
                    this.filteredBrands = this.brands; // Initialize filteredBrands with all brands
                })
                .catch(error => {
                    console.error('❌ Error fetching brands:', error);
                    this.brands = [];
                    this.filteredBrands = [];
                })
                .finally(() => {
                    this.isLoadingBrands = false;
                    this.initialLoadComplete = true;
                });
        },
        // async fetchColours() {
        //     try {
        //         const response = await axios.get('/car_colours', {
        //             headers: { 
        //                 'Authorization': 'Bearer ' + localStorage.getItem('access_token') 
        //             }
        //         });
                
        //         // Convert the response from an object to an array of brand names
        //         this.car_colours = response.data.car_colours; // Assuming this is the structure
        //         this.filteredCarColours = Object.keys(this.car_colours); // Extract keys (brand names) into an array
        //         console.log(this.filteredCarColours); // Debugging line
        //     } catch (error) {
        //         console.error(error);
        //     }
        // },
        openModal(brandData) {
            this.selectedBrand = brandData;
            this.filteredCars = brandData.cars || [];
            this.carSearchQuery = '';
            this.showModal = true;
        },
        searchCars() {
            const query = this.carSearchQuery.toLowerCase().trim();
            if (query) {
                this.filteredCars = this.selectedBrand.cars.filter(car => 
                    car.name.toLowerCase().includes(query)
                );
            } else {
                this.filteredCars = this.selectedBrand.cars || [];
            }
        },
        // colour_options(car) {
        //     // console.log(car);
        //     this.selectedCar = car;
        //     // console.log(this.car_colours)
        //     this.availableColours = this.car_colours[car];
        //     console.log(this.selectedCar);
        //     this.showColour = true;
        // },
        // selected_colour(colour){
        //     this.selectedColour = colour;
        //     console.log(this.selectedColour)
        // },
        closeModal() {
            this.showModal = false;
            this.carSearchQuery = '';
            this.filteredCars = [];
        },
        // closeColour(){
        //     this.showColour = false;
        // },
        searchBrands() {
            const query = this.searchQuery.toLowerCase();
            if (query) {
                this.filteredBrands = this.brands.filter(brandData => 
                    brandData.brand.brand.toLowerCase().includes(query)
                );
            } else {
                this.filteredBrands = this.brands; // Reset to all brands if query is empty
            }
        },
        // selectColourAndSetUp(colour) {
        //     this.selected_colour(colour); // Set the selected color
        //     this.setUp(); // Then call setUp
        // },
        // colour_optionsAndcloseModel(car) {
        //      // console.log(car);
        //      this.selectedCar = car;
        //      // console.log(this.car_colours)
        //      this.availableColours = this.car_colours[car];
        //      console.log(this.selectedCar);
        //      this.showColour = true;
        //      this.showModal = false;

        // }
        async selectCar(brand, car) {
            if (!this.isLoggedIn) {
                // For anonymous users, store selection locally and continue to seat covers
                this.storeAnonymousCarSelection(brand, car);
                this.$router.push('/seat-covers');
                return;
            }
            
            try {
                const response = await axios.post('/setUp', {
                    selectedBrand: brand,
                    selectedCar: car
                }, {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
                });

                if (response.data.message === 'Setup successful') {
                    // After setup, fetch the latest list of cars to find the new selected one
                    const carsResponse = await axios.get('/my_cars', { params: { t: new Date().getTime() } });
                    const myCars = carsResponse.data.my_cars || [];
                    const newSelectedCar = myCars.find(c => c.selected);

                    if (newSelectedCar) {
                        // IMPORTANT: Update localStorage before redirecting
                        localStorage.setItem('selectedCar', JSON.stringify(newSelectedCar));
                        // Clear any potentially stale seat cover cache
                        localStorage.removeItem('seatCoverResultsCache'); 
                        console.log('Updated selected car in localStorage:', newSelectedCar);
                    }
                    
                    this.warningMessage = '';
                    this.$router.push('/seat-covers');

                } else if (response.data.msg === 'Car Already Exists') {
                    this.warningMessage = response.data.msg;
                }
            } catch (error) {
                if (error.response && error.response.data) {
                    this.warningMessage = error.response.data.msg || 'An error occurred.';
                } else {
                    console.error("Error saving selection:", error);
                    this.warningMessage = 'An unexpected error occurred.';
                }
            }
        },
        storeAnonymousCarSelection(brand, car) {
            // Find the selected car data from the current brands
            const selectedBrandData = this.brands.find(b => b.brand.brand === brand);
            const selectedCarData = selectedBrandData ? selectedBrandData.cars.find(c => c.name === car) : null;
            
            if (selectedCarData) {
                // Create a mock selected car object for anonymous browsing
                const anonymousSelectedCar = {
                    id: `anonymous_${Date.now()}`, // Temporary ID for anonymous users
                    brand: brand,
                    name: car,
                    poster: selectedCarData.poster,
                    available_car_id: selectedCarData.id, // Use the real car ID for filtering
                    selected: true,
                    anonymous: true // Flag to indicate this is an anonymous selection
                };
                
                // Store for browsing seat covers
                localStorage.setItem('selectedCar', JSON.stringify(anonymousSelectedCar));
                
                // Also store for login restoration
                const anonymousData = {
                    selectedBrand: brand,
                    selectedCar: car,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('anonymousCarSelection', JSON.stringify(anonymousData));
                
                console.log('🔄 Stored anonymous car selection for browsing:', anonymousSelectedCar);
            }
        },
        checkAuthenticationState() {
            // Update global auth state
            AuthState.refreshAuthState();
            
            // Check if user is logged in
            const token = localStorage.getItem('access_token');
            const sessionData = localStorage.getItem('sessionData');
            
            if (token || sessionData) {
                this.fetchMyCars();
            } else {
                this.generateAnonymousUserId();
            }
        },
        generateAnonymousUserId() {
            // Generate or retrieve anonymous user ID
            let anonymousId = localStorage.getItem('anonymousUserId');
            if (!anonymousId) {
                anonymousId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
                localStorage.setItem('anonymousUserId', anonymousId);
            }
            this.anonymousUserId = anonymousId;
            console.log('🔄 Anonymous user ID:', anonymousId);
        },
        logout() {
            // Clear authentication data using global auth state
            AuthState.logout();
            
            // Clear additional data
            localStorage.removeItem('selectedCar');
            localStorage.removeItem('seatCoverResultsCache');
            
            // Reset component state
            this.my_cars = [];
            
            // Generate new anonymous ID
            this.generateAnonymousUserId();
            
            console.log('🔄 User logged out, now anonymous');
        },
        handleNavbarLogin() {
            console.log('🔒 User clicked login in navbar from car brands');
            
            // Store context that user came from car brands page
            const redirectContext = {
                origin: 'navbar_login',
                destination: '/car_brands'
            };
            
            localStorage.setItem('loginRedirectContext', JSON.stringify(redirectContext));
            console.log('📍 Stored navbar login redirect context:', redirectContext);
            
            this.$router.push('/login');
        },
    },
    mounted() {
        console.log('🚀 Car brands component mounted');
        
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
            console.log('🔄 Auth state changed in CarBrands:', { isLoggedIn, isAdmin });
            this.$forceUpdate(); // Force reactivity update
        });
        
        // Check authentication state first
        this.checkAuthenticationState();
        
        // Always fetch brands (works for both anonymous and authenticated users)
        this.fetchBrands();
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
});

export default car_brands;