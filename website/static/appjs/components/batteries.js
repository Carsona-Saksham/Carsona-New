import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const Batteries = Vue.component('Batteries', {
    template: `
    <div>
        <nav class="navbar-userhome">
                              <router-link class="navbar-brand-userhome" :to="{ path: '/seat-covers' }" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
          <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
            <div class="nav-item">
                      <router-link class="nav-link  white-text" aria-current="page" to="/home"  v-if="user.isAdmin">Home</router-link>
                                    <router-link class="nav-link  white-text" aria-current="page" to="/seat-covers" v-else>Home</router-link>
            </div>
            <div class="nav-item" >
                <router-link class="nav-link active  white-text" to="/add_batteries" v-if="is_ad">Add Batteries</router-link>
                <router-link class="nav-link  white-text" to="/my_cars" v-else>My Cars</router-link>
            </div>
            <ul class="navbar-nav navbar-nav mr-auto">
              <li class="nav-item dropdown" >  
                <a class="dropdown-toggle  white-text" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
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
            batteries: [],
            newBattery: { name: '', price: 0, discount: 0, poster: '' },
            is_ad: false,
            user: {
                isAuthenticated: false,
                isAdmin: false, // Initialize as false, will be set from API response
                name: localStorage.getItem('name'),
            },
        };
    },
    methods: {
        fetchBatteries() {
            axios.get('/api/batteries', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
            })
            .then(response => {
                this.batteries = response.data.batteries;
                console.log('Fetched Batteries:', this.batteries);
            })
            .catch(error => {
                console.error('Error fetching batteries:', error);
            });
        },
        addBattery() {
            axios.post('/api/add_batteries', this.newBattery, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
            })
            .then(response => {
                console.log('Battery added:', response.data);
                this.batteries.push(response.data.battery); // Add the new battery to the list
                this.newBattery = { name: '', price: 0, discount: 0, poster: '' }; // Reset form
            })
            .catch(error => {
                console.error('Error adding battery:', error);
            });
        },
        deleteBattery(id) {
            axios.delete(`/api/removeBattery/${id}`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
            })
            .then(response => {
                console.log('Battery deleted:', response.data);
                this.batteries = this.batteries.filter(battery => battery.id !== id);
            })
            .catch(error => {
                console.error('Error deleting battery:', error);
            });
        },
        goToDetails(id) {
            this.$router.push({ name: 'BatteryDetails', params: { id } });
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
        this.fetchBatteries();
    }
});

export default Batteries; 