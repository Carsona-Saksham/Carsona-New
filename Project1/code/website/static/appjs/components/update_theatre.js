import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const UpdateTheater = Vue.component('UpdateTheater', {
    data() {
        return {
            user: {
                isAuthenticated: false,
                isAdmin: false,
                name: '',
              },
            theater: {
                id: this.$route.params.id,
                name: '',
                address: ''
            },
            is_ad: false,
            messages: [],
        }
    },
    methods: {
        updateTheater() {
            axios.put('/api/update_theatre/' + this.theater.id, this.theater, { headers: {
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
                    console.log(response.data);
                    this.my_theater = response.data.theater;
                    this.my_show = response.data.show;
                    console.log(this.my_show)
                    this.messages = response.data.messages;
                })
                .catch(error => {
                    console.error("Error fetching data:", error);
                })
                ;
        },
        submitForm() {
            this.updateTheater();
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
              <router-link class="nav-link" aria-current="page" to="/home">Home</router-link>
            </li>
            <li class="nav-item" v-if="user.isAuthenticated">
              <router-link class="nav-link active" v-if="user.isAdmin" to="/my_theaters">Theater</router-link>
              <router-link class="nav-link" v-if="user.isAdmin" to="/movies">Movies</router-link>
              <router-link class="nav-link" v-else to="/my_tickets">My Tickets</router-link>
            </li>
            <li class="nav-item dropdown" >
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <span v-if="is_ad">Admin</span>
              </a>
              <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                <li><router-link class="nav-link" to="/">Logout</router-link></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <h3 style="display: flex; justify-content: center;align-items: center;padding-top:5%; font-weight:700">Update Theater</h3>

    <div class="form" style="display: flex; justify-content: center;align-items: center;padding-top:10px;padding-bottom:70px">
      <form @submit.prevent="submitForm">
        <div class="mb-3">
          <label class="form-label">Name</label>
          <input type="Text" class="form-control" placeholder="Name of your theater" v-model="theater.name">
        </div>

        <div class="mb-3">
          <label class="form-label">Address</label>
          <input type="Text" class="form-control" placeholder="Enter exact address" v-model="theater.address">
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

export default UpdateTheater