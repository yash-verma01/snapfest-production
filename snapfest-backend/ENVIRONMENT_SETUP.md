# 🔐 SNAPFEST BACKEND ENVIRONMENT SETUP

## **📋 REQUIRED ENVIRONMENT VARIABLES**

Create a `.env` file in your `snapfest-backend` directory with the following variables:

### **1. SERVER CONFIGURATION**
```bash
NODE_ENV=development
PORT=5001
```

### **2. DATABASE CONFIGURATION**
```bash
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/SnapFest?retryWrites=true&w=majority
```

### **3. JWT AUTHENTICATION**
```bash
# Generate a strong secret key (32+ characters)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d
```

### **4. ADMIN CREDENTIALS**
```bash
# Admin login credentials (already set in your code)
ADMIN_EMAIL=admin100@gmail.com
ADMIN_PASSWORD=1212121212
```

### **5. RAZORPAY PAYMENT GATEWAY** ⭐ **REQUIRED**
```bash
# Get these from: https://razorpay.com/dashboard/app/keys
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### **6. CLOUDINARY IMAGE STORAGE** ⭐ **REQUIRED**
```bash
# Get these from: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### **7. FRONTEND URL**
```bash
# For payment callbacks and CORS
FRONTEND_URL=http://localhost:5173
```

---

## **🚀 SETUP INSTRUCTIONS**

### **Step 1: Create .env File**
```bash
cd snapfest-backend
touch .env
```

### **Step 2: Add Required Variables**
Copy the variables above into your `.env` file and replace the placeholder values.

### **Step 3: Get Razorpay Keys** ⭐ **CRITICAL**
1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a free account
3. Go to Dashboard → Settings → API Keys
4. Generate test keys
5. Copy your Key ID and Secret to the `.env` file

### **Step 4: Get Cloudinary Keys** ⭐ **CRITICAL**
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to Dashboard → Settings → API Keys
4. Copy your Cloud Name, API Key, and API Secret to the `.env` file

### **Step 5: Generate JWT Secret**
```bash
# Generate a random JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## **✅ CURRENT STATUS**

### **✅ ALREADY CONFIGURED:**
- ✅ **Database**: MongoDB Atlas connection working
- ✅ **Admin Credentials**: Set to `admin100@gmail.com` / `1212121212`
- ✅ **JWT Authentication**: Working with default secret
- ✅ **Server Configuration**: Running on port 5001
- ✅ **CORS**: Configured for frontend

### **❌ MISSING (REQUIRED FOR FULL FUNCTIONALITY):**
- ❌ **Razorpay Keys**: Payment processing won't work
- ❌ **Cloudinary Keys**: Image uploads won't work
- ❌ **JWT Secret**: Should be changed for production

---

## **🔧 OPTIONAL ENHANCEMENTS**

### **Email Configuration (Optional)**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### **SMS Configuration (Optional)**
```bash
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## **🎯 PRIORITY ORDER**

### **🔥 IMMEDIATE (Required for basic functionality):**
1. **Razorpay Keys** - For payment processing
2. **Cloudinary Keys** - For image uploads
3. **JWT Secret** - For security

### **📈 LATER (Optional enhancements):**
1. **Email Configuration** - For notifications
2. **SMS Configuration** - For OTP delivery
3. **Production Environment Variables**

---

## **🚨 SECURITY NOTES**

- ✅ **Never commit `.env` file to version control**
- ✅ **Use strong, unique secrets for production**
- ✅ **Rotate secrets regularly**
- ✅ **Use different credentials for development/production**

---

## **✅ VERIFICATION**

After setting up your `.env` file:

1. **Restart your backend server**
2. **Test payment flow** (requires Razorpay keys)
3. **Test image upload** (requires Cloudinary keys)
4. **Test admin login** (should work with current credentials)

---

## **🎉 YOU'RE READY!**

Once you add the Razorpay and Cloudinary keys, your SnapFest platform will be fully functional with:
- ✅ Payment processing
- ✅ Image uploads
- ✅ Complete user journey
- ✅ Production-ready backend