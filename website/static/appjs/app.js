import router from "./router.js"
import AuthState from "./authState.js"

const a = new Vue({
    el : "#app",
    delimiters: ['${','}'],
    router: router,
    data: {

    },
    methods: {

    },
    mounted() {
        // Initialize and check auth state on app startup
        console.log('🚀 Main app mounted, checking auth state...');
        AuthState.checkAuthState();
    }
})