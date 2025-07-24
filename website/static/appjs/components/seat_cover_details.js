import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import AuthState from '../authState.js';

const SeatCoverDetails = Vue.component('SeatCoverDetails', {
    data() {
        return {
            seatCover: {},
            selectedVariant: null, // Track the selected variant
            reviews: [],
            isLoading: true,
            errorMessage: '',
            isHovering: false, // Track hover state
            hoverPosition: { x: 0, y: 0 }, // Track mouse position for magnification
            showModal: false, // New property to manage modal visibility
            coupons: [], // New property to hold available coupons
            selectedCoupon: null,
            discountedPrice: null, // New property to hold the discounted price
            totalAmount: null, // New property to hold the total amount
            addresses: [], // List of user addresses
            selectedAddress: null, // Currently selected address
            showAddressModal: false, // Control address modal visibility
            showAddAddressModal: false, // Control add address modal visibility
            showEditAddressModal: false,
            showDeleteAddressModal: false,
            addressToEdit: null,
            addressToDelete: null,
            newAddress: {
                name: '',
                phone_number: '',
                flat: '',
                apartment: '',
                city: '',
                state: '',
                landmark: '',
                address_type: 'Home', // Default to 'Home'
                other_type: '' // For 'Others' option
            },
            showSlotModal: false, // New property to control slot modal visibility
            selectedDay: null,
            selectedTime: null,
            availableDays: [], // Days available for booking
            availableTimes: [], // Times available for booking
            showConfirmationModal: false, // New property to control confirmation modal visibility
            couponCode: '',
            appliedCoupon: null,
            couponDiscount: 0,
            isProcessing: false,
            magnifierStyle: {
                left: '0px',
                top: '0px',
                backgroundImage: '',
                backgroundPosition: '0px 0px'
            },
            couponError: '',
            originalTotalAmount: null, // Store the original total without any coupon
            totalAmountBeforeCoupon: null, // Track total before coupon
            showSavingsFromCoupon: false, // Only show when coupon applied
            magnifierThrottle: null, // For performance optimization
            imageRect: null, // Cache image dimensions
            
            // Enhanced billing system
            deliveryCharges: 50, // Default delivery charges
            installationCharges: 100, // Default installation charges
            deliveryDiscount: 0, // Delivery discount from coupon
            installationDiscount: 0, // Installation discount from coupon
            cgst: 0, // CGST amount
            sgst: 0, // SGST amount
            finalOrderAmount: null, // Final order amount after coupon (different from discountedPrice)
            
            // Color variants
            selectedColorVariant: null, // Currently selected color variant
        };
    },
    methods: {
        fetchSeatCoverDetails() {
            const id = this.$route.params.id;
            const selectedColorVariantId = this.$route.query.colorVariantId;
            
            console.log('🔍 Fetching seat cover details for ID:', id);
            console.log('🎨 Pre-selected color variant ID from query:', selectedColorVariantId, typeof selectedColorVariantId);
            
            axios.get(`/api/seat_cover/${id}`)
                .then(response => {
                    if (response.data && response.data.Seat_Covers && response.data.Seat_Covers.length > 0) {
                        this.seatCover = response.data.Seat_Covers[0];
                        this.reviews = response.data.reviews || [];
                        
                        // Ensure seatCover has all required properties
                        this.seatCover.price = this.seatCover.price || 0;
                        this.seatCover.discount = this.seatCover.discount || 0;
                        this.seatCover.name = this.seatCover.name || 'Seat Cover';
                        this.seatCover.poster = this.seatCover.poster || '';
                        this.seatCover.variants = this.seatCover.variants || [];
                        this.seatCover.color_variants = this.seatCover.color_variants || [];
                        
                        // Check if variants exist
                        if (this.seatCover.variants && this.seatCover.variants.length > 0) {
                            // Set default variant (either the one marked as default or the first one)
                            const defaultVariant = this.seatCover.variants.find(v => v.is_default) || this.seatCover.variants[0];
                            this.selectVariant(defaultVariant);
                        } else {
                            // Create default variants if none exist
                            this.createDefaultVariants();
                            // Calculate initial price based on existing product discount
                            const price = parseFloat(this.seatCover.price);
                            const discount = parseFloat(this.seatCover.discount) || 0;
                            this.discountedPrice = price - (discount / 100 * price);
                            
                            // Calculate taxes
                            this.cgst = this.discountedPrice * 0.14;
                            this.sgst = this.discountedPrice * 0.14;
                            
                            // Calculate total with installation charges
                            this.totalAmount = this.discountedPrice + this.cgst + this.sgst + this.deliveryCharges + this.installationCharges;
                        }
                        
                        // Handle color variant selection
                        if (this.seatCover.color_variants && this.seatCover.color_variants.length > 0) {
                            // Ensure each color variant has required properties
                            this.seatCover.color_variants.forEach(cv => {
                                cv.display_name = cv.display_name || cv.color_name || 'Color';
                                cv.is_dual_color = cv.is_dual_color || false;
                                cv.color_code = cv.color_code || '#000000';
                                cv.secondary_color_code = cv.secondary_color_code || '';
                            });
                            
                            console.log('🎨 Available color variants:', this.seatCover.color_variants.map(cv => ({
                                id: cv.id,
                                type: typeof cv.id,
                                color_name: cv.color_name,
                                display_name: cv.display_name
                            })));
                            
                            let colorToSelect = null;
                            
                            // Check if user pre-selected a specific color variant from the listing page
                            if (selectedColorVariantId) {
                                if (selectedColorVariantId === 'default') {
                                    // User explicitly selected the default color variant
                                    console.log('🎨 User selected default color variant, using original poster');
                                    colorToSelect = null; // This will show the original seat cover poster
                                } else {
                                    // Convert selectedColorVariantId to number for proper comparison
                                    const targetId = parseInt(selectedColorVariantId);
                                    console.log('🎯 Looking for color variant with ID:', targetId, typeof targetId);
                                    
                                    colorToSelect = this.seatCover.color_variants.find(cv => cv.id === targetId);
                                    console.log('🎨 Found pre-selected color variant:', colorToSelect);
                                    
                                    if (!colorToSelect) {
                                        console.warn('⚠️ Could not find color variant with ID:', targetId);
                                        console.log('🔍 Available IDs:', this.seatCover.color_variants.map(cv => cv.id));
                                    }
                                }
                            }
                            
                            // Fall back to primary color or first color if no pre-selection or not found
                            if (!colorToSelect && selectedColorVariantId !== 'default') {
                                colorToSelect = this.seatCover.color_variants.find(cv => cv.is_primary) || this.seatCover.color_variants[0];
                                console.log('🎨 Using default/primary color variant:', colorToSelect);
                            }
                            
                            // Only select a color variant if we found one (don't select anything for 'default')
                            if (colorToSelect) {
                                this.selectColorVariant(colorToSelect);
                            } else {
                                console.log('🎨 No color variant selected - showing original seat cover poster');
                            }
                        }
                        
                        // Store the original total amount (this never changes)
                        this.originalTotalAmount = this.totalAmount;
                        this.totalAmountBeforeCoupon = this.totalAmount;
                        this.showSavingsFromCoupon = false; // No coupon applied initially
                    } else {
                        this.errorMessage = 'Seat cover not found';
                    }
                    this.isLoading = false;
                })
                .catch(error => {
                    this.errorMessage = 'Error fetching seat cover details';
                    console.error('Error fetching seat cover details:', error);
                    this.isLoading = false;
                });
        },
        // Create default variants if none exist
        createDefaultVariants() {
            if (!this.seatCover.variants || this.seatCover.variants.length === 0) {
                const basePrice = this.seatCover.price;
                this.seatCover.variants = [
                    {
                        id: 'budget',
                        name: 'Budget',
                        description: 'Quality materials at an affordable price',
                        price: basePrice * 0.8, // 20% less than base price
                        discount: this.seatCover.discount,
                        final_price: basePrice * 0.8 * (1 - this.seatCover.discount/100),
                        is_default: false
                    },
                    {
                        id: 'standard',
                        name: 'Standard',
                        description: 'Our recommended choice with excellent quality',
                        price: basePrice, // Same as base price
                        discount: this.seatCover.discount,
                        final_price: basePrice * (1 - this.seatCover.discount/100),
                        is_default: true
                    },
                    {
                        id: 'premium',
                        name: 'Premium',
                        description: 'Luxury materials with extended durability',
                        price: basePrice * 1.3, // 30% more than base price
                        discount: this.seatCover.discount,
                        final_price: basePrice * 1.3 * (1 - this.seatCover.discount/100),
                        is_default: false
                    }
                ];
                // Select standard variant by default
                this.selectVariant(this.seatCover.variants[1]);
            }
        },
        // Select a variant and recalculate prices
        selectVariant(variant) {
            this.selectedVariant = variant;
            
            // Calculate discounted price based on variant price and discount
            const originalPrice = parseFloat(variant.price);
            const discountPercent = parseFloat(variant.discount) || parseFloat(this.seatCover.discount) || 0;
            this.discountedPrice = originalPrice * (1 - discountPercent / 100);
            
            // Calculate taxes
            this.cgst = this.discountedPrice * 0.14;
            this.sgst = this.discountedPrice * 0.14;
            
            // Recalculate total amount with installation charges
            this.totalAmount = this.discountedPrice + this.cgst + this.sgst + this.deliveryCharges + this.installationCharges;
            this.totalAmountBeforeCoupon = this.totalAmount;
            
            // Update the original total amount for this variant (used for coupon calculations)
            this.originalTotalAmount = this.totalAmount;
            
            // If a coupon is applied, re-apply it with the new price
            if (this.selectedCoupon) {
                this.applyCoupon(this.selectedCoupon);
            }
        },
        
        // Select a color variant and update the image
        selectColorVariant(colorVariant) {
            console.log('🎨 Selecting color variant:', colorVariant);
            this.selectedColorVariant = colorVariant;
            
            // Update the seat cover poster to show the selected color
            if (colorVariant && colorVariant.poster) {
                console.log('🖼️ Updating poster to color variant poster:', colorVariant.poster);
                this.seatCover.poster = colorVariant.poster;
            } else {
                console.log('🖼️ Color variant has no poster, keeping original');
            }
        },
        purchaseSeatCover() {
            console.log('🔥 Purchase button clicked!');
            console.log('Selected address:', this.selectedAddress);
            
            // Always show address modal first
            this.showAddressModal = true;
            
            // If no addresses exist, show add address modal
            if (this.addresses.length === 0) {
                this.showAddAddressModal = true;
            }
        },
        handleMouseMove(event) {
            if (!this.isHovering) return;
            const image = this.$refs.seatCoverImage;
            const magnifier = this.$refs.magnifyingGlass;
            const container = image.parentElement;
            const rect = container.getBoundingClientRect();
            const magnifierSize = 250;
            const zoomLevel = 2;

            // Mouse position relative to container
            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;

            // Only show magnifier if inside image
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                this.hideMagnifier();
                return;
            }

            // Center the magnifier on the cursor, inside the container
            magnifier.style.position = 'absolute';
            magnifier.style.left = `${x - magnifierSize / 2}px`;
            magnifier.style.top = `${y - magnifierSize / 2}px`;

            // Calculate background size and position
            const bgX = -((x * zoomLevel) - magnifierSize / 2);
            const bgY = -((y * zoomLevel) - magnifierSize / 2);

            magnifier.style.backgroundImage = `url(${this.seatCover.poster})`;
            magnifier.style.backgroundSize = `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`;
            magnifier.style.backgroundPosition = `${bgX}px ${bgY}px`;
            magnifier.style.backgroundRepeat = 'no-repeat';
        },
        showMagnifier(event) {
            this.isHovering = true;
            const magnifier = this.$refs.magnifyingGlass;
            if (magnifier) {
                magnifier.classList.add('active');
                // Initialize magnifier position
                this.updateMagnifier(event);
            }
        },
        hideMagnifier() {
            this.isHovering = false;
            const magnifier = this.$refs.magnifyingGlass;
            if (magnifier) {
                magnifier.classList.remove('active');
            }
            
            // Clear throttle
            if (this.magnifierThrottle) {
                clearTimeout(this.magnifierThrottle);
                this.magnifierThrottle = null;
            }
        },
        toggleModal() {
            this.showModal = !this.showModal;
            if (this.showModal) {
                this.fetchCoupons();
            }
        },
        fetchCoupons() {
            axios.get('/api/coupons')
                .then(response => {
                    this.coupons = response.data.coupons || [];
                    
                    // Calculate actual savings for each coupon type and sort by savings amount (highest first)
                    this.coupons = this.coupons.map(coupon => {
                        const baseOrderAmount = this.getBaseOrderAmount();
                        let savingsAmount = 0;
                        let savingsText = 'No savings';
                        
                        // Calculate savings based on coupon type
                        if (coupon.discount_type === 'percentage' && coupon.discount_percentage) {
                            savingsAmount = baseOrderAmount * (coupon.discount_percentage / 100);
                            savingsText = `Save ₹${savingsAmount.toFixed(0)}`;
                        } else if (coupon.discount_type === 'free_delivery' && coupon.offers_free_delivery) {
                            savingsAmount = this.deliveryCharges;
                            savingsText = `Save ₹${savingsAmount.toFixed(0)}`;
                        } else if (coupon.discount_type === 'free_installation' && coupon.offers_free_installation) {
                            savingsAmount = this.installationCharges;
                            savingsText = `Save ₹${savingsAmount.toFixed(0)}`;
                        } else if (coupon.discount_type === 'combo') {
                            let totalSavings = 0;
                            if (coupon.discount_percentage) {
                                totalSavings += baseOrderAmount * (coupon.discount_percentage / 100);
                            }
                            if (coupon.offers_free_delivery) {
                                totalSavings += this.deliveryCharges;
                            }
                            if (coupon.offers_free_installation) {
                                totalSavings += this.installationCharges;
                            }
                            savingsAmount = totalSavings;
                            savingsText = `Save ₹${totalSavings.toFixed(0)}`;
                        }
                        
                        return {
                            ...coupon,
                            savingsAmount: savingsAmount > 0 ? savingsAmount : 0,
                            savingsText: savingsAmount > 0 ? savingsText : 'No savings'
                        };
                    }).sort((a, b) => b.savingsAmount - a.savingsAmount); // Sort by savings amount (highest first)
                    
                    console.log('Fetched and sorted coupons with enhanced savings calculation:', this.coupons);
                })
                .catch(error => {
                    console.error('Error fetching coupons:', error);
                    this.coupons = [];
                });
        },
        async applyCoupon(coupon) {
            if (this.selectedCoupon && this.selectedCoupon.id === coupon.id) {
                // Remove coupon if already selected
                this.removeCoupon();
                return;
            }

            try {
                // First, reset to base prices (without any coupon)
                this.resetToBasePrice();
            
                // Use ORIGINAL discounted price (variant or seat cover discount only)
                const baseOrderAmount = this.getBaseOrderAmount();
                console.log('🎯 Applying coupon:', {
                    couponCode: coupon.code,
                    baseOrderAmount,
                    currentDiscountedPrice: this.discountedPrice
                });
                const response = await axios.post('/api/validate_coupon', {
                    coupon_code: coupon.code,
                    order_amount: baseOrderAmount,
                    current_discounted_price: this.discountedPrice, // Send current discounted price for fallback
                    delivery_charges: this.deliveryCharges,
                    installation_charges: this.installationCharges
                });

                if (response.data.valid) {
                    // Store original total for savings calculation BEFORE applying coupon
                    this.originalTotalAmount = this.totalAmount;
                    
                    // Apply the validated coupon
                this.selectedCoupon = coupon;
                    const discounts = response.data.discounts;
                    const newTotals = response.data.new_totals;
                    
                    // Update all the amounts
                    this.couponDiscount = discounts.order_discount;
                    this.deliveryDiscount = discounts.delivery_discount;
                    this.installationDiscount = discounts.installation_discount;
                    
                    // Update the final amounts (but keep original discountedPrice for display)
                    this.finalOrderAmount = newTotals.order_amount;
                    this.cgst = newTotals.cgst;
                    this.sgst = newTotals.sgst;
                    this.totalAmount = newTotals.total_amount;
                    
                    const totalSavings = discounts.total_savings;
                    
                    this.showSavingsFromCoupon = true;
                    this.showModal = false; // Close the modal
                    
                    // Show excitement effects
                    this.showSavingsAnimation(totalSavings, coupon);
                    
                    console.log('✅ Coupon applied successfully:', {
                        coupon: coupon.code,
                        baseOrderAmount: baseOrderAmount,
                        orderDiscount: discounts.order_discount,
                        deliveryDiscount: discounts.delivery_discount,
                        installationDiscount: discounts.installation_discount,
                        totalSavings: totalSavings
                    });
                }
            } catch (error) {
                console.error('❌ Error applying coupon:', error);
                const errorMessage = error.response?.data?.error || 'Failed to apply coupon';
                
                // Handle coupon usage limit error gracefully - no alert
                if (errorMessage.includes('already used this coupon')) {
                    // This should not happen as the coupon should be filtered out
                    console.warn('Coupon usage limit reached but was still shown in UI');
                    // Refresh coupons to remove this one
                    this.fetchCoupons();
                    // Show a subtle notification instead of alert
                    this.showCouponErrorNotification('This coupon is no longer available');
                    return;
                }
                
                // For other errors, show a subtle notification instead of alert
                this.showCouponErrorNotification(errorMessage);
            }
        },
        showSavingsAnimation(totalSavings, coupon) {
            // Create confetti effect
            this.createConfetti();
            
            // Show savings popup with animation
            this.showSavingsPopup(totalSavings, coupon);
            
            // Add pulse effect to total amount
            this.addPulseEffect();
            
            // Removed the irritating success sound
            // this.playSuccessSound();
        },
        createConfetti() {
            // Create confetti container
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            document.body.appendChild(confettiContainer);
            
            // Create multiple confetti pieces with varied colors
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
            
            for (let i = 0; i < 60; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-piece';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 2 + 's';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                // Add some variety to confetti shapes
                if (Math.random() > 0.5) {
                    confetti.style.borderRadius = '0';
                    confetti.style.transform = 'rotate(45deg)';
                }
                
                confettiContainer.appendChild(confetti);
            }
            
            // Remove confetti after animation
            setTimeout(() => {
                if (document.body.contains(confettiContainer)) {
                    document.body.removeChild(confettiContainer);
                }
            }, 5000);
        },
        showSavingsPopup(totalSavings, coupon) {
            // Create a standalone center screen success element
            const successElement = document.createElement('div');
            successElement.className = 'center-screen-coupon-success';
            
            // Set initial state (invisible and small)
            successElement.style.opacity = '0';
            successElement.style.transform = 'translate(-50%, -50%) scale(0.3) rotateY(-90deg)';
            successElement.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            // Create detailed savings breakdown
            let savingsBreakdown = '';
            if (this.couponDiscount > 0) {
                savingsBreakdown += `<div style="font-size: 1.4rem; margin: 0.3rem 0; opacity: 0.9;">Product Discount: -₹${this.couponDiscount.toFixed(0)}</div>`;
            }
            if (this.deliveryDiscount > 0) {
                savingsBreakdown += `<div style="font-size: 1.4rem; margin: 0.3rem 0; opacity: 0.9;">Free Delivery: -₹${this.deliveryDiscount.toFixed(0)}</div>`;
            }
            if (this.installationDiscount > 0) {
                savingsBreakdown += `<div style="font-size: 1.4rem; margin: 0.3rem 0; opacity: 0.9;">Free Installation: -₹${this.installationDiscount.toFixed(0)}</div>`;
            }
            
            successElement.innerHTML = `
                <div style="position: relative; z-index: 1; text-align: center; line-height: 1.4;">
                    <div style="font-size: 3.5rem; margin-bottom: 1rem; animation: bounce 1s ease-in-out infinite alternate;">🎉</div>
                    <div style="font-size: 2.2rem; font-weight: 900; margin-bottom: 1rem; letter-spacing: 1px;">COUPON APPLIED!</div>
                    <div style="font-size: 2rem; margin-bottom: 1.5rem; font-weight: 800; background: linear-gradient(45deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        You Saved ₹${totalSavings.toFixed(0)}
                    </div>
                    <div style="font-size: 1.2rem; opacity: 0.8; margin-bottom: 1rem;">
                        ${savingsBreakdown}
                    </div>
                    <div style="font-size: 1.4rem; opacity: 0.9; font-weight: 600; margin-top: 1rem;">
                        ${coupon.name}
                    </div>
                </div>
            `;

            // Add to body first
            document.body.appendChild(successElement);

            // Trigger entrance animation after a small delay
            setTimeout(() => {
                successElement.style.opacity = '1';
                successElement.style.transform = 'translate(-50%, -50%) scale(1) rotateY(0deg)';
            }, 100);

            // Add gentle pulsing effect after entrance animation
            setTimeout(() => {
                successElement.style.animation = 'backgroundPulse 3s ease-in-out infinite';
            }, 1200);

            // Start exit animation
            setTimeout(() => {
                successElement.style.transition = 'all 0.8s cubic-bezier(0.55, 0.055, 0.675, 0.19)';
                successElement.style.opacity = '0';
                successElement.style.transform = 'translate(-50%, -50%) scale(0.2) rotateY(90deg) translateY(-50px)';
            }, 4000);

            // Remove element after exit animation
            setTimeout(() => {
                if (document.body.contains(successElement)) {
                    document.body.removeChild(successElement);
                }
            }, 5000);
        },
        addPulseEffect() {
            // Add pulse effect to total amount display
            const totalElement = document.querySelector('.total-amount');
            if (totalElement) {
                totalElement.classList.add('pulse-effect');
                setTimeout(() => {
                    totalElement.classList.remove('pulse-effect');
                }, 2000);
            }
        },
        playSuccessSound() {
            // Optional: Play a success sound
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWTQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
                audio.play().catch(() => {
                    // Ignore if audio fails to play
                });
            } catch (e) {
                // Ignore audio errors
            }
        },
        getRandomColor() {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
            return colors[Math.floor(Math.random() * colors.length)];
        },
        removeCoupon() {
            if (this.selectedCoupon) {
                const removedCouponCode = this.selectedCoupon.code;
                this.selectedCoupon = null;
                this.resetToBasePrice();
                this.showSavingsFromCoupon = false;
                this.originalTotalAmount = 0;
                
                // Show a nice UI notification instead of alert
                this.showCouponRemovedNotification(removedCouponCode);
            }
        },
        
        showCouponRemovedNotification(couponCode) {
            // Create a modern notification element
            const notification = document.createElement('div');
            notification.className = 'coupon-removed-notification';
            
            // Set initial state (invisible and positioned)
            notification.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: linear-gradient(135deg, #ff6b6b, #ee5a24) !important;
                color: white !important;
                padding: 1rem 1.5rem !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3) !important;
                z-index: 10000 !important;
                font-family: 'Poppins', sans-serif !important;
                font-weight: 600 !important;
                font-size: 0.9rem !important;
                opacity: 0 !important;
                transform: translateX(100%) !important;
                transition: all 0.3s ease !important;
                max-width: 300px !important;
                border: none !important;
                backdrop-filter: blur(10px) !important;
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">🗑️</span>
                    <span>Coupon "${couponCode}" removed successfully</span>
                </div>
            `;

            // Add to body
            document.body.appendChild(notification);

            // Trigger entrance animation
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            }, 100);

            // Start exit animation
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
            }, 3000);

            // Remove element after exit animation
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 3500);
        },
        
        showCouponErrorNotification(errorMessage) {
            // Create a modern error notification element with inline styling
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: linear-gradient(135deg, #ff4757, #c44569) !important;
                color: white !important;
                padding: 1rem 1.5rem !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3) !important;
                z-index: 10000 !important;
                font-family: 'Poppins', sans-serif !important;
                font-weight: 600 !important;
                font-size: 0.9rem !important;
                opacity: 0 !important;
                transform: translateX(100%) !important;
                transition: all 0.3s ease !important;
                max-width: 350px !important;
                border: none !important;
                backdrop-filter: blur(10px) !important;
            `;
            
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">❌</span>
                    <span>${errorMessage}</span>
                </div>
            `;

            // Add to body
            document.body.appendChild(notification);

            // Trigger entrance animation
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            }, 100);

            // Start exit animation
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
            }, 4000);

            // Remove element after exit animation
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 4500);
        },

        
        resetToBasePrice() {
            // Reset all coupon-related discounts
                this.couponDiscount = 0;
            this.deliveryDiscount = 0;
            this.installationDiscount = 0;
            this.finalOrderAmount = null; // Reset final order amount
            this.originalTotalAmount = 0; // Reset original total amount to prevent negative savings
                
            // Reset to base discounted price (variant or seat cover discount only)
            // This is the price displayed to user after variant/seat cover discount but before coupon
                if (this.selectedVariant) {
                    const originalPrice = parseFloat(this.selectedVariant.price);
                    const discountPercent = parseFloat(this.selectedVariant.discount) || 0;
                    this.discountedPrice = originalPrice * (1 - discountPercent / 100);
                console.log('🔧 Reset to base price with variant:', {
                    originalPrice,
                    discountPercent,
                    discountedPrice: this.discountedPrice
                });
                } else {
                    const price = parseFloat(this.seatCover.price);
                    const discount = parseFloat(this.seatCover.discount) || 0;
                this.discountedPrice = price * (1 - discount / 100);
                console.log('🔧 Reset to base price with seat cover:', {
                    price,
                    discount,
                    discountedPrice: this.discountedPrice
                });
            }
            
            // Recalculate taxes and total with base charges
            this.cgst = this.discountedPrice * 0.14;
            this.sgst = this.discountedPrice * 0.14;
            this.totalAmount = this.discountedPrice + this.cgst + this.sgst + this.deliveryCharges + this.installationCharges;
            
            console.log('🔧 Final reset state:', {
                discountedPrice: this.discountedPrice,
                finalOrderAmount: this.finalOrderAmount,
                totalAmount: this.totalAmount
            });
        },
        getBaseOrderAmount() {
            // Return the ORIGINAL price (before any discounts including variant/seat cover discount)
            // This is what coupons should apply to
            if (this.selectedVariant) {
                return parseFloat(this.selectedVariant.price);
            } else {
                return parseFloat(this.seatCover.price);
            }
        },
        getMagnifiedStyle() {
            return {
                left: `${this.hoverPosition.x + 10}px`, // Adjusted to center the magnifier
                top: `${this.hoverPosition.y + 50}px`,
                backgroundImage: `url(${this.seatCover.poster})`,
                backgroundSize: `${event.target.width * 2}px ${event.target.height * 2}px`, // Double the size for magnification
                backgroundPosition: `-${this.hoverPosition.x * 2}px -${this.hoverPosition.y * 2}px`
            };
        },
        fetchAddresses() {
            axios.get('/api/user/addresses')
                .then(response => {
                    this.addresses = response.data.addresses;
                })
                .catch(error => {
                    console.error('Error fetching addresses:', error);
                });
        },
        toggleAddressModal() {
            this.showAddressModal = !this.showAddressModal;
        },
        toggleAddAddressModal() {
            this.showAddAddressModal = !this.showAddAddressModal;
        },
        validatePhoneNumber(phoneNumber) {
            const phoneRegex = /^\d{10}$/;
            return phoneRegex.test(phoneNumber);
        },
        addAddress() {
            if (!this.validatePhoneNumber(this.newAddress.phone_number)) {
                alert('Phone number must be exactly 10 digits.');
                return;
            }

            // Use other_type if address_type is 'Others'
            const addressType = this.newAddress.address_type === 'Others' ? this.newAddress.other_type : this.newAddress.address_type;

            axios.post('/api/user/addresses', { ...this.newAddress, address_type: addressType })
                .then(response => {
                    this.addresses.push(response.data.address);
                    this.toggleAddAddressModal(); // Close the add address modal
                    this.newAddress = { name: '', phone_number: '', flat: '', apartment: '', city: '', state: '', landmark: '', address_type: 'Home', other_type: '' }; // Reset form
                })
                .catch(error => {
                    console.error('Error adding address:', error);
                });
        },
        formatAddress(address) {
            return address.replace(/\n/g, '<br>');
        },
        openEditAddressModal(address) {
            this.addressToEdit = { ...address }; // Clone the address to edit
            this.showEditAddressModal = true;
        },
    
        closeEditAddressModal() {
            this.showEditAddressModal = false;
            this.addressToEdit = null;
        },
    
        submitEditAddress() {
            axios.put(`/api/user/addresses/${this.addressToEdit.id}`, this.addressToEdit)
                .then(response => {
                    const index = this.addresses.findIndex(addr => addr.id === this.addressToEdit.id);
                    if (index !== -1) {
                        this.addresses.splice(index, 1, response.data.address);
                    }
                    this.closeEditAddressModal();
                })
                .catch(error => {
                    console.error('Error editing address:', error);
                });
        },
    
        openDeleteAddressModal(address) {
            this.addressToDelete = address;
            this.showDeleteAddressModal = true;
        },
    
        closeDeleteAddressModal() {
            this.showDeleteAddressModal = false;
            this.addressToDelete = null;
        },
        submitDeleteAddress() {
            axios.delete(`/api/user/addresses/${this.addressToDelete.id}`)
                .then(() => {
                    this.addresses = this.addresses.filter(addr => addr.id !== this.addressToDelete.id);
                    this.closeDeleteAddressModal();
                })
                .catch(error => {
                    console.error('Error deleting address:', error);
                });
        },
        toggleSlotModal() {
            this.showSlotModal = !this.showSlotModal;
            if (this.showSlotModal) {
                this.generateAvailableDays();
            }
        },
        generateAvailableDays() {
            const today = new Date();
            this.availableDays = [];
            for (let i = 2; i <= 8; i++) { // Next to next day to 7 days ahead
                const day = new Date(today);
                day.setDate(today.getDate() + i);
                this.availableDays.push(day);
            }
        },
        selectDay(day) {
            this.selectedDay = day;
            this.generateAvailableTimes();
        },
        generateAvailableTimes() {
            this.availableTimes = [];
            for (let hour = 8; hour <= 18; hour += 2) { // Increment by 2 hours
                this.availableTimes.push(`${hour}:00 - ${hour + 2}:00`);
            }
        },
        selectTime(time) {
            this.selectedTime = time;
        },
        confirmPurchase() {
            // Double-check authentication before processing purchase
            const token = localStorage.getItem('access_token');
            const sessionData = localStorage.getItem('sessionData');
            
            if (!token && !sessionData) {
                alert('Please login to continue with your purchase.');
                this.$router.push('/login');
                return;
            }
            if (!this.selectedAddress) {
                alert('Please select an address to proceed.');
                return;
            }
            if (!this.selectedDay || !this.selectedTime) {
                alert('Please select a delivery slot.');
                return;
            }

            // Show loading state
            this.isProcessing = true;

            // Get the selected variant or use the default product price
            const selectedVariant = this.selectedVariant || {};

            // Calculate all bill details
            const originalPrice = parseFloat(selectedVariant.price) || parseFloat(this.seatCover.price);
            const discountPercent = this.selectedCoupon ? parseFloat(this.selectedCoupon.discount_percentage) : 
                                   (parseFloat(selectedVariant.discount) || parseFloat(this.seatCover.discount) || 0);
            const discountedPrice = originalPrice * (1 - discountPercent / 100);
            const cgst = 0.14 * discountedPrice;
            const sgst = 0.14 * discountedPrice;
            const deliveryCharges = 50;
            const totalAmount = discountedPrice + cgst + sgst + deliveryCharges;

            // Prepare purchase data with ALL required fields
            const purchaseData = {
                address_id: this.selectedAddress.id,
                category_id: this.seatCover.category_id,
                product_id: this.seatCover.id,
                total_amount: totalAmount,
                product_original_price: originalPrice,
                product_final_price: discountedPrice,
                CGST: cgst.toFixed(2),
                SGST: sgst.toFixed(2),
                delivery_charges: deliveryCharges,
                slot_date: this.selectedDay ? this.selectedDay.toISOString().split('T')[0] : null,
                slot_time: this.selectedTime || null,
                variant_id: selectedVariant.id || null,
                variant_name: selectedVariant.name || 'Standard'
            };

            // Add coupon information if a coupon was applied
            if (this.selectedCoupon) {
                purchaseData.coupon_applied = this.selectedCoupon.code;
                purchaseData.discount_amount = (originalPrice - discountedPrice).toFixed(2);
            } else if (discountPercent > 0) {
                // If no coupon but product has a discount
                purchaseData.discount_amount = (originalPrice * (discountPercent / 100)).toFixed(2);
            } else {
                // No discount applied
                purchaseData.discount_amount = 0;
            }

            console.log('Sending purchase data:', purchaseData);

            axios.post('/api/user/purchases', purchaseData)
            .then(response => {
                console.log('Purchase recorded:', response.data);
                this.showAddressModal = false;
                
                // Redirect immediately to orders page
                window.location = window.location.origin + '/#/my_orders?refresh=' + new Date().getTime();
            })
            .catch(error => {
                console.error('Error recording purchase:', error);
                const errorMessage = error.response?.data?.error || 'Failed to process purchase. Please try again.';
                alert(errorMessage);
            })
            .finally(() => {
                this.isProcessing = false;
            });
        },
        formatDate(date) {
            return new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
        },
        formatTime(time) {
            const [start, end] = time.split(' - ');
            return `${this.formatHour(start)} - ${this.formatHour(end)}`;
        },
        formatHour(hour) {
            const [h, m] = hour.split(':');
            const period = h >= 12 ? 'PM' : 'AM';
            const formattedHour = h % 12 || 12; // Convert to 12-hour format
            return `${formattedHour}:${m} ${period}`;
        },
        toggleConfirmationModal() {
            this.showConfirmationModal = !this.showConfirmationModal;
        },
        confirmSlot() {
            if (this.selectedDay && this.selectedTime) {
                this.toggleConfirmationModal();
            } else {
                alert('Please select a day and time slot.');
            }
        },
        proceedToPayment() {
            // Check if user is authenticated before allowing payment
            const token = localStorage.getItem('access_token');
            const sessionData = localStorage.getItem('sessionData');
            
            if (!token && !sessionData) {
                // User is not logged in, redirect to login
                alert('Please login to continue with your purchase.');
                this.$router.push('/login');
                return;
            }
            this.toggleConfirmationModal();
            
            // Debug: Check totalAmount value
            console.log('Current totalAmount:', this.totalAmount, 'Type:', typeof this.totalAmount);
            
            // Prepare payment data
            const paymentData = {
                productName: this.seatCover.name,
                variantName: this.selectedVariant ? this.selectedVariant.name : 'Standard',
                totalAmount: parseFloat(this.totalAmount).toFixed(2),
                customerName: this.selectedAddress.name,
                customerEmail: '', // You might want to get this from user session
                customerPhone: this.selectedAddress.phone_number,
                deliveryAddress: this.selectedAddress.address,
                slotDate: this.selectedDay ? this.formatDate(this.selectedDay) : null,
                slotTime: this.selectedTime ? this.formatTime(this.selectedTime) : null
            };
            
            console.log('Payment data:', paymentData);
            
            // Prepare purchase data for after payment with enhanced billing
            const selectedVariant = this.selectedVariant || {};
            const originalPrice = parseFloat(selectedVariant.price) || parseFloat(this.seatCover.price);
            
            // Use the current calculated values from the component
            const finalProductPrice = this.discountedPrice;
            const cgst = this.cgst;
            const sgst = this.sgst;
            const deliveryCharges = this.deliveryCharges - this.deliveryDiscount;
            const installationCharges = this.installationCharges - this.installationDiscount;
            const totalAmount = this.totalAmount;

            const purchaseData = {
                address_id: this.selectedAddress.id,
                category_id: this.seatCover.category_id,
                product_id: this.seatCover.id,
                total_amount: totalAmount,
                product_original_price: originalPrice,
                product_final_price: finalProductPrice,
                CGST: cgst.toFixed(2),
                SGST: sgst.toFixed(2),
                delivery_charges: deliveryCharges,
                installation_charges: installationCharges,
                delivery_discount: this.deliveryDiscount,
                installation_discount: this.installationDiscount,
                slot_date: this.selectedDay ? this.selectedDay.toISOString().split('T')[0] : null,
                slot_time: this.selectedTime || null,
                variant_id: selectedVariant.id || null,
                variant_name: selectedVariant.name || 'Standard'
            };

            // Add coupon information if a coupon was applied
            if (this.selectedCoupon) {
                purchaseData.coupon_applied = this.selectedCoupon.code;
                purchaseData.discount_amount = this.couponDiscount;
            } else {
                purchaseData.discount_amount = 0;
            }
            
            // Store data in localStorage for payment page
            localStorage.setItem('paymentData', JSON.stringify(paymentData));
            localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
            
            // Navigate to payment page
            this.$router.push('/payment');
        },
        updateAddress() {
            console.log('Updating address:', this.editingAddress);
            
            // Prepare the address data for the API
            const addressData = {
                name: this.editingAddress.name,
                phone_number: this.editingAddress.phone_number,
                flat: this.editingAddress.flat,
                apartment: this.editingAddress.apartment,
                city: this.editingAddress.city,
                state: this.editingAddress.state,
                landmark: this.editingAddress.landmark,
                address_type: this.editingAddress.address_type
            };
            
            console.log('Sending address data to backend:', addressData);
            
            // Make API call to update address in backend
            fetch(`/api/user/addresses/${this.editingAddress.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(addressData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update address');
                }
                return response.json();
            })
            .then(data => {
                console.log('✅ Address updated successfully in backend:', data);
                
                // Update the local addresses array with the response data
                const index = this.addresses.findIndex(addr => addr.id === this.editingAddress.id);
                if (index !== -1) {
                    this.addresses[index] = data.address;
                }
                
                // Close the edit modal
                this.showEditModal = false;
                this.editingAddress = null;
                
                // Show success message
                alert('Address updated successfully!');
                
                // Optionally refresh addresses to ensure consistency
                this.fetchAddresses();
            })
            .catch(error => {
                console.error('❌ Error updating address:', error);
                alert('Failed to update address. Please try again.');
                
                // Revert local changes if backend update failed
                this.fetchAddresses();
            });
        },
    },
    computed: {
        magnifierStyle() {
            return {
                left: `${this.hoverPosition.x}px`,
                top: `${this.hoverPosition.y}px`,
                backgroundImage: `url(${this.seatCover.poster})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            };
        },
        
        // Updated computed property for coupon savings
        couponSavingsAmount() {
            if (this.showSavingsFromCoupon && this.originalTotalAmount && this.selectedCoupon) {
                const savings = this.originalTotalAmount - this.totalAmount;
                return Math.max(0, savings).toFixed(2); // Ensure savings is never negative
            }
            return 0;
        },
        
        // Total savings including variant discount and coupon benefits
        totalSavingsAmount() {
            if (this.showSavingsFromCoupon && this.selectedCoupon) {
                // Calculate total savings: variant discount + coupon benefits
                let totalSavings = 0;
                
                // Add variant/base discount savings
                if (this.selectedVariant && this.selectedVariant.discount > 0) {
                    totalSavings += (this.selectedVariant.price * this.selectedVariant.discount / 100);
                } else if (this.seatCover.discount > 0) {
                    totalSavings += (this.seatCover.price * this.seatCover.discount / 100);
                }
                
                // Add coupon-specific savings
                totalSavings += (this.couponDiscount || 0);
                totalSavings += (this.deliveryDiscount || 0);
                totalSavings += (this.installationDiscount || 0);
                
                return totalSavings.toFixed(2);
            }
            return 0;
        }
    },
    created() {
        console.log('Component created. isProcessing:', this.isProcessing);
        
        // Always fetch seat cover details first to avoid black screen
        this.fetchSeatCoverDetails();
        
        // Check if user is logged in - redirect anonymous users to login
        const token = localStorage.getItem('access_token');
        const sessionData = localStorage.getItem('sessionData');
        
        if (!token && !sessionData) {
            console.log('🔒 Anonymous user trying to access seat cover details, redirecting to login...');
            
            // Store redirect context so login knows where to return
            const redirectContext = {
                origin: 'seat_cover_details',
                destination: this.$route.fullPath, // Include query params like colorVariantId
                timestamp: Date.now()
            };
            localStorage.setItem('loginRedirectContext', JSON.stringify(redirectContext));
            console.log('💾 Stored redirect context for seat cover details:', redirectContext);
            
            // Delay redirect to allow component to render first
            setTimeout(() => {
                this.$router.push('/login');
            }, 100);
            return;
        }
        
        this.fetchAddresses();
        this.generateAvailableDays();
    },
    beforeDestroy() {
        // Component cleanup
    },
    beforeRouteEnter(to, from, next) {
        // This is called before the route that renders this component is confirmed
        // We can use this to refresh authentication state when coming from login
        next(vm => {
            if (from.path === '/login') {
                console.log('🔄 Returning from login to seat cover details, user should be authenticated now');
                // Since we're in seat cover details, user should be authenticated
                // No need to refresh auth state here as it's already checked in created()
            }
        });
    },
    beforeRouteLeave(to, from, next) {
        // Route cleanup
        next();
    },
    template: `
    <div class="seat-cover-details-container">
        <!-- Add the CSS fix file -->
        <link rel="stylesheet" href="/static/seat_cover_fixes.css">
        
        <nav class="navbar-userhome">
                                <router-link class="navbar-brand-userhome" to="/seat-covers" style="font-weight: 1000; font-family: 'Poppins', sans-serif">Carsona</router-link>
            <div class="collapse navbar-collapse d-md-flex justify-content-md-end">
                <div class="nav-item">
                    <router-link class="nav-link white-text" to="/seat-covers">Back to Seat Covers</router-link>
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

        <div v-if="isLoading" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>Loading seat cover details...</p>
        </div>

        <div v-else-if="errorMessage" class="alert alert-danger">
            {{ errorMessage }}
        </div>

        <!-- Main Content Container - Only show when not loading and no error -->
        <div v-else>
            <!-- Product Name Section - Full Width -->
            <div class="product-name-section">
                <h4>{{ seatCover.name }}</h4>
            </div>

            <!-- Main Content Layout -->
            <div class="main-content-layout">
                <!-- Left Side: Image -->
                <div class="image-container" @mousemove="handleMouseMove" @mouseenter="showMagnifier" @mouseleave="hideMagnifier" style="position:relative;">
                    <img 
                        ref="seatCoverImage"
                        :src="seatCover.poster" 
                        :alt="seatCover.name"
                        class="seat-cover-image"
                        style="cursor: crosshair;"
                    />
                    <div 
                        ref="magnifyingGlass"
                        class="magnifying-glass"
                        :class="{ active: isHovering }"
                        :style="magnifierStyle"
                    ></div>
                </div>

                <!-- Right Side: Bill Details -->
                <div class="bill-details-section">
                    <div class="content-box">
                        <!-- Bill Details Section -->
                        <h4 class="text-2xl font-bold text-center">Bill Details</h4>
                        
                        <div class="flex d-md-flex items-center">
                            <p>Item Price</p>
                            <div>
                                <!-- Always show original price as struck-through when there's any discount -->
                                <span v-if="(selectedVariant && selectedVariant.discount > 0) || (seatCover.discount > 0) || finalOrderAmount !== null" class="original-price">
                                    ₹{{ selectedVariant ? selectedVariant.price : seatCover.price }}
                                </span>
                                
                                <!-- Show final price -->
                                <span class="product-price">₹{{ (finalOrderAmount !== null ? finalOrderAmount : discountedPrice).toFixed(2) }}</span>
                            </div>
                        </div>
                        
                        <div class="flex d-md-flex items-center">
                            <p>SGST (14%)</p>
                            <p class="product-price">₹{{ sgst.toFixed(2) }}</p>
                        </div>
                        
                        <div class="flex d-md-flex items-center">
                            <p>CGST (14%)</p>
                            <p class="product-price">₹{{ cgst.toFixed(2) }}</p>
                        </div>
                        
                        <div class="flex d-md-flex items-center">
                            <p>Delivery Charges</p>
                            <div>
                                <span v-if="deliveryDiscount > 0" class="original-price">₹{{ deliveryCharges.toFixed(2) }}</span>
                                <span class="product-price">₹{{ (deliveryCharges - deliveryDiscount).toFixed(2) }}</span>
                            </div>
                        </div>
                        
                        <div class="flex d-md-flex items-center">
                            <p>Installation Charges</p>
                            <div>
                                <span v-if="installationDiscount > 0" class="original-price">₹{{ installationCharges.toFixed(2) }}</span>
                                <span class="product-price">₹{{ (installationCharges - installationDiscount).toFixed(2) }}</span>
                            </div>
                        </div>
                        
                        <!-- Enhanced coupon discount breakdown -->
                        <div v-if="selectedCoupon && couponDiscount > 0" class="flex d-md-flex items-center" style="color: #28a745;">
                            <p>Product Discount</p>
                            <p class="product-price" style="color: #28a745;">-₹{{ couponDiscount.toFixed(2) }}</p>
                        </div>
                        
                        <div class="flex d-md-flex items-center">
                            <p><strong>Total Amount</strong></p>
                            <p class="product-price">₹{{ totalAmount.toFixed(2) }}</p>
                        </div>

                        <div v-if="showSavingsFromCoupon && selectedCoupon" class="savings-highlight">
                            You save ₹{{ totalSavingsAmount }} with this coupon!
                        </div>

                        <div v-if="!showSavingsFromCoupon && selectedVariant && selectedVariant.discount > 0" class="savings-highlight">
                            You save ₹{{ (selectedVariant.price * selectedVariant.discount / 100).toFixed(2) }} on this item!
                        </div>

                        <div v-else-if="!showSavingsFromCoupon && seatCover.discount > 0" class="savings-highlight">
                            You save ₹{{ (seatCover.price * seatCover.discount / 100).toFixed(2) }} on this item!
                        </div>

                        <!-- Purchase Button - Inside Bill Details Container -->
                        <button 
                            @click="purchaseSeatCover" 
                            class="btn btn-primary"
                            :disabled="isProcessing"
                            style="margin-top: 1rem; width: 100%;"
                        >
                            <span v-if="isProcessing">Processing...</span>
                            <span v-else>Purchase Now</span>
                        </button>

                        <!-- Coupon Section - Inside Bill Details -->
                        <div class="coupon-section-wrapper">
                            <button 
                                @click="toggleModal" 
                                class="btn-apply-coupon"
                            >
                                {{ selectedCoupon ? 'Change Coupon' : 'Apply Coupon' }}
                            </button>
                            
                            <!-- Show applied coupon info -->
                            <div v-if="selectedCoupon" class="coupon-success">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: bold; margin-bottom: 0.5rem;">
                                            ✓ Coupon "{{ selectedCoupon.code }}" applied!
                                        </div>
                                        <div style="font-size: 0.9rem;">
                                            <span v-if="couponDiscount > 0" style="color: #28a745; font-weight: bold;">
                                                {{ selectedCoupon.discount_percentage }}% Product Discount
                                            </span>
                                            <span v-if="deliveryDiscount > 0" style="color: #28a745; font-weight: bold; margin-left: 10px;">
                                                + Free Delivery
                                            </span>
                                            <span v-if="installationDiscount > 0" style="color: #28a745; font-weight: bold; margin-left: 10px;">
                                                + Free Installation
                                            </span>
                                        </div>
                                    </div>
                                    <button @click="removeCoupon" style="background: none; border: none; color: #dc3545; font-weight: bold; cursor: pointer; font-size: 1.4rem; padding: 0; margin-left: 10px; line-height: 1; min-width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;" title="Remove coupon">×</button>
                                </div>
                            </div>
                        </div>

                        <!-- CTA to variants -->
                        <div class="text-center mt-4">
                            <a href="#variants" class="btn btn-secondary" style="padding:0.6rem 1.2rem; font-weight:600;">
                                Choose Variant ↓
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Variants Section - Below Image (Full Width) -->
            <div id="variants" class="variant-selection-section">
                <h5 class="text-xl font-bold mb-4">Available Variants</h5>
                <div class="variants-container grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                        v-for="variant in seatCover.variants" 
                        :key="variant.id"
                        class="variant-card bg-white rounded-lg shadow-md p-4 transition-all duration-300" 
                        :class="{ 'selected': selectedVariant && selectedVariant.id === variant.id }"
                        @click="selectVariant(variant)"
                    >
                        <div class="variant-header mb-3">
                            <h6 class="text-lg font-semibold">{{ variant.name }}</h6>
                            <span v-if="variant.discount > 0" class="variant-discount-badge">{{ variant.discount }}% OFF</span>
                        </div>
                        
                        <div class="variant-specs mb-3">
                            <div class="spec-item flex justify-between mb-2">
                                <span class="text-gray-600">Material:</span>
                                <span class="font-medium">{{ variant.material_type }}</span>
                            </div>
                            <div class="spec-item flex justify-between mb-2">
                                <span class="text-gray-600">Thickness:</span>
                                <span class="font-medium">{{ variant.thickness }}mm</span>
                            </div>
                            <div class="spec-item flex justify-between mb-2">
                                <span class="text-gray-600">Warranty:</span>
                                <span class="font-medium">{{ variant.warranty }} months</span>
                            </div>
                        </div>

                        <div class="variant-price mb-3">
                            <span v-if="variant.discount > 0" class="original-price">₹{{ variant.price }}</span>
                            <span class="final-price text-xl font-bold">₹{{ variant.final_price.toFixed(2) }}</span>
                        </div>
                        
                        <p class="variant-description text-sm text-gray-600 mb-3">{{ variant.description }}</p>
                        
                        <div v-if="selectedVariant && selectedVariant.id === variant.id" class="selected-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                            </svg>
                            <span>Selected</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Color Variants Section - Below Variants (Full Width) -->
            <!--
            <div v-if="seatCover.color_variants && seatCover.color_variants.length > 0" class="color-variant-selection">
                <h5>Available Colors</h5>
                <div class="color-variant-options">
                    <div 
                        v-for="colorVariant in seatCover.color_variants" 
                        :key="colorVariant.id"
                        class="color-variant-option"
                        :class="{ 'selected': selectedColorVariant && selectedColorVariant.id === colorVariant.id }"
                        @click="selectColorVariant(colorVariant)"
                    >
                        <div 
                            class="color-variant-circle"
                            :style="{ backgroundColor: colorVariant.color_code }"
                        >
                            <div v-if="colorVariant.is_dual_color" 
                                 class="dual-color-detail-indicator"
                                 :style="{ backgroundColor: colorVariant.secondary_color_code }">
                            </div>
                        </div>
                        <span class="color-variant-name">{{ colorVariant.display_name || colorVariant.color_name }}</span>
                    </div>
                </div>
            </div>
            -->
        </div>

        <!-- Address Modal -->
        <div v-if="showAddressModal" class="modal" style="display: block;">
            <div class="modal-content">
                <span class="close" @click="toggleAddressModal">&times;</span>
                <h2>Select an Address</h2>
                <div v-if="addresses.length > 0">
                    <ul>
                        <li v-for="address in addresses" :key="address.id" class="address-box">
                           <div class="address-content">
                            <input type="radio" :value="address" v-model="selectedAddress" style="margin-right: 1rem;">
                            <span v-html="formatAddress(address.address)"></span>
                        </div>
                        <div class="address-actions">
                            <button @click="openEditAddressModal(address)">Edit</button>
                            <button @click="openDeleteAddressModal(address)">Delete</button>
                        </div>
                        </li>
                    </ul>
                    <button v-if="selectedAddress" @click="toggleSlotModal" class="btn btn-primary">Book Slot</button>
                </div>
                <div v-else>
                    <p>No Address added, please add an address.</p>
                </div>
                <div>
                    <button @click="toggleAddAddressModal" class="btn btn-secondary">Add New Address</button>
                </div>
            </div>
        </div>

        <div v-if="showAddAddressModal" class="modal">
            <div class="modal-content">
                <span class="close" @click="toggleAddAddressModal">&times;</span>
                <h3 class="text-center font-weight-bold mt-5">Add New Address</h3>
                <div class="form d-flex justify-content-center align-items-center pb-5">
                    <form @submit.prevent="addAddress" class="w-50">
                        <div class="mb-3">
                            <label class="form-label">Flat / House no / Floor / Building</label>
                            <input type="text" class="form-control" v-model="newAddress.flat" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Apartment / Road</label>
                            <input type="text" class="form-control" v-model="newAddress.apartment" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">City</label>
                            <input type="text" class="form-control" v-model="newAddress.city" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">State</label>
                            <input type="text" class="form-control" v-model="newAddress.state" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Nearby landmark (optional)</label>
                            <input type="text" class="form-control" v-model="newAddress.landmark">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Name</label>
                            <input type="text" class="form-control" v-model="newAddress.name" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Phone Number</label>
                            <input type="text" class="form-control" v-model="newAddress.phone_number" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Save Address as</label>
                                <select class="form-control" v-model="newAddress.address_type">
                                    <option>Home</option>
                                    <option>Work</option>
                                    <option>Others</option>
                                </select>
                        </div>
                        <div class="mb-3" v-if="newAddress.address_type === 'Others'">
                            <label class="form-label">Specify whose Address</label>
                            <input type="text" class="form-control" v-model="newAddress.other_type" placeholder="Specify address type">
                        </div>
                        <button type="submit" class="btn btn-primary">Add Address</button>
                    </form>
                </div>
            </div>
        </div>

         <div v-if="showEditAddressModal" class="modal">
        <div class="modal-content">
            <span class="close" @click="closeEditAddressModal">&times;</span>
            <h3 class="text-center font-weight-bold mt-5">Edit Address</h3>
            <div class="form d-flex justify-content-center align-items-center pb-5">
                <form @submit.prevent="submitEditAddress" class="w-50">
                    <div class="mb-3">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-control" v-model="addressToEdit.name" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Phone Number</label>
                        <input type="text" class="form-control" v-model="addressToEdit.phone_number" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Flat / House no / Floor / Building</label>
                        <input type="text" class="form-control" v-model="addressToEdit.flat" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Apartment / Road</label>
                        <input type="text" class="form-control" v-model="addressToEdit.apartment" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">City</label>
                        <input type="text" class="form-control" v-model="addressToEdit.city" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">State</label>
                        <input type="text" class="form-control" v-model="addressToEdit.state" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Nearby landmark (optional)</label>
                        <input type="text" class="form-control" v-model="addressToEdit.landmark">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Address Type</label>
                        <select class="form-control" v-model="addressToEdit.address_type">
                            <option>Home</option>
                            <option>Work</option>
                            <option>Others</option>
                        </select>
                    </div>
                    <div class="mb-3" v-if="addressToEdit.address_type === 'Others'">
                        <label class="form-label">Specify Type</label>
                        <input type="text" class="form-control" v-model="addressToEdit.other_type" placeholder="Specify address type">
                    </div>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </form>
            </div>
        </div>
    </div>

    <!-- Delete Address Modal -->
    <div v-if="showDeleteAddressModal" class="modal">
        <div class="modal-content">
            <span class="close" @click="closeDeleteAddressModal">&times;</span>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this address?</p>
            <button @click="submitDeleteAddress">Yes, Delete</button>
            <button @click="closeDeleteAddressModal">Cancel</button>
        </div>
    </div>

        <!-- Coupon Modal -->
        <div v-if="showModal" class="modal-overlay" @click="showModal = false">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Available Coupons</h3>
                    <button @click="showModal = false" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div v-if="coupons.length === 0" class="no-coupons">
                        <p>No coupons available at the moment.</p>
                    </div>
                    <div v-else>
                        <div v-for="coupon in coupons" :key="coupon.id" class="coupon-item" 
                             :class="{ 'selected': selectedCoupon && selectedCoupon.id === coupon.id }"
                             @click="applyCoupon(coupon)">
                            <div class="coupon-header">
                                <h4>{{ coupon.code }}</h4>
                                <div class="savings-badge" :style="{ background: coupon.savingsAmount > 0 ? '#28a745' : '#6c757d' }">
                                    {{ coupon.savingsText }}
                                </div>
                            </div>
                            <div class="coupon-details">
                                <p>{{ coupon.description }}</p>
                                <div class="coupon-footer">
                                    <span v-if="coupon.discount_type === 'percentage'" class="discount-badge">{{ coupon.discount_percentage }}% OFF</span>
                                    <span v-else-if="coupon.discount_type === 'free_delivery'" class="discount-badge">FREE DELIVERY</span>
                                    <span v-else-if="coupon.discount_type === 'free_installation'" class="discount-badge">FREE INSTALLATION</span>
                                    <span v-else-if="coupon.discount_type === 'combo'" class="discount-badge">COMBO OFFER</span>
                                    <span v-if="coupon.minimum_amount" class="min-amount">Min. ₹{{ coupon.minimum_amount }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Slot Selection Modal -->
        <div v-if="showSlotModal" class="modal">
            <div class="modal-content">
                <span class="close" @click="toggleSlotModal">&times;</span>
                <h2>Select a Delivery Slot</h2>
                <div>
                    <h3>Select a Day</h3>
                    <ul class="slot-list">
                        <li v-for="day in availableDays" :key="day" @click="selectDay(day)" 
                            :class="{'selected-slot': selectedDay === day}" class="slot-item">
                            {{ formatDate(day) }}
                        </li>
                    </ul>
                </div>
                <div v-if="selectedDay">
                    <h3>Select a Time</h3>
                    <ul class="slot-list">
                        <li v-for="time in availableTimes" :key="time" @click="selectTime(time)" 
                            :class="{'selected-slot': selectedTime === time}" class="slot-item">
                            {{ formatTime(time) }}
                        </li>
                    </ul>
                </div>
                <!-- Confirm Slot Button -->
                <button v-if="selectedDay && selectedTime" @click="confirmSlot" class="btn btn-primary">Confirm Slot</button>
            </div>
        </div>

        <!-- Confirmation Modal -->
        <div v-if="showConfirmationModal" class="modal">
            <div class="modal-content">
                <span class="close" @click="toggleConfirmationModal">&times;</span>
                <h2>Confirm Your Slot</h2>
                <p><strong>Date:</strong> {{ formatDate(selectedDay) }}</p>
                <p><strong>Time:</strong> {{ formatTime(selectedTime) }}</p>
                <button @click="proceedToPayment" class="btn btn-primary">Proceed to Payment</button>
            </div>
        </div>
    </div>
    `
});

export default SeatCoverDetails; 



