# Environment Setup Guide

## Quick Setup

1. **Copy the environment template:**
   ```bash
   cp env-template.txt .env
   ```

2. **Edit the .env file** and replace the placeholder values with your actual API keys and configuration.

## Required Environment Variables

### 🔑 **Essential (Required)**
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `JWT_SECRET` - A long, random string for JWT authentication

### 🗄️ **Database**
- `MONGO_URI` - MongoDB connection string (default: `mongodb://localhost:27017/chatbotGeminiDB4`)

### 🌐 **Server Configuration**
- `PORT` - Server port (default: `5007`)
- `BACKEND_URL` - Backend URL for internal services

### 🔧 **Optional Features**
- `OPENAI_API_KEY` - For alternative embeddings
- `ELEVENLABS_API_KEY` - For advanced text-to-speech
- `REDIS_URL` - For Redis caching (if using Redis)

## Getting API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to `GEMINI_API_KEY`

### JWT Secret
Generate a random string (at least 32 characters):
```bash
# On Windows PowerShell:
[System.Web.Security.Membership]::GeneratePassword(32, 0)

# On Linux/Mac:
openssl rand -base64 32
```

## MongoDB Setup

### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. The default connection string should work: `mongodb://localhost:27017/chatbotGeminiDB4`

### MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string and replace `MONGO_URI`

## Testing the Setup

After creating your `.env` file:

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Check for errors** - The server should start without environment variable warnings

3. **Test the API** - Visit `http://localhost:5007` to see if the server is running

## Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY environment variable is not set"**
   - Make sure you've added your Gemini API key to the `.env` file

2. **"JWT_SECRET environment variable is not set"**
   - Add a JWT secret to your `.env` file

3. **MongoDB connection errors**
   - Check if MongoDB is running
   - Verify your `MONGO_URI` is correct

4. **Port already in use**
   - Change the `PORT` in your `.env` file
   - Or kill the process using the current port

### File Structure
```
server/
├── .env                    # Your environment variables (create this)
├── env-template.txt        # Template file (this file)
├── SETUP.md               # This setup guide
└── server.js              # Main server file
```

## Security Notes

- ⚠️ **Never commit your `.env` file to version control**
- 🔒 Keep your API keys secure
- 🔄 Rotate your JWT secret regularly in production
- 🌍 Use different API keys for development and production 