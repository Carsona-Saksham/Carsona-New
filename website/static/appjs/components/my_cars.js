import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';


// My Cars Component - Updated: Delete buttons on individual cars, not navbar
const MyCars = Vue.component('MyCars', {
    data() {
        return {
            user_id:'',
            user: {},
            my_cars: [],
            tickets: [],
            messages: [],
            car_name: '',
            car_brand: '',
            // car_colour: '',
        };
    },
    computed: {
        allCarsUnavailable() {
            if (!Array.isArray(this.my_cars) || this.my_cars.length === 0) {
                return false;
            }
            return this.my_cars.every(car => !car.is_available);
        },
        hasAvailableCars() {
            if (!Array.isArray(this.my_cars) || this.my_cars.length === 0) {
                return false;
            }
            return this.my_cars.some(car => car.is_available);
        }
    },
    created() {
        this.fetchUser();
        this.fetchMyCars();
    },
    methods: {
        fetchUser(){
            axios.get('/user_id')
                .then(response => {
                    this.user_id = response.data.user;
                    // console.log(this.user_id);
                });
                  },
                fetchMyCars(){
                    return axios.get('/my_cars', { params: { t: new Date().getTime() } }) // <-- ADD 'return' HERE
                          .then(response => {
                              // Ensure my_cars is always an array
                              const carsData = response.data.my_cars;
                              if (Array.isArray(carsData)) {
                                  this.my_cars = carsData;
                              } else {
                                  console.warn('Expected my_cars to be an array, got:', typeof carsData, carsData);
                                  this.my_cars = [];
                              }
                              console.log('My cars loaded:', this.my_cars);
                          })
                          .catch(error => {
                              console.error('Error fetching my cars:', error);
                              this.my_cars = []; // Ensure it's always an array even on error
                              throw error; // <-- ADD THIS LINE
                          });
                  },
        async deleteCar(id) {
            if (!confirm('Do you want to delete this Car?')) {
                return;
            }

            try {
                const response = await axios.delete('/api/removeCar/' + id, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') } });
                console.log(response.data.message);

                if (response.data.message.includes('No cars left')) {
                    localStorage.removeItem('selectedCar'); // Clear selected car
                    this.$router.push('/car_brands');
                } else if (response.data.message.includes('New car selected automatically')) {
                    // When a car is auto-selected, we need to find which one it is
                    // The backend response doesn't tell us, so we must refetch the whole list
                    await this.fetchMyCars();
                    const newSelectedCar = this.my_cars.find(car => car.selected);
                    
                    if (newSelectedCar) {
                        // Update localStorage to ensure other components know about the new selection
                        localStorage.setItem('selectedCar', JSON.stringify(newSelectedCar));
                        localStorage.removeItem('seatCoverResultsCache');
                    }
                } else {
                    // This case handles when a non-selected car is deleted.
                    this.my_cars = this.my_cars.filter(car => car.id !== id);
                }
            } catch (error) {
                console.error("Error deleting Car:", error);
                if (error.response?.data?.message) {
                    alert(error.response.data.message);
                } else {
                    alert('Failed to delete car. Please try again.');
                }
            }
        },
        selectCar(car) {
            // Check if car is available before selecting
            if (!car.is_available) {
                alert('This car is currently not available. Please select another car or add a new one.');
                return;
            }
            
            // Use the SelectedCar.id for the select_existing_car API
            const selectedCarId = car.id;
            axios.post('/api/select_existing_car', { selected_car_id: selectedCarId })
                .then(response => {
                    console.log(response.data.message);
                    // Cache the newly selected car for other pages (e.g., seat_covers)
                    try {
                        localStorage.setItem('selectedCar', JSON.stringify(car));
                        // Optional: clear any cached seat cover results so they reload for the new car
                        localStorage.removeItem('seatCoverResultsCache');
                    } catch (e) {
                        console.warn('Could not update selectedCar in localStorage:', e);
                    }
                    this.fetchMyCars(); // Refresh the car list to reflect changes
                })
                .catch(error => {
                    console.error("Error selecting car:", error);
                    if (error.response?.data?.error) {
                        alert(error.response.data.error);
                    } else {
                        alert('Failed to select car. Please try again.');
                    }
                });
        }
    },
    mounted() {
      this.fetchMyCars();
  },
    template: `
        <div class="container-mycars">
        <nav class="navbar-userhome">
        <!-- <div class="container-fluid"> -->
                              <router-link class="navbar-brand-userhome" style="font-weight: 1000; font-family: 'Poppins', sans-serif" to="/seat-covers">Carsona</router-link>
          <!--<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button> -->
          <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
              <div class="nav-item">
                                        <router-link class="nav-link white-text" aria-current="page" to="/seat-covers">Back</router-link>
              </div>
            <ul class="navbar-nav navbar-nav mr-auto">
              
              <li class="nav-item dropdown">
                <a class="dropdown-toggle white-text" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  {{ 'User' }}
                </a>
                <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li><router-link class="nav-link" to="/login">Logout</router-link></li>
                </ul>
              </li>
            </ul>
          </div>
       <!-- </div>-->
      </nav>
      <!-- <div class="container-fluid align-self-center"> -->
      <br/>
        <div class="row">
          <div class="col-10">
            <h3><strong>My Cars</strong></h3>
          </div>
          <div class="col-2">
            <router-link class="btn btn-outline-dark btn-sm add-car-button" :to="{ path: '/car_brands' }">Add My Car</router-link>
          </div>
        </div>
      <hr/>

      <!-- Message when all cars are unavailable -->
      <div v-if="allCarsUnavailable" class="alert alert-warning text-center mb-4" role="alert">
        <div class="d-flex flex-column align-items-center">
          <i class="fa fa-exclamation-triangle fa-2x mb-2 text-warning"></i>
          <h5 class="mb-2">All Your Cars Are Currently Unavailable</h5>
          <p class="mb-3">Unfortunately, all the car models in your collection are temporarily unavailable. This may be due to inventory updates or maintenance.</p>
          <div class="d-flex gap-2">
            <router-link to="/car_brands" class="btn btn-primary">
              <i class="fa fa-plus-circle me-2"></i>Add New Car
            </router-link>
            <button class="btn btn-outline-secondary" @click="fetchMyCars">
              <i class="fa fa-refresh me-2"></i>Refresh
            </button>
          </div>
        </div>
      </div>

      <!--<div class="cards-list-mycars">-->
       <div class="cards-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"> <!-- Responsive grid layout -->
      <!--<div v-if="my_cars.length > 0" v-for="my_car in my_cars" :key="my_car.id" class="card-mycars small-car-card-mycars">-->
      <div v-if="my_cars.length > 0" v-for="my_car in my_cars" :key="my_car.id" class="my-cars-card-updated bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
        <div>
         <button class="close-button" @click="deleteCar(my_car.id)">✖</button>
         <!--<img :src="my_car.poster" class="car-poster-mycars">-->
         <img :src="my_car.poster"  class="my-cars-image-updated w-full h-48 object-cover">
        </div>
        <div class="card-content p-4">
          <h2 class="my-cars-title-updated text-xl font-semibold text-gray-800 mb-2">{{ my_car.brand + ' ' + my_car.name }}</h2>
          
          <!-- Show availability status -->
          <div class="car-status mb-2">
            <span v-if="my_car.is_available" class="status-available">
              <i class="fa fa-check-circle text-green-500"></i> Available
            </span>
            <span v-else class="status-unavailable">
              <i class="fa fa-times-circle text-red-500"></i> Not Available
            </span>
          </div>
          
          <!-- Selection controls -->
          <div v-if="my_car.is_available">
            <button v-if="!my_car.selected" @click="selectCar(my_car)" class="select-car-button">Select this Car</button>
            <span v-else class="selected-car-text"><i class="fa fa-check-circle"></i> Selected</span>
          </div>
          <div v-else class="unavailable-message">
            <p class="text-sm text-gray-600">This car model is currently unavailable. Please contact support or select another car.</p>
            <router-link to="/car_brands" class="btn btn-sm btn-outline-primary mt-2">Add Another Car</router-link>
          </div>

          <!-- Delete button visible inside card content -->
          <div class="mt-3 d-flex justify-content-end">
            <button class="btn btn-outline-danger btn-sm delete-car-button" @click="deleteCar(my_car.id)">
              <i class="fa fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <!-- <div class="card-mycars card_title">
            {{ my_car.brand + ' ' + my_car.name }}
        </div>
        <div style="padding-bottom: 5px;">
            <button v-if="!my_car.selected" @click="selectCar(my_car)" class="select-car-button">Select this Car</button>
            <span v-else class="selected-car-text"><i class="fa fa-check-circle"></i> Selected</span>
        </div> -->
      </div>
      <h2 v-else>No Cars Yet</h2>
    </div>


    </div>
    `
});

export default MyCars