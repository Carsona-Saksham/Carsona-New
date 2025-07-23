import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const Movies = Vue.component('Movies', {
    template: `
    <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <router-link class="navbar-brand" :to="{ path: '/home' }" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
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

    <div class="container-fluid pt-4 ps-5">
      <div class="row">
        <div class="col-10">
          <h5 class="fw-bold">Categories</h5>
        </div>
        <div class="col-2">
          <router-link class="btn btn-outline-dark btn-sm" :to="{ path: '/add_category' }">Add Category</router-link>
        </div>
      </div>

      <div class="cards-list">
        <template v-if="categories.length > 0">
          <div v-for="category in categories" :key="category.id" class="card">
       
          
           <div class="card_image">
          <img :src="'static/' + category.title+'.jpg'">
        </div>
            <!-- <div class="card_image">
              <router-link :to="{ path: '/select_theaters/' + movie.id }" class="card_image">
              </router-link>
            </div> -->
            <div class="card_title">
              <p>{{ category.title }}</p>
            </div>
             <div class="card_title">
              <router-link :to="{ path: '/update_categories/' + category.id }" class="card-link">Update</router-link>
              <button class="btn btn-danger" @click="deleteCategory(category.id)">Delete</button>
            </div> 
          </div>
        </template>
        <template v-else>
          <h2>No Categories Yet</h2>
        </template>
      </div>
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
    `,
    data() {
      return {
        categories: {},
        is_ad: false,
        user: {
          isAuthenticated: false,
          isAdmin: localStorage.getItem('is_admin') === 'true' ? true : false,
          name: localStorage.getItem('name'),
        },
            };
    },
    methods: {
      logPoster: function(poster) {
        console.log(poster);
        return poster;

      },
      fetchcategories() {
        axios.get('/categories',{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
          .then(response => {
            this.categories = response.data.category;
          })
          .catch(error => {
            console.error(error);
          });
      },
      deleteCategory(movieId) {
        if (confirm('Do you want to delete this category?')) {
          axios.delete('/api/delete_categories/' + movieId, {headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
            .then(response => {
              console.log(response.data);
              location.reload();
            })
            .catch(error => {
              console.error("Error deleting movie:", error);
            });
        }
      },
    },
    mounted() {
      axios.get('/api/check_admin',{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
        .then(response => {
            this.is_ad = response.data.is_admin
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
      this.fetchcategories();
    axios.get('/api/check_admin',{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
      .then(response => {
          this.is_ad = response.data.is_admin
      })
      .catch(error => {
          console.error("Error fetching data:", error);
      });
      
  },
  });
  
  export default Movies