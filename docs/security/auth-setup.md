
# Auth0 and Netlify Setup Guide

This guide walks you through configuring Auth0 for your Patient Flow
Management application and deploying it to Netlify.

## Auth0 Setup

### 1. Create an Auth0 Accoun

If you don't already have one, [sign up for a free Auth0 account](https://auth0.com/signup).

### 2. Create a New Application

1. Once logged in to the Auth0 Dashboard, navigate to
   **Applications** > **Applications**.
2. Click **+ Create Application**.
3. Enter a name for your application
   (e.g., "Patient Flow Management").
4. Select **Single Page Web Application** as the application type.
5. Click **Create**.

### 3. Configure Application Settings

In your new application's settings, configure the following:

#### Basic Information

- Take note of your **Domain** and **Client ID** - you'll need these for
  your application.

#### Application URIs

For local development:

- **Allowed Callback URLs**: `http://localhost:5173`

- **Allowed Logout URLs**: `http://localhost:5173`

- **Allowed Web Origins**: `http://localhost:5173`

For Netlify deployment (add these after you know your Netlify URL):

- **Allowed Callback URLs**: `https://your-netlify-app.netlify.app`

- **Allowed Logout URLs**: `https://your-netlify-app.netlify.app`

- **Allowed Web Origins**: `https://your-netlify-app.netlify.app`

> **Note**: You can add multiple URLs for each setting, separated by
> commas.

#### Advanced Settings

- Under **Advanced Settings** > **OAuth**, ensure
  **JsonWebToken Signature Algorithm** is set to `RS256`.

### 4. Create an API (Optional, for Backend Integration)

If you plan to use a backend API:

1. Go to **Applications** > **APIs**.
2. Click **+ Create API**.
3. Enter a name (e.g., "Patient Flow API").
4. Enter an identifier (e.g., `https://api.patientflow.com`).
5. Select `RS256` as the signing algorithm.
6. Click **Create**.

## Netlify Deploymen

### 1. Set Up Your Repository for Netlify

Ensure your project has:

- A `netlify.toml` file with proper configuration

- Build settings for Vite

### 2. Connect to Netlify

1. Push your code to GitHub, GitLab, or Bitbucket.
2. Log in to [Netlify](https://app.netlify.com/).
3. Click **New site from Git**.
4. Select your repository and follow the setup instructions.
5. For the build command, enter: `npm run build`
6. For the publish directory, enter: `dist`
7. Click **Deploy site**.

### 3. Configure Environment Variables in Netlify

Go to **Site settings** > **Environment variables** and add the following
variables:

- `VITE_AUTH0_DOMAIN`: Your Auth0 domain

- `VITE_AUTH0_CLIENT_ID`: Your Auth0 client ID

- `VITE_AUTH0_AUDIENCE`: Your Auth0 API identifier (if using an API)

- `VITE_AUTH0_REDIRECT_URI`: Your Netlify app URL

### 4. Update Auth0 Configuration

After deployment, go back to your Auth0 application settings and add your
Netlify app URL to the callback URLs, logout URLs, and web origins as
mentioned in step 3.

## Local Development with Auth0

1. Create a `.env.local` file in the root of your project with the
   following:

```env
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_AUDIENCE=https://api.patientflow.com

```

1. Replace the values with your actual Auth0 application settings.

2. Run your application in development mode:

```bash
npm run dev

```

## Troubleshooting

### Common Issues

1. **Login Doesn't Work**:

   - Verify Auth0 domain and client ID are correc
   - Check if callback URLs are correctly configured in Auth0

2. **Redirect Issues After Login**:

   - Ensure the redirect URI matches exactly with what's configured in
     Auth0

3. **Netlify Deployment Fails**:

   - Confirm your `netlify.toml` file is configured correctly
   - Verify environment variables are set in the Netlify dashboard

4. **CORS Errors**:

   - Make sure your Auth0 application has the correct Allowed Web
     Origins
