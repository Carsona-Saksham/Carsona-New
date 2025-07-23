import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const UpdateShow = Vue.component('UpdateShow', {
    data() {
        return {
            show: {
                id: this.$route.params.id,
                movie: '',
                t_in: '',
                datetime: '',
                available_seats: '',
                cost: ''
            },
            movies: {},
            theaters: {},
            messages: [],
        }
    },
    methods: {
        updateShow() {
            axios.put('/api/update_show/' + this.show.id, this.show, { headers: {
              'Authorization': 'Bearer ' + localStorage.getItem('access_token')
          }
      })
                .then(response => {
                    this.$router.push('/my_theaters');
                })
                .catch(error => {
                    console.log(error);
                });
        },
        fetchData() {
            axios.get('/api/my_theaters',{headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access_token') }})
                .then(response => {
                    this.movies = response.data.movies;
                    this.theaters = response.data.theater;
                    this.messages = response.data.messages;
                    console.log(this.movies,this.theaters)
                })
                .catch(error => {
                    console.error("Error fetching data:", error);
                });
        },
        submitForm() {
            this.updateShow();
        }
        
    },
    mounted() {
        this.fetchData();
    },
    template: `
    <div>
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <router-link class="nav-link" to="/home">Home</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/">Logout</router-link>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <h3 style="display: flex; justify-content: center;align-items: center;padding-top:5%; font-weight:700">Update Show</h3>

    <div class="form" style="display: flex; justify-content: center;align-items: center;padding-top:10px;padding-bottom:70px">
        <form @submit.prevent="submitForm">

        <div class="mb-3">
        <label class="form-label">Select Movie</label>
        <select class="form-select" aria-label="Select Movie" v-model="show.movie">
          <option v-for="movie in movies" :key="movie.title" :value="movie.title">{{ movie.title }}</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Select theater</label>
        <select class="form-select" aria-label="Select Theater" v-model="show.t_in">
          <option v-for="theater in theaters" :key="theater.id" :value="theater.id">{{ theater.name }}</option>
        </select>
      </div>


            <div class="mb-3">
                <label class="form-label">Date and Time</label>
                <input type="datetime-local" class="form-control" v-model="show.datetime">
            </div>

            <div class="mb-3">
                <label class="form-label">Available Seats</label>
                <input type="number" class="form-control" v-model="show.available_seats">
            </div>

            <div class="mb-3">
                <label class="form-label">Cost</label>
                <input type="number" class="form-control" v-model="show.cost">
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

export default UpdateShow
