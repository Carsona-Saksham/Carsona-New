# Carsona Deployment Guide

## Hosting Your Carsona Application on Railway

### Prerequisites
1. GitHub account with your code pushed
2. Railway account (sign up at railway.app)
3. Domain name: carsona.in

### Step 1: Deploy to Railway

1. **Sign up/Login to Railway**
   - Go to https://railway.app
   - Sign up with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `car` repository
   - Select the `Stable1` branch

3. **Configure Environment Variables**
   In Railway dashboard, go to your project → Variables tab and add:
   ```
   FLASK_ENV=production
   SECRET_KEY=your-super-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here
   RAZORPAY_KEY_ID=rzp_test_JxYJu0YoE8Yxhr
   RAZORPAY_KEY_SECRET=LGHC5aSWEcDRUyXh81d3nvBR
   ```

4. **Add Database**
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set DATABASE_URL

5. **Add Redis**
   - Click "New" → "Database" → "Redis"
   - Railway will automatically set REDIS_URL

### Step 2: Configure Custom Domain

1. **In Railway Dashboard**
   - Go to your project → Settings → Domains
   - Click "Custom Domain"
   - Enter: `carsona.in`

2. **Configure DNS (at your domain registrar)**
   Add these DNS records:
   ```
   Type: CNAME
   Name: @
   Value: [railway-provided-domain]
   
   Type: CNAME  
   Name: www
   Value: [railway-provided-domain]
   ```

### Step 3: Production Checklist

- [ ] Environment variables set
- [ ] Database connected
- [ ] Redis connected
- [ ] Custom domain configured
- [ ] SSL certificate (automatic with Railway)
- [ ] Test payment flow with Razorpay

### Alternative: Deploy to Render

If you prefer Render:

1. **Sign up at render.com**
2. **Connect GitHub repository**
3. **Configure as Web Service**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn main:app`
4. **Add environment variables** (same as above)
5. **Add PostgreSQL database**
6. **Configure custom domain**

### Step 4: Post-Deployment

1. **Test your application**
   - Visit https://carsona.in
   - Test user registration/login
   - Test payment flow
   - Test admin features

2. **Monitor logs**
   - Check Railway/Render logs for any errors
   - Monitor database connections

### Troubleshooting

**Common Issues:**
1. **Database connection errors**: Check DATABASE_URL environment variable
2. **Redis connection errors**: Check REDIS_URL environment variable
3. **Payment errors**: Verify Razorpay credentials
4. **Static files not loading**: Check file paths in production

**Support:**
- Railway: https://docs.railway.app
- Render: https://render.com/docs

### Cost Estimation

**Railway (Recommended):**
- Free tier: $0/month (with limitations)
- Pro tier: ~$5-20/month (depending on usage)

**Render:**
- Free tier: $0/month (with limitations)
- Paid tier: ~$7-25/month

Both platforms offer free tiers suitable for testing and small applications. 