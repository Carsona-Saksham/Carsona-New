import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const MyTheaters = Vue.component('MyTheaters', {
    data() {
        return {
            my_brands: [],
            selectedBrand: null,
            selectedBrandName: '',
            cars: [],
            newCar: {
                name: '',
                // colour: '',
                // engine_type: '',
                // transmission_type: '',
                poster: null
            },
            messages: [],
            is_ad: false,
            isModalVisible: false,
            isAddCarModalVisible: false,
            user: {
                isAuthenticated: false,
                isAdmin: localStorage.getItem('is_admin') === 'true' ? true : false,
                name: localStorage.getItem('name'),
            },
            brands: [],  // Array to hold brands
            showModal: false,  // To control modal visibility
            brandName: '',
            brandPoster: '',
            websiteName: 'Carsona',
        };
    },
    created() {
        this.fetchBrands();
        const savedCars = localStorage.getItem('cars');
        if (savedCars) {
            this.cars = JSON.parse(savedCars);
        }
    },
    methods: {
      onFileChange(e) {
        let files = e.target.files || e.dataTransfer.files;
        if (!files.length)
          return;
        this.createImage(files[0]);
      },
      createImage(file) {
        let reader = new FileReader();
        let vm = this;
        reader.onload = (e) => {
          vm.brandPoster = e.target.result;
        };
        reader.readAsDataURL(file);
      },
        fetchBrands() {
            axios.get('/api/my_car_brands', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') } })
                .then(response => {
                    this.brands = response.data.brands;
                })
                .catch(error => {
                    console.error('Error fetching brands:', error);
                });
        },
        fetchCars(brandId) {
            axios.get(`/api/available_cars/${brandId}`)
                .then(response => {
                    this.cars = response.data.cars;
                    this.selectedBrand = brandId;

                    const selectedBrandObj = this.brands.find(brand => brand.id === brandId);
                    this.selectedBrandName = selectedBrandObj ? selectedBrandObj.brand : '';

                    this.isModalVisible = true;
                })
                .catch(error => {
                    console.error("Error fetching cars:", error);
                });
        },
        openAddCarModal() {
            this.isAddCarModalVisible = true;
        },
        closeAddCarModal() {
            this.isAddCarModalVisible = false;
            this.newCar = { name: '',  poster: null };   // colour: '', engine_type: '', transmission_type: '',
        },
        handleFileUpload(event) {
            this.newCar.poster = event.target.files[0];
        },
        addCar() {
            const formData = new FormData();
            formData.append('name', this.newCar.name);
            // formData.append('colour', this.newCar.colour);
            // formData.append('engine_type', this.newCar.engine_type);
            // formData.append('transmission_type', this.newCar.transmission_type);
            formData.append('poster', this.newCar.poster);
            formData.append('brand_id', this.selectedBrand);
            formData.append('brand_name', this.selectedBrandName);

            axios.post('/api/add_car', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            .then(response => {
                this.cars.push(response.data.car);
                localStorage.setItem('cars', JSON.stringify(this.cars));
                this.closeAddCarModal();
            })
            .catch(error => {
                console.error("Error adding car:", error);
            });
        },
        deleteCar(carId) {
            axios.delete(`/api/delete_car/${carId}`)
                .then(response => {
                    this.fetchBrands();  // Refresh the brand list
                    console.log(response.data.message);
                })
                .catch(error => {
                    console.error("Error deleting car:", error);
                });
        },
        editCar(car) {
            axios.put(`/api/edit_car/${car.id}`, car)
                .then(response => {
                    console.log("Car updated successfully");
                })
                .catch(error => {
                    console.error("Error updating car:", error);
                });
        },
        closeModal() {
            this.isModalVisible = false;
            this.selectedBrand = null;
            this.selectedBrandName = '';
            this.showModal = false;  // Hide the modal
        },
        getUniqueCars() {
            const uniqueCars = {};
            this.cars.forEach(car => {
                if (!uniqueCars[car.name]) {
                    uniqueCars[car.name] = car;
                }
            });
            return Object.values(uniqueCars);
        },
        deleteBrand(brandId) {
            axios.delete(`/api/delete_brand/${brandId}`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
                }
            })
            .then(response => {
                this.fetchBrands();  // Refresh the brand list
                console.log(response.data.message);
            })
            .catch(error => {
                console.error('Error deleting brand:', error);
            });
        },
        openUpdateModal(brand) {
            this.selectedBrand = brand;
            this.brandName = brand.brand;  // Assuming brand has a 'brand' property
            this.brandPoster = brand.poster;  // Assuming brand has a 'poster' property
            this.showModal = true;  // Show the modal for updating
            console.log('Selected Brand for Update:', this.selectedBrand);
        },
        updateBrand() {
            console.log('Updating Brand:', this.selectedBrand); // Debugging line
            if (!this.selectedBrand || !this.selectedBrand.brand) {
                console.error('Selected brand is not defined or does not have a brand property');
                return; // Exit if selectedBrand is not valid
            }

            const updatedBrand = {
                brand: this.brandName,
                poster: this.brandPoster,
            };

            axios.put(`/api/update_brand/${this.selectedBrand.id}`, updatedBrand, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
                }
            })
            .then(response => {
                this.fetchBrands();  // Refresh the brand list
                this.showModal = false;  // Hide the modal
                console.log(response.data.message);
            })
            .catch(error => {
                console.error('Error updating brand:', error);
            });
        },
    },
    
    template: `
    <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
              <router-link class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif" to="/home">Carsona</router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
        <ul class="navbar-nav navbar-nav mr-auto">
          <li class="nav-item">
            <router-link class="nav-link" aria-current="page" to="/home">Back</router-link>
          </li>
          <li class="nav-item dropdown" > 
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              <span v-if="is_ad">Admin</span>
              <span v-else>User</span>
            </a>
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
              <li><router-link class="nav-link" to="/">Logout</router-link></li>
            </ul>


          </li>
        </ul>
      </div>
    </div>
  </nav>
  <div class="container">
    <div class="row">
      <div class="col">
        <div class="container-fluid pt-4 ps-5">
          <div class="row">
            <div class="col-10">
              <h5 class="fw-bold">My brands</h5>
            </div>
            <div class="col-2">
              <router-link class="btn btn-outline-dark btn-sm" to="/add_brands">Add Brands</router-link>
            </div>
          </div>
        </div>


      <div class="cards-list">
      <div v-if="brands.length > 0" v-for="brand in brands" :key="brand.id" class="card" >
       <!-- <router-link :to="'/'+brand.name" class="nav-link">  -->
        <div class="card_image" @click="fetchCars(brand.id)">
          <img :src="brand.poster">
        </div>
         <!-- <router-link :to="'/'+category.title" class="nav-link"><div class="card_title" style="padding-bottom:10px"> -->
            <p>{{ brand.brand }}</p>
            <div class="card_title">
                <button class="btn btn-danger" @click="openUpdateModal(brand)">Update</button>
                <button class="btn btn-danger" @click="deleteBrand(brand.id)">Delete</button>
            </div>
          </div>   <!-- </router-link> -->
     <!--  </router-link>   -->
      <h2 v-else>No Brands Yet</h2>
    </div>

    <div v-if="showModal" class="modal" style="display: block;">
            <div class="modal-content">
                <span @click="closeModal" class="close">&times;</span>
                <h2>Update Brand</h2>
                <form @submit.prevent="updateBrand">
                <div class="mb-3">
                  <label class="form-label">Brand Name</label>
                  <input type="text" class="form-control" v-model="brandName" />
                </div>
                <div class="mb-3">
                  <label class="form-label">Poster</label>
                  <input type="file" class="form-control" accept="image/*" @change="onFileChange"/>
                </div>
               <button @click="updateBrand" class="btn btn-primary">Update Brand</button>
               </form>
            </div>
        </div>

    <div v-if="isModalVisible" class="modal">
                <div class="modal-content">
                    <span class="close" @click="closeModal">&times;</span>
                    <h4>Available Cars for Brand: {{ selectedBrandName }}</h4>
                    <div class="card-list">
                        <div v-for="car in getUniqueCars()" :key="car.id" class="card small-car-card">
                            <img :src="car.poster" alt="Car Poster" class="car-poster" />
                            <!-- <h5>{{ car.name }}</h5> -->
                            <input v-model="car.name" @blur="editCar(car)" />
                            <button v-if="user.isAdmin" @click="deleteCar(car.id)">Delete</button>
                        </div>
                    </div>
                    <button v-if="user.isAdmin" @click="openAddCarModal">Add Car</button>
                </div>
            </div>
        </div>
        </div>

            <!-- Add Car Modal -->
            <div v-if="isAddCarModalVisible" class="modal">
                <div class="modal-content">
                    <span class="close" @click="closeAddCarModal">&times;</span>
                    <h4>Add New Car for Brand: {{ selectedBrandName }}</h4>
                    <div class="form-group">
                        <label for="carName">Car Name</label>
                        <input v-model="newCar.name" class="form-control" id="carName" placeholder="Car Name" />
                    </div>
                    <!-- <div class="form-group">
                        <label for="carColour">Car Colour</label>
                        <input v-model="newCar.colour" class="form-control" id="carColour" placeholder="Car Colour" />
                    </div>
                    <div class="form-group">
                        <label for="engineType">Engine Type</label>
                        <input v-model="newCar.engine_type" class="form-control" id="engineType" placeholder="Engine Type" />
                    </div>
                    <div class="form-group">
                        <label for="transmissionType">Transmission Type</label>
                        <input v-model="newCar.transmission_type" class="form-control" id="transmissionType" placeholder="Transmission Type" />
                    </div> -->
                    <div class="form-group">
                        <label for="poster">Select Poster</label>
                        <input type="file" @change="handleFileUpload" class="form-control" id="poster" />
                    </div>
                    <button class="btn btn-primary" @click="addCar">Add Car</button>
                </div>
            </div>
                </div>



       <!-- <div class="container-fluid align-self-center" style="width: 100%;">
          <ol class="list-group-fluid list-group-numbered align-middle pt-4" style="width:500px;align-content:center">
            <li class="list-group-item d-flex justify-content-between align-items-start" v-for="brand in my_brands" :key="brand.id">
              <div class="ms-2 me-auto">
                <div class="fw-bold">{{ brand.brand }}</div>
                {{ theater.address }}, <router-link class="card-link" :to="'/update_theatre/' + theater.id">Update</router-link>, <button class="btn btn-danger" @click="deleteTheater(theater.id)">Delete</button>, <button class="card-link" @click="venue(theater.id)" >Export CSV</button> 
              </div>
            </li>
          </ol>
        </div> -->
      </div>
      <!-- <div class="col">
        <div class="container-fluid pt-4 ps-5">
          <div class="row">
            <div class="col-10">
              <h5 class="fw-bold">My Shows</h5>
            </div>
            <div class="col-2">
              <router-link class="btn btn-outline-dark btn-sm" to="/add_shows">Add Shows</router-link>
            </div>
          </div>
        </div>
        <div class="container-fluid align-self-center" style="width: 100%; margin-bottom: 120px">
          <ol class="list-group-fluid list-group-numbered align-middle pt-4" style="width:500px;align-content:center">
            <li class="list-group-item d-flex justify-content-between align-items-start" v-for="(show, index) in my_show" :key="show.id">
              <div class="ms-2 me-auto">
                <div class="fw-bold">{{ show.movie }}</div>
                {{ show.theater_name }}, {{ show.cost }} , {{ show.time }}, <router-link class="card-link" :to="'/update_show/' + show.id">Update</router-link>, <button class="btn btn-danger" @click="confirmDelete(show.id)">Delete</button>

              </div>
              <span class="badge bg-primary rounded-pill">{{show.available_seats}}</span>
            </li>
          </ol>
        </div>
      </div> -->
    </div>
  </div>
  </div>
    `,
});

export default MyTheaters;