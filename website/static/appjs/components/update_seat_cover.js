import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const UpdateSeatCover = Vue.component('UpdateSeatCover', {
    template: `
    <div>
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
          <a class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif" href="/">Carsona</a>
          <ul class="navbar-nav navbar-nav mr-auto">
            <li class="nav-item">
              <router-link class="nav-link active" to="/seat-covers">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link active" to="/seat-covers">Seat Covers</router-link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div class="container mt-4">
        <h2>Update Seat Cover</h2>
        <form @submit.prevent="submitForm">
          <div class="mb-3">
            <label for="name" class="form-label">Name</label>
            <input v-model="SeatCover.name" type="text" class="form-control" id="name" required>
          </div>
          
          <div class="mb-3">
            <label for="price" class="form-label">Price</label>
            <input v-model="SeatCover.price" type="number" class="form-control" id="price" required>
          </div>
          
          <div class="mb-3">
            <label for="discount" class="form-label">Discount (%)</label>
            <input v-model="SeatCover.discount" type="number" class="form-control" id="discount">
          </div>
          
          <div class="mb-3">
            <label class="form-label">Select Cars (Multiple Selection)</label>
            <div class="car-selection-container" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
              <div v-for="car in cars" :key="car.id" class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :value="car.id" 
                  :id="'car-' + car.id"
                  v-model="SeatCover.car_ids"
                >
                <label class="form-check-label" :for="'car-' + car.id">
                  {{ car.brand_name }} - {{ car.name }}
                </label>
              </div>
            </div>
            <small class="form-text text-muted">Select one or more cars for this seat cover</small>
          </div>
          
          <div class="mb-3">
            <label for="poster" class="form-label">Poster</label>
            <input type="file" class="form-control" @change="onFileChange" accept="image/*">
            <img v-if="SeatCover.poster" :src="SeatCover.poster" alt="Preview" style="max-width: 200px; margin-top: 10px;">
          </div>
          
          <div class="mb-3">
            <label class="form-label">Variants</label>
            <div class="variants-editor" style="border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
              <div v-for="(variant, index) in SeatCover.variants" :key="variant.id || index" class="variant-editor" style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; border: 1px solid #e0e0e0;">
                <div class="row">
                  <div class="col-md-3">
                    <label class="form-label">Name</label>
                    <input v-model="variant.name" type="text" class="form-control form-control-sm" required>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Price (₹)</label>
                    <input v-model="variant.price" type="number" class="form-control form-control-sm" required>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Discount (%)</label>
                    <input v-model="variant.discount" type="number" class="form-control form-control-sm" min="0" max="100">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Description</label>
                    <input v-model="variant.description" type="text" class="form-control form-control-sm">
                  </div>
                  <div class="col-md-1">
                    <label class="form-label">Default</label>
                    <div class="form-check">
                      <input v-model="variant.is_default" type="checkbox" class="form-check-input" @change="setDefaultVariant(index)">
                    </div>
                  </div>
                  <div class="col-md-1 d-flex align-items-end">
                    <button type="button" @click="removeVariant(index)" class="btn btn-danger btn-sm" v-if="SeatCover.variants.length > 1">×</button>
                  </div>
                </div>
              </div>
              <button type="button" @click="addVariant" class="btn btn-secondary btn-sm">+ Add Variant</button>
            </div>
            <small class="form-text text-muted">Modify variant prices, discounts, and details. At least one variant is required.</small>
          </div>
          
          <button type="submit" class="btn btn-primary">Update Seat Cover</button>
        </form>
        
        <div v-if="Object.keys(messages).length" class="mt-3">
          <div v-for="(message, category) in messages" :key="category" 
               :class="'alert alert-' + (category === 'error' ? 'danger' : 'success')" 
               class="alert-dismissible fade show">
            {{ message }}
            <button type="button" class="btn-close" @click="dismissMessage(category)"></button>
          </div>
        </div>
      </div>
    </div>
    `,
    data() {
        return {
            user: {
                isAuthenticated: false,
                isAdmin: false,
                name: '',
            },
            SeatCover: {
                car_ids: [] // Initialize as array for multiple car selection
            },
            is_ad: false,
            cars: [],
            messages: [],
        }
    },
   
    methods: {
        onFileChange(e) {
            let files = e.target.files || e.dataTransfer.files;
            if (!files.length) return;
            this.createImage(files[0]);
        },
        createImage(file) {
            let reader = new FileReader();
            let vm = this;
            reader.onload = (e) => {
                vm.SeatCover.poster = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        updateSeatCover() {
            const id = this.$route.params.id;
            
            // Ensure at least one default variant
            if (this.SeatCover.variants && this.SeatCover.variants.length > 0) {
                const hasDefault = this.SeatCover.variants.some(v => v.is_default);
                if (!hasDefault) {
                    this.SeatCover.variants[0].is_default = true;
                }
            }
            
            console.log('🔄 Updating seat cover with data:', this.SeatCover);
            
            axios.put(`/update_seatcover/${id}`, this.SeatCover, { 
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
                }
            })
            .then(response => {
                console.log('✅ Seat cover updated successfully');
                this.$router.push(`/seat-covers`);
            })
            .catch(error => {
                console.error('❌ Error updating seat cover:', error);
                this.errorMessage = error.response?.data?.message || error.message;
            });
        },
        submitForm() {
            this.updateSeatCover();
        },
        fetchData() {
          const id = this.$route.params.id;
            axios.get('/api/seat_cover/' + id + '?for_update=true',{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
                .then(response => {
                    this.SeatCover = response.data.Seat_Covers[0];
                    
                    // Convert cars array to car_ids array for the checkboxes
                    if (this.SeatCover.cars && this.SeatCover.cars.length > 0) {
                        this.SeatCover.car_ids = this.SeatCover.cars.map(car => car.id);
                    } else {
                        this.SeatCover.car_ids = [];
                    }

                    // Ensure variants exist - create default ones if none
                    if (!this.SeatCover.variants || this.SeatCover.variants.length === 0) {
                        this.SeatCover.variants = [
                            {
                                name: 'Budget',
                                description: 'Quality materials at an affordable price',
                                price: this.SeatCover.price * 0.8,
                                discount: this.SeatCover.discount,
                                is_default: false
                            },
                            {
                                name: 'Standard',
                                description: 'Our recommended choice with excellent quality',
                                price: this.SeatCover.price,
                                discount: this.SeatCover.discount,
                                is_default: true
                            },
                            {
                                name: 'Premium',
                                description: 'Luxury materials with extended durability',
                                price: this.SeatCover.price * 1.3,
                                discount: this.SeatCover.discount,
                                is_default: false
                            }
                        ];
                    }

                    console.log('✅ Loaded seat cover for update:', this.SeatCover.name)
                    console.log('🚗 Associated cars:', this.SeatCover.car_ids)
                    console.log('🎨 Variants:', this.SeatCover.variants)
                    this.messages = response.data.messages;
                })
                .catch(error => {
                    console.error("❌ Error fetching seat cover data:", error);
                });
        },
        fetchCars() {
            axios.get('/api/available_cars')
                .then(response => {
                    this.cars = response.data.cars;
                })
                .catch(error => {
                    console.error('Error fetching cars:', error);
                });
        },
        dismissMessage: function(category) {
            delete this.messages[category];
        },
        addVariant() {
            this.SeatCover.variants.push({
                name: 'New Variant',
                description: '',
                price: this.SeatCover.price,
                discount: 0,
                is_default: false
            });
        },
        removeVariant(index) {
            if (this.SeatCover.variants.length > 1) {
                this.SeatCover.variants.splice(index, 1);
                // If we removed the default variant, make the first one default
                if (!this.SeatCover.variants.some(v => v.is_default)) {
                    this.SeatCover.variants[0].is_default = true;
                }
            }
        },
        setDefaultVariant(index) {
            // Only one variant can be default
            this.SeatCover.variants.forEach((variant, i) => {
                variant.is_default = (i === index);
            });
        },
    },
    created() {
      const id = this.$route.params.id;
      this.fetchData();
      this.fetchCars();
    },
    mounted() {
        axios.get('/api/check_admin',{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
      .then(response => {
          this.is_ad = response.data.is_admin
      })
      .catch(error => {
          console.error("Error fetching data:", error);
      });
    },
});

export default UpdateSeatCover