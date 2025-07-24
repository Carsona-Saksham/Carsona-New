import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const Coupons = Vue.component('Coupons', {
  template: `
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <router-link class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif;color:rgb(192, 25, 192)" to="/home">Carsona</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
          <ul class="navbar-nav navbar-nav mr-auto">
            <li class="nav-item">
              <router-link class="nav-link" aria-current="page" to="/home">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/add-coupons">Add Coupons</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <h3 class="text-center font-weight-bold mt-5">All Coupons</h3>
    <div class="container">
      <div class="row">
        <div class="col-md-12">
          <div v-if="coupons.length === 0" class="text-center mt-5">
            <h4>No coupons found</h4>
            <p>There are currently no coupons in the system.</p>
          </div>
          <table v-else class="table table-striped">
            <thead class="thead-dark">
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
                <th>Description</th>
                <th>Discount %</th>
                <th>Category</th>
                <th>Status</th>
                <th>Applicable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="coupon in coupons" :key="coupon.id" :class="{ 'table-secondary': !coupon.if_applicable }">
                <td>{{ coupon.id }}</td>
                <td><strong>{{ coupon.code }}</strong></td>
                <td>{{ coupon.name }}</td>
                <td>{{ coupon.description }}</td>
                <td>{{ coupon.discount_percentage }}%</td>
                <td>{{ coupon.category }}</td>
                <td>
                  <span :class="getStatusClass(coupon.is_active)" class="badge">
                    {{ coupon.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <span :class="getApplicableClass(coupon.if_applicable)" class="badge">
                    {{ coupon.if_applicable ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td>
                  <button @click="editCoupon(coupon)" class="btn btn-warning btn-sm me-2">Edit</button>
                  <button @click="deleteCoupon(coupon.id)" class="btn btn-danger btn-sm">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      coupons: []
    };
  },
  methods: {
    fetchCoupons() {
      axios.get('/api/coupons', {
        headers: { 
          'Authorization': 'Bearer ' + localStorage.getItem('access_token') 
        }
      })
        .then(response => {
          this.coupons = response.data.coupons || [];
          console.log('Fetched coupons:', this.coupons);
        })
        .catch(error => {
          console.error('Error fetching coupons:', error);
          this.coupons = [];
        });
    },
    getStatusClass(isActive) {
      return isActive ? 'badge-success' : 'badge-danger';
    },
    getApplicableClass(isApplicable) {
      return isApplicable ? 'badge-primary' : 'badge-secondary';
    },
    editCoupon(coupon) {
      // Redirect to the edit coupon page or open a modal
      this.$router.push({ name: 'EditCoupon', params: { id: coupon.id } });
    },
    deleteCoupon(couponId) {
      if (confirm('Are you sure you want to delete this coupon?')) {
        axios.delete(`/api/delete_coupon/${couponId}`, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('access_token') 
          }
        })
          .then(response => {
            alert('Coupon deleted successfully!');
            this.fetchCoupons(); // Refresh the coupon list
          })
          .catch(error => {
            console.error('Error deleting coupon:', error);
            alert('Failed to delete coupon.');
          });
      }
    }
  },
  created() {
    this.fetchCoupons(); // Fetch coupons when the component is created
  }
});

export default Coupons; 