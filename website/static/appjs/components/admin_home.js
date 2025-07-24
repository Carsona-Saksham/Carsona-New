import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const Home = Vue.component('Home', {
  template: `
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
              <router-link to="/home" class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" placeholder="Search for anything" v-model="searchQuery">
        <button @click="search">Search</button>
      </div>
     <!--  <div class="select">
        <select class="form-select" v-model="option">
          <option value="Movie Name">Movie Name</option>
          <option value="rating greater than">rating greater than</option>
          <option value="rating less or equal to">rating less or equal to</option>
          <option value="Genre">Genre</option>
        </select>
      </div> -->
      <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
        <ul class="navbar-nav navbar-nav mr-auto">
          <div v-if="user.isAdmin" class="admin-links">
            <li class="nav-item">
              <router-link to="/coupons" class="nav-link">Coupons</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/my_theaters" class="nav-link">Theater</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/movies" class="nav-link">Categories</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/admin/orders" class="nav-link">Orders</router-link>
            </li>
          </div>
          <div v-else>
            <router-link to="/my_tickets" class="nav-link">My Tickets</router-link>
          </div>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              {{ user.isAdmin ? 'Admin' : 'User' }}
            </a>
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
              <li><router-link to="/login" class="nav-link">Logout</router-link></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
    </nav>
    <div class="banner">
      <img src="../static/banner.png" alt="banner">
    </div>
    <div class="cards-list">
      <div v-if="categories.length > 0" v-for="category in categories" :key="category.id" class="card">
        <div class="card_image">
         <img :src="'static/' + category.title+'.jpg'">  

        </div>
          <router-link :to="'/'+category.title" class="nav-link"><div class="card_title" style="padding-bottom:10px">
            <p>{{ category.title }}</p>
          </div></router-link>
          <!--  <div class="card_title">
            rating - {{ movie.rating }}
          </div>
          <div class="card_title">
            Genre - {{ movie.genre }}
          </div>  -->
      </div>
      <h2 v-else>No Categories Yet</h2>
    </div>
    <footer class="footer">
  <div class="footer__addr">
            <h1 class="footer__logo"><h2 class="logo-text"><img class="logo footer_logo" src="../static/logo.png">Carsona</h2></h1>
  </div>

  <ul class="footer__nav">
    <li class="nav__item">
      <h2 class="nav__title">Admin Links</h2>
      <ul class="nav__ul">
        <li><router-link to="/home" class="nav-link">Dashboard</router-link></li>
        <li><router-link to="/movies" class="nav-link">Categories</router-link></li>
        <li><router-link to="/coupons" class="nav-link">Coupons</router-link></li>
        <li><router-link to="/admin/orders" class="nav-link">Orders</router-link></li>
      </ul>
    </li>

    <li class="nav__item">
      <h2 class="nav__title">Support</h2>
      <ul class="nav__ul">
        <li><a href="https://www.carsona.in/contact-us" target="_blank">Contact Us</a></li>
        <li><a href="https://www.carsona.in/shipping-policy" target="_blank">Shipping Policy</a></li>
        <li><a href="https://www.carsona.in/cancellations-and-refunds" target="_blank">Returns & Refunds</a></li>
      </ul>
    </li>

    <li class="nav__item">
      <h2 class="nav__title">Legal</h2>
      <ul class="nav__ul">
        <li><a href="https://www.carsona.in/privacy-policy" target="_blank">Privacy Policy</a></li>
        <li><a href="https://www.carsona.in/terms-and-conditions" target="_blank">Terms & Conditions</a></li>
      </ul>
    </li>
  </ul>

  <div class="legal">
    <p>&copy; 2025 Carsona. All rights reserved.</p>
  </div>
</footer>
  </div>
  `,
  data: function() {
    return {
      searchQuery: '',
      option: 'Movie Name',
      categories: [],
      user: {
        isAuthenticated: false,
        isAdmin: localStorage.getItem('is_admin') === 'true' ? true : false,
        name: localStorage.getItem('name'),
      },
    };
  },
  methods: {
    search: function() {
      console.log('Search method called');
      axios.post('/api/search', {
        searching: this.searchQuery,
        options: this.option
      },{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
      .then(response => {
        console.log(response.data);
        this.movies = response.data.movies
        // update your component's data with the response...
      })
      .catch(error => {
        console.error('API request error:', error);
      });
    },
    logPoster: function(poster) {
      console.log(poster);
    },
    fetchCategories: function() {
      axios.get('categories', {headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
        .then(response => {
          console.log(response.data);
          this.categories = response.data.category;
        })
        .catch(error => {
          console.error(error);
        });
    },
  },
  created: function() {
    this.fetchCategories();
  },
});



export default Home