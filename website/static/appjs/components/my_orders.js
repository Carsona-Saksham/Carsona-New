import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const MyOrders = Vue.component('MyOrders', {
    data() {
        return {
            purchases: [],
            purchase_details: {},
            showModal: false,
            selectedPurchase: null,
            isLoading: true,
            // Pagination properties
            currentPage: 1,
            perPage: 10,
            totalOrders: 0,
            totalPages: 0,
            paginatedPurchases: []
        };
    },
    computed: {
        // Calculate pagination info
        startIndex() {
            return (this.currentPage - 1) * this.perPage;
        },
        endIndex() {
            return Math.min(this.startIndex + this.perPage, this.totalOrders);
        },
        // Generate page numbers for pagination controls
        pageNumbers() {
            const pages = [];
            const maxVisiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
            
            // Adjust startPage if we're near the end
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            return pages;
        },
        hasPrevious() {
            return this.currentPage > 1;
        },
        hasNext() {
            return this.currentPage < this.totalPages;
        }
    },
    watch: {
        // Update paginated purchases when data or page changes
        purchases: {
            handler() {
                this.updatePaginatedPurchases();
            },
            immediate: true
        },
        currentPage() {
            this.updatePaginatedPurchases();
        }
    },
    created() {
        this.loadOrderData();
    },
    activated() {
        this.loadOrderData();
    },
    methods: {
        updatePaginatedPurchases() {
            this.totalOrders = this.purchases.length;
            this.totalPages = Math.ceil(this.totalOrders / this.perPage);
            
            const start = this.startIndex;
            const end = this.endIndex;
            this.paginatedPurchases = this.purchases.slice(start, end);
        },
        // Pagination navigation methods
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                // Scroll to top of orders section
                this.$nextTick(() => {
                    const ordersContainer = document.querySelector('.orders-container');
                    if (ordersContainer) {
                        ordersContainer.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        },
        goToPrevious() {
            if (this.hasPrevious) {
                this.goToPage(this.currentPage - 1);
            }
        },
        goToNext() {
            if (this.hasNext) {
                this.goToPage(this.currentPage + 1);
            }
        },
        goToFirst() {
            this.goToPage(1);
        },
        goToLast() {
            this.goToPage(this.totalPages);
        },
        loadOrderData() {
            this.isLoading = true;
            Promise.all([
                this.fetchPurchases(),
                this.fetchPurchase_details()
            ])
            .then(() => {
                console.log('All order data loaded successfully');
            })
            .catch(error => {
                console.error('Error loading order data:', error);
            })
            .finally(() => {
                this.isLoading = false;
            });
        },
        fetchPurchases() {
            return axios.get('/api/user/purchases?t=' + new Date().getTime())
                .then(response => {
                    this.purchases = response.data.purchases;
                    console.log('Fetched Purchases:', this.purchases);
                })
                .catch(error => {
                    console.error('Error fetching purchases:', error);
                    return Promise.reject(error);
                });
        },
        fetchPurchase_details() {
            return axios.get('/api/user/purchase_details?t=' + new Date().getTime())
                .then(response => {
                    this.purchase_details = response.data.purchases;
                    console.log('Fetched Purchase Details:', this.purchase_details);
                })
                .catch(error => {
                    console.error('Error fetching purchase details:', error);
                    return Promise.reject(error);
                });
        },
        openBillingDetails(purchase) {
            this.selectedPurchase = this.purchase_details[purchase] || {};
            console.log('Selected Purchase for Billing:', this.selectedPurchase);
            console.log('Installation charges:', this.selectedPurchase.installation_charges);
            console.log('Installation charges type:', typeof this.selectedPurchase.installation_charges);
            console.log('Installation charges > 0:', this.selectedPurchase.installation_charges > 0);
            console.log('Purchase Details Object:', this.purchase_details);
            console.log('Purchase ID:', purchase);
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
            this.selectedPurchase = null;
        },
        formatDate(date) {
            if (!date) return 'N/A';
            try {
                const dateObj = new Date(date);
                if (isNaN(dateObj.getTime())) return 'N/A';
                
                const day = dateObj.getDate();
                const suffix = this.getDaySuffix(day);
                const month = dateObj.toLocaleString('en-US', { month: 'short' });
                const year = dateObj.getFullYear();
                const hours = dateObj.getHours();
                const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                const period = hours >= 12 ? 'pm' : 'am';
                const formattedHours = hours % 12 || 12;
                
                return `${formattedHours}:${minutes} ${period} on ${day}${suffix} ${month}, ${year}`;
            } catch (error) {
                console.error('Error formatting date:', error);
                return 'N/A';
            }
        },
        getDaySuffix(day) {
            if (day >= 11 && day <= 13) {
                return 'th';
            }
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        },
        formatTime(time) {
            if (!time) return 'N/A';
            try {
                // If time is already in the format "HH:MM - HH:MM", return it as is
                if (time.includes(' - ')) {
                    const [start, end] = time.split(' - ');
                    return `${this.formatHour(start)} - ${this.formatHour(end)}`;
                }
                // Otherwise, format the single time
                return this.formatHour(time);
            } catch (error) {
                console.error('Error formatting time:', error);
                return 'N/A';
            }
        },
        formatHour(time) {
            if (!time) return 'N/A';
            try {
                const [hours, minutes] = time.split(':');
                const hour = parseInt(hours, 10);
                const period = hour >= 12 ? 'pm' : 'am';
                const formattedHour = hour % 12 || 12;
                return `${formattedHour}:${minutes || '00'} ${period}`;
            } catch (error) {
                console.error('Error formatting hour:', error);
                return time;
            }
        },
        formatSlotDate(slotDate, slotTime) {
            if (!slotDate) return 'N/A';
            try {
                const dateObj = new Date(slotDate);
                if (isNaN(dateObj.getTime())) return 'N/A';
                
                const day = dateObj.getDate();
                const suffix = this.getDaySuffix(day);
                const month = dateObj.toLocaleString('en-US', { month: 'short' });
                const year = dateObj.getFullYear();
                
                const formattedDate = `${day}${suffix} ${month}, ${year}`;
                const formattedTime = this.formatTime(slotTime);
                
                return `${formattedDate} at ${formattedTime}`;
            } catch (error) {
                console.error('Error formatting slot date:', error);
                return 'N/A';
            }
        },
        
        // Order status progression methods
        getStatusSteps() {
            return [
                { key: 'Order Placed', label: 'Order Placed', icon: '📝', description: 'Your order has been received' },
                { key: 'In Production', label: 'In Production', icon: '🧵', description: 'Your seat covers are being stitched' },
                { key: 'Out for Delivery', label: 'Out for Delivery', icon: '🚚', description: 'Your order is on the way' },
                { key: 'Order Completed', label: 'Delivered', icon: '✅', description: 'Your order has been delivered' }
            ];
        },
        getCurrentStatusIndex(status) {
            const steps = this.getStatusSteps();
            return steps.findIndex(step => step.key === status);
        },
        
        getStatusColor(status) {
            switch(status) {
                case 'Order Placed': return '#007bff';
                case 'In Production': return '#ffc107';
                case 'Out for Delivery': return '#28a745';
                case 'Order Completed': return '#28a745';
                default: return '#6c757d';
            }
        },
        checkForRefresh() {
            // Parse URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const refreshParam = urlParams.get('refresh');
            
            // If refresh parameter is present, reload data
            if (refreshParam) {
                console.log('Refresh parameter detected, reloading data...');
                this.loadOrderData();
                
                // Remove the parameter from the URL without reloading the page
                const newUrl = window.location.pathname + window.location.hash.split('?')[0];
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    },
    mounted() {
        this.checkForRefresh();
    },
    updated() {
        this.checkForRefresh();
    },
    template: `
        <div class="container-mycars orders-container">
            <link rel="stylesheet" href="/static/my_orders_overrides.css">
            <!-- Navigation Bar -->
             <nav class="navbar-userhome">
                <!--<div class="container-fluid">-->
                    <router-link to="/seat-covers" class="navbar-brand-userhome" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
                    <!--<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>-->
                    <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
                        <div class="nav-item">
                            <router-link class="nav-link white-text" to="/seat-covers">Back</router-link>
                        </div>
                        <ul class="navbar-nav navbar-nav mr-auto">
                            
                            <li class="nav-item dropdown">
                                <a class="dropdown-toggle white-text" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    User
                                </a>
                                <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                                    <li><router-link class="nav-link" to="/login">Logout</router-link></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
               <!-- </div> -->
            </nav>

            <!-- Orders Content -->
            <div class="orders-container">
                <h1>My Orders</h1>
                
                <!-- Loading indicator -->
                <div v-if="isLoading" class="loading-container">
                    <div class="spinner"></div>
                    <p>Loading your orders...</p>
                </div>
                
                <!-- Orders list with pagination -->
                <div v-else-if="purchases.length > 0">
                    <!-- Orders Grid -->
                    <div class="order-list">
                        <div v-for="purchase in paginatedPurchases" :key="purchase.id" class="order-card">
                            <div class="order-details-grid">
                                <img :src="purchase_details[purchase.id]?.product_poster" alt="Product Image" class="order-details-image">
                                <div class="order-details-info">
                                    <h3>{{ purchase_details[purchase.id]?.product_name }}</h3>
                                    <p v-if="purchase.variant_name" class="variant-info">
                                        <strong>Variant:</strong> {{ purchase.variant_name }}
                                    </p>
                                    <p><strong>Placed On:</strong> {{ formatDate(purchase_details[purchase.id]?.created_at) }}</p>
                                    <p><strong>Delivery Address:</strong> {{ purchase_details[purchase.id]?.address }}</p>
                                    <div v-if="purchase_details[purchase.id]">
                                        <p><strong>Consumer:</strong> {{ purchase_details[purchase.id].consumer_name }} | {{ purchase_details[purchase.id].consumer_phone }}</p>
                                        <p><strong>Slot:</strong> {{ purchase.slot_date ? formatSlotDate(purchase.slot_date, purchase.slot_time) : 'N/A' }}</p>
                                    </div>
                                    
                                    <div class="order-status-section">
                                        <div class="current-status">
                                            
                                                <div class="status-timeline">
                                                    <div v-for="(step, index) in getStatusSteps()" :key="step.key" class="status-step" :class="{ 'completed': index < getCurrentStatusIndex(purchase.status), 'active': index === getCurrentStatusIndex(purchase.status) }">
                                                        <div class="status-circle">{{ step.icon }}</div>
                                                        <div class="status-label">{{ step.label }}</div>
                                                    </div>
                                                </div>
        
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                            <button @click="openBillingDetails(purchase.id)" class="billing-button">Billing Details</button>
                        </div>
                    </div>
                    
                    <!-- Pagination Controls -->
                    <div v-if="totalPages > 1" class="pagination-container">
                        <!-- Pagination Info -->
                        <div class="pagination-info">
                            <p>Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalOrders }} orders</p>
                        </div>
                        
                        <div class="pagination-controls">
                            <!-- First Page -->
                            <button 
                                @click="goToFirst" 
                                :disabled="!hasPrevious"
                                class="pagination-btn"
                                title="First Page"
                            >
                                &laquo;
                            </button>
                            
                            <!-- Previous Page -->
                            <button 
                                @click="goToPrevious" 
                                :disabled="!hasPrevious"
                                class="pagination-btn"
                                title="Previous Page"
                            >
                                &lsaquo;
                            </button>
                            
                            <!-- Page Numbers -->
                            <button 
                                v-for="page in pageNumbers" 
                                :key="page"
                                @click="goToPage(page)"
                                :class="['pagination-btn', { 'active': page === currentPage }]"
                            >
                                {{ page }}
                            </button>
                            
                            <!-- Next Page -->
                            <button 
                                @click="goToNext" 
                                :disabled="!hasNext"
                                class="pagination-btn"
                                title="Next Page"
                            >
                                &rsaquo;
                            </button>
                            
                            <!-- Last Page -->
                            <button 
                                @click="goToLast" 
                                :disabled="!hasNext"
                                class="pagination-btn"
                                title="Last Page"
                            >
                                &raquo;
                            </button>
                        </div>
                        
                        <!-- Page Info -->
                        <div class="pagination-info-bottom">
                            <span>Page {{ currentPage }} of {{ totalPages }}</span>
                        </div>
                    </div>
                </div>
                
                <!-- No orders message -->
                <div v-else class="no-orders-message">
                    <h2>You have no orders yet.</h2>
                    <p>When you make a purchase, it will appear here.</p>
                    <router-link to="/seat-covers" class="shop-now-button">Start Shopping</router-link>
                </div>
            </div>

            <!-- Billing Details Modal -->
            <div v-if="showModal" class="modal" @click.self="closeModal">
                <div class="modal-dialog_orders" role="document">
                    <div class="modal-content_orders">
                        <div class="modal-header">
                            <h5 class="modal-title_orders">Bill Details</h5>
                            <button type="button" class="close_orders" @click="closeModal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body_orders">
                            <!-- Product and variant info -->
                            <div class="product-variant-info">
                                <h6>{{ selectedPurchase && selectedPurchase.product_name }}</h6>
                                <p v-if="selectedPurchase && selectedPurchase.variant_name" class="variant-badge">
                                    {{ selectedPurchase.variant_name }} variant
                                </p>
                            </div>
                            
                            <div class="flex d-md-flex items-center">
                                <p class="text-xl font-semibold mt-2 text-gray-500" style="margin-right: 250px"><strong>Item Price</strong></p>
                                <div class="ml-4" style="margin-left: 10px; display: flex; align-items: center; gap: 8px;">
                                    <span v-if="selectedPurchase && selectedPurchase.product_original_price !== selectedPurchase.product_final_price" class="text-xl text-gray-500" style="text-decoration: line-through;">₹{{ selectedPurchase.product_original_price.toFixed(2) }}</span>
                                    <span class="product-price text-2xl font-bold">₹{{ selectedPurchase.product_final_price.toFixed(2) }}</span>
                                </div>
                            </div>
                            
                            <!-- Show coupon discount if applied -->
                            <div v-if="selectedPurchase && selectedPurchase.coupon_applied" class="flex d-md-flex items-center">
                                <p class="text-xl font-semibold mt-2 text-gray-500" style="margin-right: 200px">
                                    <strong>Coupon Applied ({{ selectedPurchase.coupon_applied }})</strong>
                                </p>
                                <p class="product-price text-2xl font-bold ml-4" style="margin-left: 10px; color: #28a745;">
                                    -₹{{ selectedPurchase.discount_amount.toFixed(2) }}
                                </p>
                            </div>
                            
                            <!-- Show regular product discount if applicable and no coupon -->
                            <div v-else-if="selectedPurchase && selectedPurchase.discount_amount > 0" class="flex d-md-flex items-center" style="color: #28a745;">
                                <p class="text-xl font-semibold mt-2 text-success" style="margin-right: 290px">
                                    <strong>Discount</strong>
                                </p>
                                <p class="product-price text-2xl font-bold ml-4 text-success" style="margin-left: 10px">
                                    -₹{{ selectedPurchase.discount_amount.toFixed(2) }}
                                </p>
                            </div>
                            
                            <div class="flex d-md-flex items-center">
                                <p v-if="selectedPurchase && selectedPurchase.sgst !== undefined" class="text-xl font-semibold mt-2 text-gray-500" style="margin-right: 325px"><strong>SGST</strong></p>
                                <p v-if="selectedPurchase && selectedPurchase.sgst !== undefined" class="product-price text-2xl font-bold ml-4" style="margin-left: 10px"> ₹{{ selectedPurchase.sgst.toFixed(2) }}</p>
                            </div>
                            <div class="flex d-md-flex items-center">
                                <p v-if="selectedPurchase && selectedPurchase.cgst !== undefined" class="text-xl font-semibold mt-2 text-gray-500" style="margin-right: 325px"><strong>CGST</strong></p>
                                <p v-if="selectedPurchase && selectedPurchase.cgst !== undefined" class="product-price text-2xl font-bold ml-4" style="margin-left: 10px"> ₹{{ selectedPurchase.cgst.toFixed(2) }}</p>
                            </div>
                            <div class="flex d-md-flex items-center">
                                <p v-if="selectedPurchase && selectedPurchase.delivery_charges !== undefined" class="text-xl font-semibold mt-2 text-gray-500" style="margin-right: 250px"><strong>Delivery Charges</strong></p>
                                <div v-if="selectedPurchase && selectedPurchase.delivery_charges !== undefined" class="ml-4" style="margin-left: 10px; display: flex; align-items: center; gap: 8px;">
                                    <span v-if="selectedPurchase.delivery_discount > 0" class="text-xl text-gray-500" style="text-decoration: line-through;">₹{{ selectedPurchase.original_delivery_charges.toFixed(2) }}</span>
                                    <span class="product-price text-2xl font-bold">₹{{ selectedPurchase.delivery_charges.toFixed(2) }}</span>
                                </div>
                            </div>
                            <div v-if="selectedPurchase && (selectedPurchase.installation_charges > 0 || selectedPurchase.original_installation_charges > 0)" class="flex d-md-flex items-center">
                                <p class="text-xl font-semibold mt-2 text-gray-500" style="margin-right: 230px"><strong>Installation Charges</strong></p>
                                <div class="ml-4" style="margin-left: 10px; display: flex; align-items: center; gap: 8px;">
                                    <span v-if="selectedPurchase.installation_discount > 0" class="text-xl text-gray-500" style="text-decoration: line-through;">₹{{ selectedPurchase.original_installation_charges.toFixed(2) }}</span>
                                    <span class="product-price text-2xl font-bold">₹{{ selectedPurchase.installation_charges.toFixed(2) }}</span>
                                </div>
                            </div>
                            <div v-if="selectedPurchase && (selectedPurchase.total_amount !== undefined)" class="flex d-md-flex items-center total-amount-row">
                                <p class="text-xl font-semibold mt-2 text-gray-500" style="margin-right: 230px">Total Amount</p>
                                <p class="product-price text-3xl font-bold ml-4" style="margin-left: 10px"> ₹{{ selectedPurchase.total_amount.toFixed(2) }}</p>
                            </div>
                            
                            <!-- Summary message showing total savings -->
                            <div v-if="selectedPurchase && (selectedPurchase.discount_amount > 0 || selectedPurchase.delivery_discount > 0 || selectedPurchase.installation_discount > 0)" class="mt-4 p-3 savings-highlight">
                                <p>
                                    You saved ₹{{ ((selectedPurchase.discount_amount || 0) + (selectedPurchase.delivery_discount || 0) + (selectedPurchase.installation_discount || 0)).toFixed(2) }} on this order!
                                </p>
                            </div>
                        </div>
                        <div class="modal-footer_orders">
                            <button type="button" class="btn btn-secondary_orders" @click="closeModal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>  
    `
});

export default MyOrders; 