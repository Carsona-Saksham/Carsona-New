import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';

const Payment = Vue.component('Payment', {
    data() {
        return {
            isProcessing: false,
            paymentData: null,
            purchaseData: null,
            razorpayLoaded: false,
            razorpayKeyId: null
        };
    },
    created() {
        // Get payment data from route params or localStorage
        this.paymentData = this.$route.params.paymentData || JSON.parse(localStorage.getItem('paymentData') || '{}');
        this.purchaseData = this.$route.params.purchaseData || JSON.parse(localStorage.getItem('purchaseData') || '{}');
        
        // Load Razorpay configuration and script
        this.loadRazorpayConfig();
    },
    methods: {
        async loadRazorpayConfig() {
            try {
                // Get Razorpay configuration
                const configResponse = await axios.get('/api/razorpay_config');
                this.razorpayKeyId = configResponse.data.key_id;
                
                // Load Razorpay script
                this.loadRazorpayScript();
            } catch (error) {
                console.error('Error loading Razorpay config:', error);
                alert('Failed to load payment configuration. Please try again.');
            }
        },
        
        loadRazorpayScript() {
            if (window.Razorpay) {
                this.razorpayLoaded = true;
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                this.razorpayLoaded = true;
            };
            script.onerror = () => {
                alert('Failed to load payment gateway. Please try again.');
            };
            document.head.appendChild(script);
        },
        
        async initiatePayment() {
            if (!this.razorpayLoaded) {
                alert('Payment gateway is still loading. Please wait.');
                return;
            }
            
            this.isProcessing = true;
            
            try {
                // Create Razorpay order
                const orderResponse = await axios.post('/api/create_razorpay_order', {
                    amount: parseFloat(this.paymentData.totalAmount),
                    currency: 'INR'
                });
                
                const { order_id, amount, currency, fallback, emergency } = orderResponse.data;
                
                // Show user feedback for fallback orders
                if (emergency) {
                    alert('Payment system is temporarily experiencing issues. Please try again later or contact support.');
                    this.isProcessing = false;
                    return;
                } else if (fallback) {
                    console.log('Using fallback payment order due to payment gateway issues');
                    // Continue with fallback order - user doesn't need to know
                }
                
                // Configure Razorpay options
                const options = {
                    key: this.razorpayKeyId,
                    amount: amount,
                    currency: currency,
                    name: 'Carsona',
                    description: `Payment for ${this.paymentData.productName}`,
                    order_id: order_id,
                    handler: (response) => {
                        this.handlePaymentSuccess(response);
                    },
                    prefill: {
                        name: this.paymentData.customerName,
                        email: this.paymentData.customerEmail,
                        contact: this.paymentData.customerPhone
                    },
                    theme: {
                        color: '#0056b3'
                    },
                    modal: {
                        ondismiss: () => {
                            this.handlePaymentFailure('Payment cancelled by user');
                        }
                    }
                };
                
                // Open Razorpay checkout
                const razorpay = new window.Razorpay(options);
                razorpay.open();
                
            } catch (error) {
                console.error('Error initiating payment:', error);
                
                // Provide more specific error messages
                let errorMessage = 'Failed to initiate payment. Please try again.';
                
                if (error.response) {
                    // Server responded with error
                    const status = error.response.status;
                    const data = error.response.data;
                    
                    if (status === 401) {
                        errorMessage = 'Please log in again to continue with payment.';
                    } else if (status === 503) {
                        errorMessage = 'Payment system is temporarily unavailable. Please try again in a few minutes.';
                    } else if (data && data.error) {
                        errorMessage = `Payment error: ${data.error}`;
                    }
                } else if (error.request) {
                    // Network error
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                } else {
                    // Other error
                    errorMessage = 'An unexpected error occurred. Please try again.';
                }
                
                alert(errorMessage);
                this.isProcessing = false;
            }
        },
        
        async handlePaymentSuccess(response) {
            try {
                // Verify payment with backend
                const verificationResponse = await axios.post('/api/verify_payment', {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    purchase_data: this.purchaseData
                });
                
                // Clear stored data
                localStorage.removeItem('paymentData');
                localStorage.removeItem('purchaseData');
                
                // Redirect immediately to orders page
                this.$router.push('/my_orders?refresh=' + new Date().getTime());
                
            } catch (error) {
                console.error('Payment verification failed:', error);
                alert('Payment verification failed. Please contact support.');
                this.isProcessing = false;
            }
        },


        
        handlePaymentFailure(error) {
            console.error('Payment failed:', error);
            alert('Payment failed. Please try again.');
            this.isProcessing = false;
        },
        
        goBack() {
            this.$router.go(-1);
        }
    },
    template: `
        <div class="razorpay-payment-container">
            <!-- Include the CSS fix file -->
            <link rel="stylesheet" href="/static/seat_cover_fixes.css">
            
            <nav class="navbar-userhome">
                                    <router-link class="navbar-brand-userhome" to="/seat-covers" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
                <div class="collapse navbar-collapse d-md-flex justify-content-md-end">
                    <div class="nav-item">
                        <router-link class="nav-link white-text" to="/seat-covers">Home</router-link>
                    </div>
                    <div class="nav-item">
                        <router-link class="nav-link white-text" to="/my_orders">My Orders</router-link>
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
            </nav>
            
            <!-- Progress Indicator -->
            <div class="razorpay-progress-container">
                <div class="razorpay-progress-bar">
                    <div class="razorpay-progress-step completed">
                        <div class="razorpay-step-circle">✓</div>
                        <span>Product Selection</span>
                    </div>
                    <div class="razorpay-progress-line completed"></div>
                    <div class="razorpay-progress-step completed">
                        <div class="razorpay-step-circle">✓</div>
                        <span>Address & Slot</span>
                    </div>
                    <div class="razorpay-progress-line active"></div>
                    <div class="razorpay-progress-step active">
                        <div class="razorpay-step-circle">3</div>
                        <span>Payment</span>
                    </div>
                    <div class="razorpay-progress-line"></div>
                    <div class="razorpay-progress-step">
                        <div class="razorpay-step-circle">4</div>
                        <span>Confirmation</span>
                    </div>
                </div>
            </div>
            
            <div class="razorpay-payment-content">
                <div class="razorpay-main-container">
                    <!-- Left Side: Order Summary -->
                    <div class="razorpay-order-details">
                        <div class="razorpay-order-card">
                            <div class="razorpay-card-header">
                                <h3>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    Order Summary
                                </h3>
                            </div>
                            
                            <div class="razorpay-order-content" v-if="paymentData">
                                <div class="razorpay-product-info">
                                    <div class="razorpay-product-icon">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7M3 7L12 2L21 7M3 7L12 12M21 7L12 12M12 12V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <div class="razorpay-product-details">
                                        <h4>{{ paymentData.productName }}</h4>
                                        <p v-if="paymentData.variantName" class="razorpay-variant">{{ paymentData.variantName }} Variant</p>
                                    </div>
                                </div>
                                
                                <div class="razorpay-customer-info">
                                    <h5>Delivery Details</h5>
                                    <div class="razorpay-info-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <span>{{ paymentData.customerName }}</span>
                                    </div>
                                    <div class="razorpay-info-item" v-if="paymentData.customerPhone">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.59531 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <span>{{ paymentData.customerPhone }}</span>
                                    </div>
                                    <div class="razorpay-info-item" v-if="paymentData.deliveryAddress">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <div class="razorpay-address-text">{{ paymentData.deliveryAddress }}</div>
                                    </div>
                                    <div class="razorpay-info-item" v-if="paymentData.slotDate && paymentData.slotTime">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        <span>{{ paymentData.slotDate }} at {{ paymentData.slotTime }}</span>
                                    </div>
                                </div>
                                
                                <div class="razorpay-price-breakdown">
                                    <div class="razorpay-total-amount">
                                        <span>Total Amount</span>
                                        <span class="razorpay-amount">₹{{ paymentData.totalAmount }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Side: Payment Section -->
                    <div class="razorpay-payment-section">
                        <div class="razorpay-payment-card">
                            <div class="razorpay-payment-header">
                                <div>
                                    <h2>Secure Payment</h2>
                                    <p>Complete your purchase safely with Razorpay</p>
                                </div>
                            </div>
                            
                            <div class="razorpay-payment-methods">
                                <h4>Accepted Payment Methods</h4>
                                <div class="razorpay-methods-grid">
                                    <div class="razorpay-method-item">
                                        <div class="razorpay-method-icon">💳</div>
                                        <span>Credit/Debit Cards</span>
                                    </div>
                                    <div class="razorpay-method-item">
                                        <div class="razorpay-method-icon">📱</div>
                                        <span>UPI</span>
                                    </div>
                                    <div class="razorpay-method-item">
                                        <div class="razorpay-method-icon">🏦</div>
                                        <span>Net Banking</span>
                                    </div>
                                    <div class="razorpay-method-item">
                                        <div class="razorpay-method-icon">💰</div>
                                        <span>Wallets</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="razorpay-payment-actions">
                                <button 
                                    @click="initiatePayment" 
                                    :disabled="isProcessing || !razorpayLoaded"
                                    class="razorpay-payment-btn"
                                >
                                    <svg v-if="!isProcessing && razorpayLoaded" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <span v-if="isProcessing">Processing Payment...</span>
                                    <span v-else-if="!razorpayLoaded">Loading Payment Gateway...</span>
                                    <span v-else>Pay ₹{{ paymentData.totalAmount }} Securely</span>
                                </button>
                                
                                <button @click="goBack" class="razorpay-btn-secondary">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    Go Back
                                </button>
                            </div>
                            
                            <div class="razorpay-payment-security">
                                <div class="razorpay-security-header">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22S8 18 8 13V6L12 4L16 6V13C16 18 12 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <h5>Your Payment is Protected</h5>
                                </div>
                                <div class="razorpay-security-features">
                                    <div class="razorpay-security-item">
                                        <span class="razorpay-security-badge">🔒</span>
                                        <span>256-bit SSL Encryption</span>
                                    </div>
                                    <div class="razorpay-security-item">
                                        <span class="razorpay-security-badge">🛡️</span>
                                        <span>PCI DSS Compliant</span>
                                    </div>
                                    <div class="razorpay-security-item">
                                        <span class="razorpay-security-badge">✅</span>
                                        <span>No Card Details Stored</span>
                                    </div>
                                </div>
                                <p class="razorpay-security-text">
                                    Your payment information is encrypted and processed securely. 
                                    We never store your card details on our servers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
});

export default Payment; 