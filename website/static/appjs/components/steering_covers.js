import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const SteeringCovers = Vue.component('SteeringCovers', {
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
              <router-link class="nav-link white-text" to="/add_steering_covers" v-if="is_ad">Add Steering Covers</router-link>
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
            steeringCovers: [],
            newSteeringCover: { name: '', price: 0, discount: 0, poster: '' },
            is_ad: false,
            user: {
                isAuthenticated: false,
                isAdmin: false, // Initialize as false, will be set from API response
                name: localStorage.getItem('name'),
            },
        };
    },
    methods: {
        fetchSteeringCovers() {
            axios.get('/api/steering_covers', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
            })
            .then(response => {
                this.steeringCovers = response.data.steering_covers;
                console.log('Fetched Steering Covers:', this.steeringCovers);
            })
            .catch(error => {
                console.error('Error fetching steering covers:', error);
            });
        },
        addSteeringCover() {
            axios.post('/api/add_steering_covers', this.newSteeringCover, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
            })
            .then(response => {
                console.log('Steering Cover added:', response.data);
                this.steeringCovers.push(response.data.steering_cover);
                this.newSteeringCover = { name: '', price: 0, discount: 0, poster: '' };
            })
            .catch(error => {
                console.error('Error adding steering cover:', error);
            });
        },
        deleteSteeringCover(id) {
            axios.delete(`/api/removeSteeringCover/${id}`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
            })
            .then(response => {
                console.log('Steering Cover deleted:', response.data);
                this.steeringCovers = this.steeringCovers.filter(cover => cover.id !== id);
            })
            .catch(error => {
                console.error('Error deleting steering cover:', error);
            });
        },
        goToDetails(id) {
            this.$router.push({ name: 'SteeringCoverDetails', params: { id } });
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
        this.fetchSteeringCovers();
    }
});

export default SteeringCovers; 