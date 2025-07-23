import AddTheater from "./components/add_theater.js"
import AddBrands from "./components/add_brands.js"
import AddCategories from "./components/add_categories.js"
import AddShow from "./components/add_shows.js"
import BookTickets from "./components/book_ticket.js"
import Login from "./components/login.js"
import Movies from "./components/movies.js"
import MyTheaters from "./components/my_theater.js"
import MyCars from "./components/my_cars.js"
import SelectTheater from "./components/select_theaters.js"
import Signup from "./components/signup.js"
import UpdateShow from "./components/update_show.js"
import UpdateTheater from "./components/update_theatre.js"
import UpdateCategory from "./components/update_categories.js"
import Home from "./components/admin_home.js"
import UserHome  from "./components/user_home.js"
import car_brands from "./components/car_brand.js"
import SeatCovers from "./components/seat_covers.js"
import AddSeatCovers from "./components/add_seat_covers.js"
import UpdateSeatCover from "./components/update_seat_cover.js"
import SeatCoverDetails from "./components/seat_cover_details.js"
import AddCoupons from './components/add_coupons.js'
import Coupons from './components/coupons.js'
import EditCoupon from './components/edit_coupon.js'
import MyOrders from './components/my_orders.js'
import AdminOrders from "./components/admin_orders.js"
import Batteries from "./components/batteries.js"
import AddBatteries from "./components/add_batteries.js"
import CarTires from "./components/car_tires.js"
import SteeringCovers from "./components/steering_covers.js"
import Payment from "./components/payment.js"
import { track } from "./analytics.js"



const routes = [
    {
      path: "/sign_up",
      component: Signup,
      name: 'signup'
    },
    {
        path: "/car_brands",
        component: car_brands,
        name: 'car_brands'
    },
    {
        path: "/seat-covers",
        component: SeatCovers,
        name: 'SeatCovers'
    },
    {
        path: "/Seat Covers", // Keep old path for backward compatibility
        redirect: "/seat-covers"
    },
    {
        path: "/add_seatcovers",
        component: AddSeatCovers,
        name: 'AddSeatCovers'
    },
    {
        path: "/update_seatcover/:id",
        component: UpdateSeatCover,
        name: 'UpdateSeatCover'
    },
    {
        path: "/home",
        component: Home,
        name: 'adminhome'
      },
      {
        path: "/user_home",
        component: UserHome,
        name: 'userhome'
      },
    {
        path: "/my_theaters",
        component: MyTheaters,
        name: 'MyTheaters'
    },
    {
        path: "/add_theaters",
        component: AddTheater,
        name: 'AddTheater'
    },
    {
        path: "/add_brands",
        component: AddBrands,
        name: 'AddBrands'
    },
    {
        path: "/add_shows",
        component: AddShow,
        name: 'Add'
    },
    {
        path: "/movies",
        component: Movies,
        name: 'Movies'
    },
    {
        path: "/add_category",
        component: AddCategories,
        name: 'AddCategories'
    },
    {
        path: "/update_theatre/:id",
        component: UpdateTheater,
        name: 'UpdateTheater',
        props: true
    },
    {
        path: "/update_show/:id",
        component: UpdateShow,
        name: 'UpdateShow',
        props: true
    },
    {
        path: "/update_categories/:id",
        component: UpdateCategory,
        name: 'UpdateCategory',
        props: true
    },
    {
        path: "/select_theaters/:id",
        component: SelectTheater,
        name: 'SelectTheater',
        props: true
    },
    {
        path: "/book_ticket/:id",
        component: BookTickets,
        name: 'BookTickets',
        props: true
    },
    {
        path: "/my_cars",
        component: MyCars,
        name: 'MyCars',
        props: true
    },
    {
        path: "/",
        component: car_brands,
    },
    {
        path: "/login",
        component: Login,
    },
    {
        path: "/seat_cover/:id",
        component: SeatCoverDetails,
        name: 'SeatCoverDetails',
        props: true
    },
    {
        path: '/add-coupons',
        component: AddCoupons,
        name: 'AddCoupons'
    },
    {
        path: '/coupons',
        component: Coupons,
        name: 'Coupons'
    },
    {
        path: '/edit-coupon/:id',
        component: EditCoupon,
        name: 'EditCoupon'
    },
    {
        path: '/my_orders',
        component: MyOrders,
        name: 'MyOrders'
    },
    {
        path: '/admin/orders',
        component: AdminOrders,
        name: 'AdminOrders'
    },
    {
        path: "/batteries",
        component: Batteries,
        name: 'Batteries'
    },
    {
        path: "/add_batteries",
        component: AddBatteries,
        name: 'AddBatteries'
    },
    {
        path: "/car_tires",
        component: CarTires,
        name: 'CarTires'
    },
    {
        path: "/Car Tiers",
        component: CarTires,
        name: 'CarTiers'
    },
    {
        path: "/steering_covers",
        component: SteeringCovers,
        name: 'SteeringCovers'
    },
    {
        path: "/Steering Covers",
        component: SteeringCovers,
        name: 'SteeringCoversSpaced'
    },
    {
        path: "/payment",
        component: Payment,
        name: 'Payment'
    }
]

const router = new VueRouter({
    mode: 'history',
    routes
})

// Track every route change as a page_view event
router.afterEach((to) => {
    track('page_view', { path: to.fullPath });
});

export default router;