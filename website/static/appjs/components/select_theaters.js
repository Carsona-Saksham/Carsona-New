import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const SelectTheater = Vue.component('SelectTheater', {
    template: `
    <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <router-link class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif" :to="'/user_home'">Ticker</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
            <div class="search-bar">
  <i class="fa-solid fa-magnifying-glass"></i>
  <input type="search" placeholder="Search for theaters" v-model="searchQuery">
  <button @click="search">Search</button>
</div>
        <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
          <ul class="navbar-nav navbar-nav mr-auto">
            <li class="nav-item">
              <router-link class="nav-link" aria-current="page" :to="'/user_home'">Home</router-link>
            </li>
            <li class="nav-item">
              <div v-if="user.is_admin">
                <router-link class="nav-link" :to="'/my_theaters'">Theater</router-link>
                <router-link class="nav-link" :to="'/movies'">Movies</router-link>
              </div>
              <div v-else>
                <router-link class="nav-link" :to="'/my_ticket'">My Tickets</router-link>
              </div>
            </li>
            <li class="nav-item dropdown">
              <router-link class="nav-link dropdown-toggle" :to="'#'" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                {{ 'User' }}
              </router-link>
              <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                <li><router-link class="nav-link" :to="'/'">Logout</router-link></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <div v-for="(message, category) in messages" :key="category" class="alert" :class="'alert-' + category + ' alert-dismissible fade show'" role="alert">
      {{ message }}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    <div class="container">
      <div class="col">
        <h1 style="padding-top: 2%;"><div class="fw-bold">{{ movie.title }}</div></h1> In Theatres
      </div>
      <hr/>
      <p><strong>Book your show</strong></p> 
      <div class="container pt-4 pb-4">
      <div v-if="shows && shows.length > 0">
    <div class="row row-cols-auto" v-for="show in shows" :key="show.id">
      <router-link class="link-dark" :to="'/book_ticket/' + show.id">
          <div class="card">
              <div class="card-body">
                  <h5 class="card-title1">
                      <div>
                          <span>{{ show.movie }},</span>
                          {{ show.theater_name }}
                      </div>
                  </h5>
                  <p class="card-text">{{ show.add }}</p>
                  <p class="card-text">{{ show.time }}</p>
                  <hr/>
                  Cost <div class="fw-bold">{{ show.cost }} Rs</div>
              </div>
          </div>
      </router-link>
  </div>
  </div>
  <div v-else>
      <p>No shows yet.</p>
  </div>
  
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
    data: function() {
      return {
        searchQuery: '',
        user: '',
        shows: {},
        movie: {},
        messages: [],
        id:0
      };
    },
    methods: {
      search: function() {
        console.log('Search method called');
        axios.post('/api/search1/' + this.$route.params.id, {
          searching_theater: this.searchQuery,
        })
        .then(response => {
          console.log(response.data.shows);
          this.movie = response.data.movie;
          this.shows = response.data.shows
        })
        .catch(error => {
          console.error('API request error:', error);
        });
      },
      fetchShows: function() {
        axios.get('/select_theater/' + this.$route.params.id)
          .then(response => {
            if (response.data.shows && response.data.shows.length > 0) {
              console.log('hmm')
              this.user = response.data.user;
              this.shows = response.data.shows;
              this.movie = response.data.movie;
              this.id = this.movie.id
          } else {
              console.log('prob')
              this.shows = [];
              this.messages.push('No shows available for this movie');
          }
          })
          .catch(error => {
            console.error('API request error:', error);
          });
      },
    },
    created: function() {
      console.log('fetchShows is running');
      this.fetchShows();
    },
  });
  
  export default SelectTheater