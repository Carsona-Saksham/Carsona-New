import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const EditCoupon = Vue.component('EditCoupon', {
  template: `
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <router-link class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif;color:rgb(192, 25, 192)" to="/home">Carsona</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link class="nav-link" to="/home">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/coupons">View Coupons</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/add_coupons">Add Coupons</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <h3 class="text-center font-weight-bold mt-5">Edit Coupon</h3>
    <div class="form d-flex justify-content-center align-items-center pb-5">
      <form @submit.prevent="updateCoupon" class="w-50">
        
        <!-- Coupon Name -->
        <div class="mb-3">
          <label class="form-label">Coupon Name:</label>
          <input type="text" class="form-control" v-model="coupon.name" required />
        </div>
        
        <!-- Coupon Code -->
        <div class="mb-3">
          <label class="form-label">Coupon Code:</label>
          <input type="text" class="form-control" v-model="coupon.code" required />
          <small class="text-muted">Unique coupon code</small>
        </div>
        
        <!-- Description -->
        <div class="mb-3">
          <label class="form-label">Description:</label>
          <input type="text" class="form-control" v-model="coupon.description" />
        </div>
        
        <!-- Category -->
        <div class="mb-3">
          <label class="form-label">Category:</label>
          <select class="form-control" v-model="coupon.category" required>
            <option value="">Select Category</option>
            <option v-for="category in categories" :key="category.id" :value="category.title">
              {{ category.title }}
            </option>
          </select>
          <small class="text-muted" v-if="categories.length === 0">Loading categories...</small>
        </div>

        <!-- Discount Percentage -->
        <div class="mb-3">
          <label class="form-label">Discount Percentage:</label>
          <div class="input-group">
            <input type="number" class="form-control" v-model.number="coupon.discount_percentage" min="1" max="100" required />
            <span class="input-group-text">%</span>
          </div>
        </div>

        <!-- Minimum Order Amount -->
        <div class="mb-3">
          <label class="form-label">Minimum Order Amount:</label>
          <div class="input-group">
            <span class="input-group-text">₹</span>
            <input type="number" class="form-control" v-model.number="coupon.minimum_amount" min="0" step="0.01" placeholder="0" />
          </div>
          <small class="text-muted">Set 0 for no minimum order requirement</small>
        </div>

        <!-- Max Usage Per User -->
        <div class="mb-3">
          <label class="form-label">Max Usage Per User:</label>
          <input type="number" class="form-control" v-model.number="coupon.max_usage_per_user" min="1" required />
          <small class="text-muted">How many times each user can use this coupon</small>
        </div>

        <!-- Is Applicable -->
        <div class="mb-3">
          <div class="form-check">
            <input type="checkbox" class="form-check-input" v-model="coupon.if_applicable" id="applicable" />
            <label class="form-check-label" for="applicable">
              Coupon is applicable
            </label>
          </div>
        </div>

        <!-- Is Active -->
        <div class="mb-3">
          <div class="form-check">
            <input type="checkbox" class="form-check-input" v-model="coupon.is_active" id="active" />
            <label class="form-check-label" for="active">
              Coupon is active
            </label>
          </div>
        </div>

        <button type="submit" class="btn btn-primary">Update Coupon</button>
      </form>
    </div>

    <footer class="footer">
      <div class="footer__addr">
        <h1 class="footer__logo"><h2 class="logo-text"><img class="logo footer_logo" src="../static/logo.png">Carsona</h2></h1>
      </div>
      <ul class="footer__nav">
        <li class="nav__item">
          <h2 class="nav__title"><i class="fa-solid fa-phone"></i>  Call 24x7</h2>
          <ul class="nav__ul">
            <li><a>+91 9549994869</a></li>
            <li><a>+91 9909909909</a></li>
            <li><a>+91 9054005109</a></li>
          </ul>
        </li>
        <li class="nav_item footer-address nav_item--extra">
          <h2 class="nav__title"><i class="fa-solid fa-envelope"></i> Post</h2>
          <p class="nav__ul">Rohini ,<br> Delhi-110011 ,<br> India</p>
        </li>
        <li class="nav__item">
          <h2 class="nav__title">Legal</h2>
          <ul class="nav__ul">
            <li>Privacy Policy</li>
            <li>Terms And Conditions</li>
            <li>Site</li>
          </ul>
        </li>
      </ul>
      <div class="legal">
        <p>&copy; 2019  All rights reserved.</p>
      </div>
    </footer>
  </div>
  `,
  data() {
    return {
      coupon: {
        name: '',
        code: '',
        description: '',
        category: '',
        discount_percentage: 0,
        minimum_amount: 0,
        max_usage_per_user: 1,
        if_applicable: true,
        is_active: true
      },
      categories: []
    };
  },
  methods: {
    fetchCategories() {
      axios.get('/api/categories')
        .then(response => {
          this.categories = response.data.categories || [];
          console.log('Fetched categories:', this.categories);
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
          // Fallback categories
          this.categories = [
            { id: 1, title: 'Seat Covers' },
            { id: 2, title: 'Steering Covers' },
            { id: 3, title: 'Floor Mats' },
            { id: 4, title: 'Car Accessories' }
          ];
        });
    },

    fetchCoupon() {
      const couponId = this.$route.params.id;
      axios.get(`/api/coupons/${couponId}`)
        .then(response => {
          this.coupon = response.data.coupon;
          console.log('Fetched coupon:', this.coupon);
        })
        .catch(error => {
          console.error('Error fetching coupon:', error);
          alert('Failed to load coupon details');
        });
    },

    updateCoupon() {
      // Validate required fields
      if (!this.coupon.name || !this.coupon.code || !this.coupon.category || !this.coupon.discount_percentage) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (this.coupon.discount_percentage < 1 || this.coupon.discount_percentage > 100) {
        alert('Discount percentage must be between 1 and 100');
        return;
      }

      const couponId = this.$route.params.id;
      axios.put(`/update_coupon/${couponId}`, {
        name: this.coupon.name,
        code: this.coupon.code,
        description: this.coupon.description,
        category: this.coupon.category,
        discount_percentage: this.coupon.discount_percentage,
        minimum_amount: this.coupon.minimum_amount,
        max_usage_per_user: this.coupon.max_usage_per_user,
        if_applicable: this.coupon.if_applicable,
        is_active: this.coupon.is_active
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('access_token')
        }
      })
      .then(response => {
        alert('Coupon updated successfully!');
        this.$router.push('/coupons');
      })
      .catch(error => {
        console.error('Error updating coupon:', error);
        const errorMessage = error.response?.data?.error || 'Failed to update coupon.';
        alert(errorMessage);
      });
    }
  },
  
  created() {
    this.fetchCategories();
    this.fetchCoupon();
  }
});

export default EditCoupon; 