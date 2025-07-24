import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const BookTickets = Vue.component('BookTickets', {
    data: function() {
        return {
            user: '',
            show: {
                movie: '',
                theater: '',
                cost: '',
                available_seats: ''
            },
            no_of_seats: 0,
            shows: {},
            messages: {}
        }
    },
    methods: {
        fetchShows: function() {
            axios.get('/show_user/' + this.$route.params.id)
              .then(response => {
                this.shows = response.data.show;
                console.log(response.data.show);
              })
              .catch(error => {
                console.error('API request error:', error);
              });
          },
        bookTicket: function(show) {
            axios.post('/api/book_ticket/' + show.id, {
                no_of_seats: this.no_of_seats
            })
            .then(response => {
                this.messages.success = 'Your ticket is being booked';
                this.no_of_seats = '';
                this.$router.push('/my_ticket');
            })
            .catch(error => {
                this.messages.error = 'Please fill all the fields';
            });
        },
        alertClass: function(category) {
            return `alert-${category}`;
        },
        dismissMessage: function(category) {
            delete this.messages[category];
        }
    },
    created: function() {
        console.log('fetchShows is running');
        this.fetchShows();
      },
    template: `
        <div>
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <router-link class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif;color:rgb(192, 25, 192)" :to="'/home'">Ticker</router-link>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
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
              User
            </router-link>
            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
              <li><router-link class="nav-link" :to="'/'">Logout</router-link></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
  <div v-for="(message, category) in messages" :key="category" class="alert" :class="{'alert-danger': category === 'error', 'alert-success': category === 'success', 'alert-warning': category === 'warning', 'alert-secondary': category === 'note'}" role="alert">
    {{ message }}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>

  <h3 style="display: flex; justify-content: center;align-items: center;padding-top:5%; font-weight:700">Book your show</h3>
  <div class="form" style="display: flex; justify-content: center;align-items: center;padding-top:10px;padding-bottom:130px" v-for="(show, index) in shows" :key="index">
    <form @submit.prevent="bookTicket(show)">
      <div class="mb-3">
      <label  class="form-label">Movie</label>
      <input class="form-control" type="text" :placeholder="show.movie" :aria-label="shows.movie" disabled>
    </div>
    <div class="mb-3">
      <label class="form-label">Theater</label>
      <input class="form-control" type="text" :placeholder="show.theater" :aria-label="shows.theater" disabled>
    </div>
    <div class="mb-3">
        <label class="form-label">Cost per seat</label>
        <input class="form-control" type="text" :placeholder="show.cost" :aria-label="shows.cost" disabled>
    </div>

    <div class="mb-3">
        <label class="form-label">Available Seats</label>
        <input class="form-control" type="text" :placeholder="show.available_seats" :aria-label="shows.seats_available" disabled>
    </div>

    <div class="mb-3">
    <label class="form-label">Select No of seats</label>
    <input type="Number" class="form-control" min="1" :max="show.available_seats" placeholder="Enter the number of seats" v-model="no_of_seats" required>
</div>

    <button class="btn btn-primary ">Book!</button>
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

export default BookTickets
