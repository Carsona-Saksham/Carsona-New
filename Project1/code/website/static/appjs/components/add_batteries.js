import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const AddBatteries = Vue.component('AddBatteries', {
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
                  <router-link class="nav-link" to="/batteries">Batteries</router-link>
                </li>
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Admin
                  </a>
                  <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li><router-link class="nav-link" to="/">Logout</router-link></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <h3 class="text-center font-weight-bold mt-5">Add Battery</h3>
        <div class="form d-flex justify-content-center align-items-center pb-5">
          <form @submit.prevent="addBattery">
            <div class="mb-3">
              <label class="form-label">Name</label>
              <input type="text" class="form-control" v-model="newBattery.name" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Price</label>
              <input type="number" class="form-control" v-model.number="newBattery.price" min="0" step="1" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Discount</label>
              <input type="number" class="form-control" v-model.number="newBattery.discount" min="0" step="1" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Poster</label>
              <input type="file" class="form-control" accept="image/*" @change="handleFileSelect" />
            </div>
            <button type="submit" class="btn btn-primary">Add Battery</button>
          </form>
        </div>

        <footer class="footer">
          <div class="footer__addr">
            <h1 class="footer__logo"><h2 class="logo-text"><img class="logo footer_logo" src="../static/logo.png">Carsona</h2></h1>
          </div>

          <ul class="footer__nav">
            <li class="nav__item">
              <h2 class="nav__title"><i class="fa-solid fa-phone"></i> Call 24x7</h2>
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
            <p>&copy; 2019 All rights reserved.</p>
          </div>
        </footer>
      </div>
    `,
    data() {
      return {
        newBattery: {
          name: '',
          price: 0,
          discount: 0,
          poster: ''
        }
      };
    },
    methods: {
      handleFileSelect(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          this.newBattery.poster = reader.result;
        };
        reader.readAsDataURL(file);
      },
      addBattery() {
        axios.post('/api/add_batteries', this.newBattery, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('access_token') 
          }
        })
        .then(response => {
          console.log('Battery added:', response.data);
          this.$router.push('/batteries');
        })
        .catch(error => {
          console.error('Error adding battery:', error);
        });
      }
    }
});

export default AddBatteries; 