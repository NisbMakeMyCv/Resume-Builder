# Google Login Integration (Frontend)

To implement Google OAuth2 in the React/Next.js frontend, follow these steps:

1. **Install the official Google library:**
   ```bash
   npm install @react-oauth/google
   ```

2. **Wrap your App with the Provider:**
   ```javascript
   import { GoogleOAuthProvider } from '@react-oauth/google';
   
   <GoogleOAuthProvider clientId="YOUR_TEAM_CLIENT_ID.apps.googleusercontent.com">
      <App />
   </GoogleOAuthProvider>
   ```

3. **Render the Login Button:**
   ```javascript
   import { GoogleLogin } from '@react-oauth/google';

   <GoogleLogin
     onSuccess={async (credentialResponse) => {
       // Send credentialResponse.credential to our backend!
       const response = await fetch("http://localhost:8000/api/v1/auth/google", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ token: credentialResponse.credential })
       });
       const data = await response.json();
       // Save data.access_token to LocalStorage/Cookies!
     }}
     onError={() => console.log('Login Failed')}
   />
   ```
