import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const AdminOrders = Vue.component('AdminOrders', {
    data() {
        return {
            orders: [],
            user: {
                isAdmin: localStorage.getItem('is_admin') === 'true' ? true : false,
                name: localStorage.getItem('name'),
            },
            selectedOrder: null,
            showBillingModal: false,
        };
    },
    created() {
        this.fetchOrders();
    },
    methods: {
        fetchOrders() {
            axios.get('/api/admin/orders', {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token') 
                }
            })
            .then(response => {
                this.orders = response.data.orders;
                console.log('Fetched Orders:', this.orders);
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
            });
        },
        updateOrderStatus(orderId, newStatus) {
            axios.post(`/api/admin/orders/${orderId}/status`, { status: newStatus }, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('access_token') 
                }
            })
            .then(response => {
                this.fetchOrders(); // Refresh orders
            })
            .catch(error => {
                console.error('Error updating order status:', error);
            });
        },
        openBillingDetails(order) {
            this.selectedOrder = order;
            this.showBillingModal = true;
        },
        closeBillingModal() {
            this.showBillingModal = false;
            this.selectedOrder = null;
        },
        getStatusButtonText(status) {
            switch(status) {
                case 'Order Placed': return 'Accept Order';
                case 'In Production': return 'Out for Delivery';
                case 'Out for Delivery': return 'Complete Order';
                default: return 'Completed';
            }
        },
        getNextStatus(status) {
            switch(status) {
                case 'Order Placed': return 'In Production';
                case 'In Production': return 'Out for Delivery';
                case 'Out for Delivery': return 'Order Completed';
                default: return status;
            }
        },
        getStatusButtonClass(status) {
            switch(status) {
                case 'Order Placed': return 'btn btn-primary';
                case 'In Production': return 'btn btn-warning';
                case 'Out for Delivery': return 'btn btn-success';
                default: return 'btn btn-secondary';
            }
        }
    },
    template: `
    <div>
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <div class="container-fluid">
                <router-link to="/home" class="navbar-brand" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse d-md-flex justify-content-md-end" id="navbarNavDropdown">
                    <ul class="navbar-nav navbar-nav mr-auto">
                        <div v-if="user.isAdmin" class="admin-links">
                            <li class="nav-item">
                                <router-link to="/home" class="nav-link">Back</router-link>
                            </li>
                        </div>
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                {{ user.isAdmin ? 'Admin' : 'User' }}
                            </a>
                            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                                <li><router-link to="/login" class="nav-link">Logout</router-link></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

        <div class="orders-container">
            <h2 class="page-title">All Orders</h2>
            
            <div v-if="orders.length > 0" class="order-list">
                <div v-for="order in orders" :key="order.id" class="order-card">
                    <img :src="order.product_poster" alt="Product Image" class="order-image">
                    <div class="order-info">
                        <h3>{{ order.product_name }}</h3>
                        <p><strong>Customer:</strong> {{ order.consumer_name }}</p>
                        <p><strong>Phone:</strong> {{ order.consumer_phone }}</p>
                        <p><strong>Address:</strong> {{ order.address }}</p>
                        <p><strong>Order Date:</strong> {{ new Date(order.created_at).toLocaleDateString() }}</p>
                        <p><strong>Slot Date:</strong> {{ order.slot_date ? new Date(order.slot_date).toLocaleDateString() : 'N/A' }}</p>
                        <p><strong>Slot Time:</strong> {{ order.slot_time || 'N/A' }}</p>
                        <p><strong>Status:</strong> <span class="status-badge">{{ order.status }}</span></p>
                    </div>
                    <div class="order-actions-admin">
                        <button @click="openBillingDetails(order)" class="billing-btn">
                            View Details
                        </button>
                        <button 
                            v-if="order.status !== 'Order Completed'" 
                            @click="updateOrderStatus(order.id, getNextStatus(order.status))" 
                            :class="getStatusButtonClass(order.status)"
                            style="margin-top: 10px;">
                            {{ getStatusButtonText(order.status) }}
                        </button>
                    </div>
                </div>
            </div>
            
            <div v-else class="text-center" style="margin-top: 50px;">
                <h3>No orders found</h3>
                <p>There are currently no orders to display.</p>
            </div>
        </div>

        <!-- Billing Details Modal -->
        <div v-if="showBillingModal" class="modal_orders">
            <div class="modal-dialog_orders">
                <div class="modal-content_orders">
                    <div class="modal-header_orders">
                        <h5 class="modal-title_orders">Order Details</h5>
                        <span class="close_orders" @click="closeBillingModal">&times;</span>
                    </div>
                    <div class="modal-body_orders" v-if="selectedOrder">
                        <div style="display: flex; align-items: center; margin-bottom: 20px;">
                            <img :src="selectedOrder.product_poster" alt="Product Image" class="purchase-image">
                            <div>
                                <h4>{{ selectedOrder.product_name }}</h4>
                                <p><strong>Status:</strong> {{ selectedOrder.status }}</p>
                            </div>
                        </div>
                        
                        <div class="billing-details">
                            <h5>Customer Information</h5>
                            <p><strong>Name:</strong> {{ selectedOrder.consumer_name }}</p>
                            <p><strong>Phone:</strong> {{ selectedOrder.consumer_phone }}</p>
                            <p><strong>Address:</strong> {{ selectedOrder.address }}</p>
                            
                            <h5 style="margin-top: 20px;">Order Information</h5>
                            <p><strong>Order Date:</strong> {{ new Date(selectedOrder.created_at).toLocaleDateString() }}</p>
                            <p><strong>Delivery Date:</strong> {{ selectedOrder.slot_date ? new Date(selectedOrder.slot_date).toLocaleDateString() : 'N/A' }}</p>
                            <p><strong>Delivery Time:</strong> {{ selectedOrder.slot_time || 'N/A' }}</p>
                            
                            <div v-if="selectedOrder.product_original_price" style="margin-top: 20px;">
                                <h5>Billing Details</h5>
                                <p><strong>Original Price:</strong> ₹{{ selectedOrder.product_original_price?.toFixed(2) || '0.00' }}</p>
                                <p><strong>Final Price:</strong> ₹{{ selectedOrder.product_final_price?.toFixed(2) || '0.00' }}</p>
                                <p><strong>CGST:</strong> ₹{{ selectedOrder.cgst?.toFixed(2) || '0.00' }}</p>
                                <p><strong>SGST:</strong> ₹{{ selectedOrder.sgst?.toFixed(2) || '0.00' }}</p>
                                <p><strong>Delivery Charges:</strong> ₹{{ selectedOrder.delivery_charges?.toFixed(2) || '0.00' }}</p>
                                <p v-if="selectedOrder.installation_charges > 0"><strong>Installation Charges:</strong> ₹{{ selectedOrder.installation_charges?.toFixed(2) || '0.00' }}</p>
                                <p v-if="selectedOrder.coupon_applied"><strong>Coupon Applied:</strong> {{ selectedOrder.coupon_applied }}</p>
                                <p v-if="selectedOrder.discount_amount > 0"><strong>Discount:</strong> -₹{{ selectedOrder.discount_amount?.toFixed(2) || '0.00' }}</p>
                                <hr>
                                <p><strong>Total Amount:</strong> ₹{{ selectedOrder.total_amount?.toFixed(2) || '0.00' }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer_orders">
                        <button @click="closeBillingModal" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
});

export default AdminOrders; 