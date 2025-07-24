import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const UserHome = Vue.component('UserHome', {
  template: `
  <div class="container-userhome">
    <nav class="navbar-userhome">
                                  <router-link to="/seat-covers" class="navbar-brand-userhome" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
      <!--<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>-->
      <div class="search-bar-userhome">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" placeholder="Search for anything" v-model="searchQuery">
        <button @click="search">Search</button>
      </div>
<!-- <div class="select">
  <select class="form-select" v-model="option">
    <option value="Movie Name">Movie Name</option>
    <option value="rating greater than">rating greater than</option>
    <option value="rating less or equal to">rating less or equal to</option>
    <option value="Genre">Genre</option>
  </select>
</div>  -->

      <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
        
            <div>
              <router-link to="/my_orders" class="nav-link white-text">My Orders</router-link>
            </div>
            <div>
              <router-link to="/my_cars" class="nav-link white-text">My Cars</router-link>
            </div>
        <ul class="navbar-nav navbar-nav mr-auto">
          <li class="nav-item dropdown" >
            <a class="white-text dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            {{ 'User' }}
            </a> 
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
              <li><router-link to="/login" class="nav-link">Logout</router-link></li>
            </ul>
          </li>
        </ul>
    </div>
    </nav>
    <div class="banner">
      <img src="../static/Banner_updated.png" alt="banner"> 
      <!-- <img src="../static/Banner_updated.png" alt="banner">-->
    </div>
    <div class="cards-list">
      <div v-if="categories.length > 0" v-for="category in categories" :key="category.id" class="card" @click="goToDetails(category.title)">
       <div class="card_image">
        <img :src="'static/' + category.title +'.jpg'">
        </div>
        <!-- <router-link :to="'/select_theaters/' + movie.id" class="link-dark"> -->
          <router-link :to="'/'+category.title" class="nav-link"><div class="card-text" style="padding-bottom:10px">
            <p>{{ category.title }}</p>
          </div></router-link>
         <!-- <div class="card_title">
            rating - {{ movie.rating }}
          </div>
          <div class="card_title">
            Genre - {{ movie.genre }}
          </div>
          </router-link> -->
      </div>
      <h2 v-else>No Categories Yet Yet</h2>
    </div>
    <footer class="footer white-text">
  <div class="footer__addr white-text">
    <h1 class="footer__logo white-text"><h2 class="logo-text white-text"><img class="logo footer_logo white-text" src="../static/logo.png">Carsona</h2></h1>
  </div>

  <ul class="footer__nav white-text">
    <li class="nav__item white-text">
      <h2 class="nav__title white-text">Quick Links</h2>
      <ul class="nav__ul white-text">
                                <li><router-link to="/seat-covers" class="white-text">Home</router-link></li>
        <li><router-link to="/my_orders" class="white-text">My Orders</router-link></li>
        <li><router-link to="/my_cars" class="white-text">My Cars</router-link></li>
      </ul>
    </li>

    <li class="nav__item white-text">
      <h2 class="nav__title white-text">Support</h2>
      <ul class="nav__ul white-text">
        <li>
          <a @click="openPolicyPage('/contact-us')" class="white-text" style="cursor: pointer;">Contact Us</a>
        </li>
        <li>
          <a @click="openPolicyPage('/shipping-policy')" class="white-text" style="cursor: pointer;">Shipping Policy</a>
        </li>
        <li>
          <a @click="openPolicyPage('/cancellations-and-refunds')" class="white-text" style="cursor: pointer;">Returns & Refunds</a>
        </li>
      </ul>
    </li>

    <li class="nav__item white-text">
      <h2 class="nav__title white-text">Legal</h2>
      <ul class="nav__ul white-text">
        <li>
          <a @click="openPolicyPage('/privacy-policy')" class="white-text" style="cursor: pointer;">Privacy Policy</a>
        </li>
        <li>
          <a @click="openPolicyPage('/terms-and-conditions')" class="white-text" style="cursor: pointer;">Terms & Conditions</a>
        </li>
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
      user_id:'',
      movies: {},
      categories: [],
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
        this.categories = response.data.categories
        console.log(this.categories)
      })
      .catch(error => {
        console.error('API request error:', error);
      });
    },
    fetchMovies: function() {
      axios.get('movies_user')
        .then(response => {
          this.movies = response.data.movies;
        })
        .catch(error => {
          console.error(error);
        });
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
    fetchUser(){
      axios.get('/user_id')
          .then(response => {
              this.user_id = response.data.user;
              console.log(this.user_id);
          });
  },
  goToDetails(title) {
    if (title === "Car Tiers") {
      this.$router.push({ name: 'CarTiers' });
    } else {
      const formattedTitle = title.replace(/\s+/g, '');
      console.log(formattedTitle);
      this.$router.push({ name: formattedTitle });
    }
  },
  openPolicyPage(url) {
    // Force full page navigation, bypassing Vue Router, using www domain for SSL compatibility
    window.open('https://www.carsona.in' + url, '_blank');
  }
},
  created: function() {
    this.fetchMovies();
    this.fetchUser()
    this.fetchCategories();
  },
});

export default UserHome
