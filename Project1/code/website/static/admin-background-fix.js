// Admin Background Fix Script
// This script detects admin pages and applies the appropriate background class

(function() {
    'use strict';
    
    // Function to check if current page is an admin page
    function isAdminPage() {
        // Check for admin-specific elements
        const adminIndicators = [
            '.admin-links',
            '.admin-orders-container', 
            '.admin-home',
            '.coupons-container',
            '.categories-container',
            '.brands-container',
            '.theaters-container',
            '.container.mt-4', // Add Seat Cover page pattern
            '.variant-section',
            '.color-variants-section'
        ];
        
        // Check if any admin indicators exist
        for (let selector of adminIndicators) {
            if (document.querySelector(selector)) {
                return true;
            }
        }
        
        // Check if navbar has admin characteristics (Bootstrap admin navbar)
        const navbar = document.querySelector('.navbar-light.bg-light');
        const hasContainerFluid = document.querySelector('.container-fluid');
        const hasAdminLinks = document.querySelector('.admin-links');
        
        if (navbar && hasContainerFluid) {
            return true;
        }
        
        if (hasAdminLinks) {
            return true;
        }
        
        // Check for admin form patterns
        const hasAdminForm = document.querySelector('.container.mt-4 form');
        const hasVariantSection = document.querySelector('.variant-section');
        
        if (hasAdminForm || hasVariantSection) {
            return true;
        }
        
        return false;
    }
    
    // Function to check if current page is a user page (should be excluded)
    function isUserPage() {
        const userIndicators = [
            '.navbar-userhome',
            '.container-userhome', 
            '.container-mycars'
        ];
        
        for (let selector of userIndicators) {
            if (document.querySelector(selector)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Function to apply admin background
    function applyAdminBackground() {
        console.log('🎨 Admin Background Fix: Applying admin page background');
        document.body.classList.add('admin-page');
        document.documentElement.style.background = 'linear-gradient(135deg, #e0e0e0, #b0b0b0)';
        document.body.style.background = 'linear-gradient(135deg, #e0e0e0, #b0b0b0)';
    }
    
    // Function to check and apply background
    function checkAndApplyBackground() {
        // Don't apply to user pages
        if (isUserPage()) {
            console.log('🎨 Admin Background Fix: User page detected, skipping');
            return;
        }
        
        // Don't apply to seat cover details page
        if (document.querySelector('.seat-cover-details-container')) {
            console.log('🎨 Admin Background Fix: Seat cover details page detected, skipping');
            return;
        }
        
        // Apply to admin pages
        if (isAdminPage()) {
            console.log('🎨 Admin Background Fix: Admin page detected, applying background');
            applyAdminBackground();
        } else {
            console.log('🎨 Admin Background Fix: No admin page indicators found');
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndApplyBackground);
    } else {
        checkAndApplyBackground();
    }
    
    // Also run when page content changes (for Vue.js routing)
    const observer = new MutationObserver(function(mutations) {
        let shouldCheck = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldCheck = true;
            }
        });
        
        if (shouldCheck) {
            setTimeout(checkAndApplyBackground, 100); // Small delay to let Vue render
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('🎨 Admin Background Fix script loaded');
})(); 