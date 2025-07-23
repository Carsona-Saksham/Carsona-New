import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const AddSeatCovers = Vue.component('AddSeatCovers', {
    template: `
    <div>
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
          <a class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif" href="/">Carsona</a>
          <ul class="navbar-nav navbar-nav mr-auto">
            <li class="nav-item">
              <router-link class="nav-link active" to="/home">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link active" to="/seat-covers">Seat Covers</router-link>
            </li>
          </ul>
        </div>
      </nav>
      
      <div class="container mt-4">
        <h2>Add New Seat Cover</h2>
        <form @submit.prevent="submitForm">
          <div class="mb-3">
            <label for="name" class="form-label">Name</label>
            <input v-model="name" type="text" class="form-control" id="name" required>
          </div>
          
          <div class="mb-3">
            <label for="price" class="form-label">Base Price</label>
            <input v-model="price" type="number" class="form-control" id="price" required>
          </div>
          
          <div class="mb-3">
            <label for="discount" class="form-label">Discount (%)</label>
            <input v-model="discount" type="number" class="form-control" id="discount">
          </div>
          
          <div class="mb-3">
            <h4>Variants</h4>
            <div v-for="(variant, index) in variants" :key="index" class="variant-section mb-4 p-3 border rounded">
              <h5>{{ variant.name }}</h5>
              <div class="mb-2">
                <label class="form-label">Description</label>
                <input v-model="variant.description" type="text" class="form-control">
              </div>
              <div class="mb-2">
                <label class="form-label">Material Thickness (mm)</label>
                <input v-model="variant.thickness" type="number" class="form-control" step="0.1">
              </div>
              <div class="mb-2">
                <label class="form-label">Material Type</label>
                <input v-model="variant.material_type" type="text" class="form-control">
              </div>
              <div class="mb-2">
                <label class="form-label">Warranty (months)</label>
                <input v-model="variant.warranty" type="number" class="form-control">
              </div>
              <div class="mb-2">
                <label class="form-label">Price</label>
                <input v-model="variant.price" type="number" class="form-control">
              </div>
              <div class="mb-2">
                <label class="form-label">Discount (%)</label>
                <input v-model="variant.discount" type="number" class="form-control">
              </div>
              <div class="form-check">
                <input type="checkbox" class="form-check-input" v-model="variant.is_default" :id="'default-' + index">
                <label class="form-check-label" :for="'default-' + index">Set as default variant</label>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Select Compatible Cars</label>
            
            <!-- Search and Select All Controls -->
            <div class="car-controls mb-3">
              <div class="row">
                <div class="col-md-6">
                  <input 
                    v-model="carSearchQuery" 
                    type="text" 
                    class="form-control" 
                    placeholder="Search cars by brand or model..."
                    @input="filterCars"
                  >
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      id="selectAllCars"
                      :checked="areAllCarsSelected"
                      @change="toggleSelectAll"
                    >
                    <label class="form-check-label" for="selectAllCars">
                      Select All ({{ filteredCars.length }} cars)
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Selected Cars Summary -->
            <div v-if="selectedCars.length > 0" class="selected-cars-summary mb-2">
              <small class="text-muted">
                Selected: {{ selectedCars.length }} car(s)
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-secondary ms-2" 
                  @click="clearSelection"
                >
                  Clear All
                </button>
              </small>
            </div>
            
            <div class="car-selection-container" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">
              <div v-for="car in filteredCars" :key="car.id" class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :value="car.id" 
                  :id="'car-' + car.id"
                  v-model="selectedCars"
                >
                <label class="form-check-label" :for="'car-' + car.id">
                  {{ car.brand_name }} - {{ car.name }}
                </label>
              </div>
              
              <!-- No Results Message -->
              <div v-if="filteredCars.length === 0 && carSearchQuery" class="text-center text-muted py-3">
                <p>No cars found matching "{{ carSearchQuery }}"</p>
                <button type="button" class="btn btn-sm btn-link" @click="clearSearch">Clear Search</button>
              </div>
            </div>
            <small class="form-text text-muted">Select one or more cars for this seat cover</small>
          </div>
          
          <div class="mb-3">
            <label for="poster" class="form-label">Poster</label>
            <input type="file" class="form-control" @change="onFileChange" accept="image/*">
            <img v-if="poster" :src="poster" alt="Preview" style="max-width: 200px; margin-top: 10px;">
          </div>
          
          <!-- Color Variants Section -->
          <div class="mb-3">
            <h4>Color Variants</h4>
            <div class="form-check mb-2">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="enableColorVariants"
                v-model="enableColorVariants"
              >
              <label class="form-check-label" for="enableColorVariants">
                Enable multiple color options for this design
              </label>
            </div>
            
            <div v-if="enableColorVariants" class="color-variants-section">
              <div v-for="(colorVariant, index) in colorVariants" :key="index" class="color-variant-item mb-3 p-3 border rounded">
                <div class="row">
                  <div class="col-md-2">
                    <label class="form-label">Primary Color</label>
                    <input v-model="colorVariant.color_name" type="text" class="form-control" placeholder="e.g., Black">
                  </div>
                  <div class="col-md-1">
                    <label class="form-label">Color</label>
                    <input v-model="colorVariant.color_code" type="color" class="form-control form-control-color">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Secondary Color (Optional)</label>
                    <input v-model="colorVariant.secondary_color_name" type="text" class="form-control" placeholder="e.g., Red Stitching">
                  </div>
                  <div class="col-md-1">
                    <label class="form-label">Color</label>
                    <input v-model="colorVariant.secondary_color_code" type="color" class="form-control form-control-color">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Color Image</label>
                    <input type="file" class="form-control" @change="onColorFileChange($event, index)" accept="image/*">
                  </div>
                  <div class="col-md-1">
                    <div class="form-check mt-4">
                      <input 
                        class="form-check-input" 
                        type="radio" 
                        :name="'primaryColor'" 
                        :value="index"
                        v-model="primaryColorIndex"
                      >
                      <label class="form-check-label">Primary</label>
                    </div>
                  </div>
                  <div class="col-md-1">
                    <button 
                      type="button" 
                      class="btn btn-sm btn-danger mt-4" 
                      @click="removeColorVariant(index)"
                      v-if="colorVariants.length > 1"
                    >
                      ✖
                    </button>
                  </div>
                </div>
                
                <!-- Color Preview -->
                <div class="row mt-2">
                  <div class="col-md-12">
                    <div class="color-preview d-flex align-items-center gap-2">
                      <span class="text-muted small">Preview:</span>
                      <div 
                        class="color-dot-preview" 
                        :style="{ backgroundColor: colorVariant.color_code }"
                        style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #ddd;"
                      ></div>
                      <span class="small">{{ colorVariant.color_name || 'Primary Color' }}</span>
                      <div v-if="colorVariant.secondary_color_name" class="d-flex align-items-center gap-2">
                        <span class="text-muted small">+</span>
                        <div 
                          class="color-dot-preview" 
                          :style="{ backgroundColor: colorVariant.secondary_color_code }"
                          style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #ddd;"
                        ></div>
                        <span class="small">{{ colorVariant.secondary_color_name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="colorVariant.poster" class="mt-2">
                  <img :src="colorVariant.poster" alt="Color Preview" style="max-width: 100px; height: 60px; object-fit: cover;">
                </div>
              </div>
              
              <button type="button" class="btn btn-secondary" @click="addColorVariant">
                Add Another Color
              </button>
              
              <div class="alert alert-info mt-2">
                <small>
                  <strong>Tip:</strong> The primary color will be displayed on the main product card. 
                  Customers can see other colors when they view the product details.
                </small>
              </div>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary">Add Seat Cover</button>
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
            name: '',
            price: '',
            discount: '',
            poster: '',
            car_ids: [],
            variants: [
                {
                    name: 'Budget',
                    description: 'Quality materials at an affordable price',
                    price: 0,
                    discount: 0,
                    is_default: false,
                    thickness: 2.0,
                    material_type: 'Synthetic Leather',
                    warranty: 6
                },
                {
                    name: 'Standard',
                    description: 'Our recommended choice with excellent quality',
                    price: 0,
                    discount: 0,
                    is_default: true,
                    thickness: 2.5,
                    material_type: 'Premium PU Leather',
                    warranty: 12
                },
                {
                    name: 'Premium',
                    description: 'Luxury materials with extended durability',
                    price: 0,
                    discount: 0,
                    is_default: false,
                    thickness: 3.0,
                    material_type: 'Genuine Leather',
                    warranty: 24
                }
            ],
            cars: [],
            selectedCars: [],
            messages: {},
            is_ad: false,
            carSearchQuery: '',
            filteredCars: [],
            areAllCarsSelected: false,
            enableColorVariants: false,
            colorVariants: [],
            primaryColorIndex: null
        };
    },
    computed: {
        areAllCarsSelected() {
            return this.filteredCars.length > 0 && this.filteredCars.every(car => this.selectedCars.includes(car.id));
        }
    },
    watch: {
        selectedCars() {
            // Update the "Select All" checkbox state when individual selections change
            this.$nextTick(() => {
                this.areAllCarsSelected = this.filteredCars.length > 0 && this.filteredCars.every(car => this.selectedCars.includes(car.id));
            });
        },
        filteredCars() {
            // Update the "Select All" checkbox state when filtered cars change
            this.$nextTick(() => {
                this.areAllCarsSelected = this.filteredCars.length > 0 && this.filteredCars.every(car => this.selectedCars.includes(car.id));
            });
        },
        enableColorVariants(newVal) {
            if (newVal && this.colorVariants.length === 0) {
                this.addColorVariant();
            } else if (!newVal) {
                this.colorVariants = [];
                this.primaryColorIndex = null;
            }
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
                vm.poster = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        submitForm() {
            // Calculate variant prices based on base price
            this.variants = this.variants.map(variant => {
                const price = parseFloat(variant.price) || 0;
                const baseDiscount = parseFloat(variant.discount) || 0;
                return {
                    ...variant,
                    price: price,
                    discount: baseDiscount,
                    final_price: price * (1 - baseDiscount / 100)
                };
            });

            const formData = {
                name: this.name,
                price: this.price,
                discount: this.discount,
                poster: this.poster,
                car_ids: this.selectedCars,
                variants: this.variants.map(variant => ({
                    name: variant.name,
                    description: variant.description,
                    price: parseFloat(variant.price),
                    discount: parseFloat(variant.discount),
                    material_type: variant.material_type,
                    thickness: parseFloat(variant.thickness),
                    warranty: parseInt(variant.warranty),
                    is_default: variant.is_default
                })),
                colorVariants: this.colorVariants.map(variant => ({
                    color_name: variant.color_name,
                    color_code: variant.color_code,
                    secondary_color_name: variant.secondary_color_name,
                    secondary_color_code: variant.secondary_color_code,
                    poster: variant.poster
                })),
                primaryColorIndex: this.primaryColorIndex
            };

            axios.post('/api/add_seatcovers', formData, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }
            })
            .then(response => {
                console.log('Seat cover added:', response.data);
                this.$router.push('/seat-covers');
            })
            .catch(error => {
                console.error('Error adding seat cover:', error);
            });
        },
        dismissMessage: function(category) {
            delete this.messages[category];
        },
        fetchCars() {
            axios.get('/api/available_cars')
                .then(response => {
                    this.cars = response.data.cars;
                    this.filteredCars = response.data.cars;
                })
                .catch(error => {
                    console.error('Error fetching cars:', error);
                });
        },
        filterCars() {
            this.filteredCars = this.cars.filter(car => 
                car.brand_name.toLowerCase().includes(this.carSearchQuery.toLowerCase()) ||
                car.name.toLowerCase().includes(this.carSearchQuery.toLowerCase())
            );
        },
        toggleSelectAll() {
            if (this.areAllCarsSelected) {
                // Remove all filtered cars from selection
                this.selectedCars = this.selectedCars.filter(carId => 
                    !this.filteredCars.some(car => car.id === carId)
                );
            } else {
                // Add all filtered cars to selection
                const filteredCarIds = this.filteredCars.map(car => car.id);
                this.selectedCars = [...new Set([...this.selectedCars, ...filteredCarIds])];
            }
        },
        clearSelection() {
            this.selectedCars = [];
        },
        clearSearch() {
            this.carSearchQuery = '';
            this.filterCars();
        },
        onColorFileChange(e, index) {
            let files = e.target.files || e.dataTransfer.files;
            if (!files.length) return;
            this.createColorImage(files[0], index);
        },
        createColorImage(file, index) {
            let reader = new FileReader();
            let vm = this;
            reader.onload = (e) => {
                vm.colorVariants[index].poster = e.target.result;
            };
            reader.readAsDataURL(file);
        },
        addColorVariant() {
            this.colorVariants.push({
                color_name: '',
                color_code: '#000000',
                secondary_color_name: '',
                secondary_color_code: '#000000',
                poster: ''
            });
            if (this.primaryColorIndex === null) {
                this.primaryColorIndex = this.colorVariants.length - 1;
            }
        },
        removeColorVariant(index) {
            this.colorVariants.splice(index, 1);
            if (this.primaryColorIndex === index) {
                this.primaryColorIndex = null;
            }
        }
    },
    mounted() {
        const token = localStorage.getItem('access_token');
        console.log('Token on mount:', token); // Debug log
        
        if (!token) {
            this.$router.push('/');
            return;
        }
        
        axios.get('/api/check_admin', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(response => {
            this.is_ad = response.data.is_admin;
            console.log('Is admin:', this.is_ad);
            if (!this.is_ad) {
                this.$router.push('/seat-covers');
            }
        })
        .catch(error => {
            console.error("Error checking admin status:", error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('access_token');
                this.$router.push('/');
            }
        });
        
        this.fetchCars();
    },
});

export default AddSeatCovers