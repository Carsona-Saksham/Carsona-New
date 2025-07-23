import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const CarTires = Vue.component('CarTires', {
    template: `
    <div>
        <nav class="navbar-userhome">
                              <router-link class="navbar-brand-userhome" :to="{ path: '/seat-covers' }" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
          <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
            <div class="nav-item">
              <router-link class="nav-link white-text" aria-current="page" to="/home" v-if="is_ad">Home</router-link>
                                      <router-link class="nav-link white-text" aria-current="page" to="/seat-covers" v-else>Home</router-link>
            </div>
            <div class="nav-item">
              <router-link class="nav-link white-text" to="/add_tires" v-if="is_ad">Add Tires</router-link>
              <router-link class="nav-link white-text" to="/my_cars" v-else>My Cars</router-link>
            </div>
            <ul class="navbar-nav navbar-nav mr-auto">
              <li class="nav-item dropdown">  
                <a class="dropdown-toggle white-text" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <span v-if="is_ad">Admin</span>
                  <span v-else>User</span>
                </a>
                <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li><router-link class="nav-link" to="/">Logout</router-link></li>
                </ul>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Coming Soon Message -->
        <div class="coming-soon-container">
            <h1 class="coming-soon-text">COMING SOON</h1>
        </div>
    </div>
    `,
    data() {
        return {
            tires: [],
            newTire: { name: '', price: 0, discount: 0, poster: '' },
            is_ad: false,
            user: {
                isAuthenticated: false,
                isAdmin: false, // Initialize as false, will be set from API response
                name: localStorage.getItem('name'),
            },
        };
    },
    methods: {
        fetchTires() {
            axios.get('/api/tires', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
            })
            .then(response => {
                this.tires = response.data.tires;
                console.log('Fetched Tires:', this.tires);
            })
            .catch(error => {
                console.error('Error fetching tires:', error);
            });
        }
    },
    mounted() {
        axios.get('/api/check_admin', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
        })
        .then(response => {
            this.is_ad = response.data.is_admin;
            this.user.isAdmin = response.data.is_admin; // Set both properties consistently
            console.log('Admin status:', this.is_ad);
        })
        .catch(error => {
            console.error("Error fetching admin status:", error);
            // If API call fails, ensure admin status is false
            this.is_ad = false;
            this.user.isAdmin = false;
        });
    }
});

export default CarTires; 