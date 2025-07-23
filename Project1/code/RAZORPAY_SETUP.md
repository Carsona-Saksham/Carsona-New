# Razorpay Payment Gateway Setup

## Prerequisites
1. Create a Razorpay account at https://razorpay.com/
2. Get your API credentials from the Razorpay Dashboard

## Configuration Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Update Razorpay Credentials
In `website/__init__.py`, replace the placeholder values with your actual Razorpay credentials:

```python
# Razorpay Configuration
app.config['RAZORPAY_KEY_ID'] = 'rzp_test_your_key_id_here'  # Replace with your actual key
app.config['RAZORPAY_KEY_SECRET'] = 'your_key_secret_here'  # Replace with your actual secret
```

### 3. Test Mode vs Live Mode
- For testing: Use test credentials (starts with `rzp_test_`)
- For production: Use live credentials (starts with `rzp_live_`)

### 4. Webhook Setup (Optional)
For production, you may want to set up webhooks to handle payment status updates:
1. Go to Razorpay Dashboard > Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payment_webhook`
3. Select events: `payment.captured`, `payment.failed`

## Payment Flow

1. User selects product and proceeds to payment
2. Frontend calls `/api/create_razorpay_order` to create a Razorpay order
3. Razorpay checkout modal opens for payment
4. After successful payment, frontend calls `/api/verify_payment` with payment details
5. Backend verifies payment signature and creates order in database
6. User is redirected to orders page

## Security Notes

- Never expose your Key Secret in frontend code
- Always verify payment signatures on the backend
- Use HTTPS in production
- Store credentials as environment variables in production

## Testing

Use Razorpay's test card numbers for testing:
- Card Number: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

## Support

For Razorpay integration issues, refer to:
- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: https://razorpay.com/support/ 