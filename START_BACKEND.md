# Start Backend Server

## Quick Start

### 1. Open a new terminal/command prompt

### 2. Navigate to backend folder
```bash
cd backend
```

### 3. Install dependencies (if not already done)
```bash
npm install
```

### 4. Start the server
```bash
npm start
```

You should see:
```
✓ Email service initialized
✓ Connected to MongoDB successfully
✓ Server running on port 3000
```

## If You See Errors

### Error: "Email service initialization failed"
This is OK! The email service will still work, it just means the credentials aren't set yet.

### Error: "MongoDB connection failed"
Check your `.env` file has the correct `MONGODB_URI`

### Error: "Port 3000 is already in use"
Another process is using port 3000. Either:
1. Stop the other process
2. Change the port in `.env`: `PORT=3001`

## Testing the Backend

Once running, open your browser and go to:
```
https://budget-tracker-react-native-kjff.onrender.com/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": {
    "status": "connected"
  }
}
```

## For Android Testing

If testing on Android physical device:
1. Make sure your phone and computer are on the same WiFi network
2. Find your computer's IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet)
3. Update `frontend/app/utils/constants.ts` with your IP
4. Make sure Windows Firewall allows port 3000

## Common Issues

### Backend won't start
- Check if Node.js is installed: `node --version`
- Check if npm is installed: `npm --version`
- Delete `node_modules` and run `npm install` again

### Can't connect from phone
- Check firewall settings
- Verify both devices on same network
- Try using Render backend instead (set `USE_LOCAL = false` in constants.ts)

## Stop the Server

Press `Ctrl + C` in the terminal where the server is running.
