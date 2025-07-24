import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const AddTheater = Vue.component('AddTheater', {
    data() {
      return {
        newTheater: {
          name: '',
          address: ''},
          user: {
            isAuthenticated: false,
            isAdmin: localStorage.getItem('is_admin') === 'true' ? true : false,
            name: localStorage.getItem('name'),
          },
        messages: {},
        is_ad: false
      }
    },
    methods: {
      addTheater: function() {
        axios.post('/api/add_theaters', {
          name: this.newTheater.name,
          address: this.newTheater.address
        },{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
        .then(response => {
          this.messages.success = 'Your Theater is being added';
          this.newTheater.name = '';
          this.newTheater.address = '';
          this.$router.push('/my_theaters');
        })
        .catch(error => {
          this.messages.error = 'Fill all the fields';
        });
      },
      alertClass: function(category) {
        return `alert-${category}`;
      },
      dismissMessage: function(category) {
        delete this.messages[category];
      }
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
    template: `
      <div>
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <router-link class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif;color:rgb(192, 25, 192)" to="/home">Ticker</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
          <ul class="navbar-nav navbar-nav mr-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/home">Home</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link active" v-if="is_ad" to="/my_theaters">Theater</router-link>
              <router-link class="nav-link" v-if="is_ad" to="/movies">Movies</router-link>
              <router-link class="nav-link" v-else to="/my_tickets">My Tickets</router-link>
            </li>
            <li class="nav-item dropdown">
              <router-link class="nav-link dropdown-toggle" to="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Admin
              </router-link>
              <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                <li><router-link class="nav-link" to="/">Logout</router-link></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <h3 style="display: flex; justify-content: center;align-items: center;padding-top:5%; font-weight:700">Add Theater</h3>
<div class="form" style="display: flex; justify-content: center;align-items: center;padding-top:10px;padding-bottom:70px">
    <form @submit.prevent="addTheater">
        <div class="mb-3">
            <label class="form-label">Name</label>
            <input type="text" class="form-control" placeholder="Name of your theater" v-model="newTheater.name">
        </div>
        <div class="mb-3">
            <label class="form-label">Address</label>
            <input type="text" class="form-control" placeholder="Enter exact address" v-model="newTheater.address">
        </div>

        <button type="submit" class="btn btn-primary">Submit</button>
    </form>
</div>
<footer class="footer">
<div class="footer__addr">
  <h1 class="footer__logo"><h2 class="logo-text"><img class="logo footer_logo" src="../static/logo.png">Ticker</h2></h1>
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
      <li>
      Privacy Policy
      </li>

      <li>
        Terms And Conditions
      </li>

      <li>
          Site
      </li>
    </ul>
  </li>
</ul>

<div class="legal">
  <p>&copy; 2019  All rights reserved.</p>
</div>
</footer>
      </div>
    `
  });
  
  export default AddTheater