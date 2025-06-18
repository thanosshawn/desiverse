
# DesiVerse Bae - Your Virtual Desi Companion 💖

DesiVerse Bae is a Next.js web application that allows users to chat with AI-powered virtual "Desi" companions. The chatbots communicate in Hinglish (a mix of Hindi and English) and are designed to offer engaging, culturally relevant, and personalized interactions, including text, voice, and video replies.

The application uses Firebase Realtime Database for storing character metadata and user chat data, Supabase for storing image assets (avatars, backgrounds), and Genkit with Gemini for AI-driven chat responses and media generation.

## ✨ Features

- **Authentic Hinglish Chat:** AI characters converse naturally in Hinglish, mirroring real-life conversations.
- **Personalized AI Characters:** Each character has a unique personality, backstory, voice tone, and style, defined by a base prompt and style tags.
- **Dynamic Responses:** Utilizes Google's Gemini models via Genkit to generate text, voice, and video replies.
- **User Authentication:** Firebase Authentication (Google Sign-In, Anonymous Sign-In).
- **Realtime Chat:** Messages are stored and synced in real-time using Firebase Realtime Database.
- **Supabase Asset Storage:** Character avatars and background images are hosted on Supabase Storage, with direct upload from admin interface.
- **Admin Character Creation:** A dedicated admin page to create and define new AI characters, including image uploads to Supabase.
- **Responsive Design:** UI built with Next.js, React, ShadCN UI components, and Tailwind CSS.
- **Theming:** Light and Dark mode support with a custom color palette.
- **Optimized Images:** Uses `next/image` for optimized image delivery.

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **UI Components:** ShadCN UI
- **Styling:** Tailwind CSS
- **AI Integration:** Genkit, Google Gemini models (Gemini Flash for text, Gemini 2.0 Flash Experimental for image/video generation)
- **Database:** Firebase Realtime Database (for character metadata, user profiles, chat sessions)
- **Authentication:** Firebase Authentication
- **File Storage:** Supabase Storage (for character avatars and background images)
- **Supabase Client:** `@supabase/supabase-js` for interacting with Supabase Storage.
- **State Management:** React Context API (for Auth), `react-hook-form` (for forms)
- **Validation:** Zod

## 📁 Project Structure

```
.
├── .env.local          # Local environment variables (Firebase & Supabase keys - GITIGNORED)
├── .vscode/            # VS Code settings
├── apphosting.yaml     # Firebase App Hosting configuration
├── components.json     # ShadCN UI configuration
├── database.rules.json # Firebase Realtime Database security rules
├── next.config.ts      # Next.js configuration (image hostnames, etc.)
├── package.json        # Project dependencies and scripts
├── public/             # Static assets (e.g., favicon)
├── src/
│   ├── ai/             # Genkit AI integration
│   │   ├── dev.ts      # Genkit development server entry point
│   │   ├── flows/      # Genkit flows for AI interactions
│   │   └── genkit.ts   # Genkit global configuration
│   ├── app/            # Next.js App Router pages and layouts
│   │   ├── (main)/     # Route group for main app pages
│   │   │   ├── page.tsx            # Landing/Home page
│   │   │   ├── chat/
│   │   │   │   ├── [characterId]/page.tsx # Dynamic chat page for a character
│   │   │   │   └── page.tsx        # Redirect/placeholder for base /chat route
│   │   │   └── admin/
│   │   │       ├── create-character/page.tsx # Admin page for character creation
│   │   │       └── actions.ts      # Server actions for admin functionalities
│   │   ├── actions.ts        # Server actions for chat functionalities
│   │   ├── globals.css       # Global styles and Tailwind CSS theme variables
│   │   └── layout.tsx        # Root layout
│   ├── components/       # Reusable UI components
│   │   ├── chat/           # Chat-specific components (layout, messages, input, avatar)
│   │   ├── layout/         # Layout components (e.g., Header)
│   │   └── ui/             # ShadCN UI components
│   ├── contexts/         # React Context providers (e.g., AuthContext)
│   ├── hooks/            # Custom React hooks (e.g., useToast, useMobile)
│   ├── lib/              # Core logic, utilities, types
│   │   ├── firebase/       # Firebase setup and service functions
│   │   │   ├── config.ts   # Firebase initialization
│   │   │   └── rtdb.ts     # Firebase Realtime Database interaction functions
│   │   ├── supabase/       # Supabase client setup and utility functions
│   │   │   └── client.ts   # Supabase client initialization and storage helpers
│   │   ├── types.ts        # TypeScript type definitions
│   │   └── utils.ts        # Utility functions (e.g., cn for Tailwind)
│   └── tailwind.config.ts  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A Firebase project
- A Supabase project

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up Environment Variables

Create a `.env.local` file in the root of your project and add your Firebase and Supabase credentials.

**Firebase:**
1.  Go to your Firebase project settings.
2.  Under "Your apps", find your web app configuration.
3.  Copy the necessary values.

**Supabase:**
1.  Go to your Supabase project dashboard.
2.  Navigate to Project Settings > API.
3.  Find your Project URL and anon public key.

Your `.env.local` file should look like this:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyYOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com

# Google AI (Gemini) API Key for Genkit
# Ensure this key has access to the Gemini API
GOOGLE_API_KEY=your_google_ai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

**Important:**
- Replace placeholders with your actual keys and URLs.
- Ensure your `GOOGLE_API_KEY` is for a project that has the "Generative Language API" (or "Vertex AI API" if using Vertex models) enabled.
- For `NEXT_PUBLIC_SUPABASE_URL`, use the URL from your Supabase project's API settings (e.g., `https://xyzabc.supabase.co`).
- For `NEXT_PUBLIC_SUPABASE_ANON_KEY`, use the `anon` `public` key from your Supabase project's API settings.

### 4. Configure Firebase

- **Authentication:** Enable Google Sign-In and Anonymous Sign-In in the Firebase console (Authentication > Sign-in method).
- **Realtime Database:**
    - Set up your Realtime Database in the Firebase console.
    - Update the security rules in `database.rules.json` and deploy them to your Firebase project. The provided rules offer a basic structure; review and adapt them to your security needs.

### 5. Configure Supabase Storage

1.  In your Supabase project, go to **Storage**.
2.  Create a new **public bucket**. A common name is `character-assets`.
3.  Inside this bucket, you can create folders like `avatars` and `backgrounds` to organize your images.
    *   **Bucket Policies (Important for Uploads):** Ensure your bucket policies allow `anon` role to perform `insert` (upload) operations. You might need to add policies like this (check Supabase docs for latest best practices):
        ```sql
        -- Allow anonymous uploads to the 'avatars' folder
        CREATE POLICY "Allow anon uploads to avatars"
        ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'character-assets' AND (storage.foldername(name))[1] = 'avatars');

        -- Allow anonymous uploads to the 'backgrounds' folder
        CREATE POLICY "Allow anon uploads to backgrounds"
        ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'character-assets' AND (storage.foldername(name))[1] = 'backgrounds');

        -- Allow public read access to all files in the bucket
        CREATE POLICY "Public read access for character-assets"
        ON storage.objects FOR SELECT TO public USING (bucket_id = 'character-assets');
        ```
        You can set these up in the Supabase SQL Editor or under Storage > Policies.
4.  You don't need to manually upload images if you use the admin interface, as it will upload them directly.

### 6. Update `next.config.ts` for Image Hostnames

Open `next.config.ts` and update the `remotePatterns` for `next/image` to include your Supabase project's hostname:

```ts
// next.config.ts
// ...
images: {
  remotePatterns: [
    // ... other patterns
    {
      protocol: 'https',
      // IMPORTANT: Replace 'your-project-ref' with your actual Supabase project reference
      // This is the 'xyzabc' part if your URL is 'https://xyzabc.supabase.co'
      hostname: 'your-project-ref.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**', // Allow access to public objects in storage
    }
  ],
},
// ...
```
Replace `your-project-ref.supabase.co` with your actual Supabase project hostname (e.g., `xyzabc.supabase.co`).

### 7. Run the Development Server

```bash
npm run dev
```

The application should now be running on `http://localhost:9002` (or your configured port).

### 8. (Optional) Run Genkit Developer UI

To inspect Genkit flows, traces, and prompts:

```bash
npm run genkit:dev
# or for auto-reloading on changes
npm run genkit:watch
```
This will typically start the Genkit UI on `http://localhost:4000`.

## 🧑‍💻 Admin: Creating Characters

1.  Navigate to `/admin/create-character` in your running application.
2.  Fill out the form with the character's details:
    - **Name:** Character's display name.
    - **Description:** A short bio.
    - **Avatar Image:** Use the file input to upload an avatar. It will be uploaded to Supabase, and the URL field will be auto-populated.
    - **Background Image (Optional):** Use the file input to upload a background image.
    - **Base Prompt:** The core personality prompt for the AI.
    - **Style Tags:** Comma-separated list of tags.
    - **Default Voice Tone:** Describes the character's voice style.
    - **Image AI Hint (Optional):** For placeholder images.
3.  Submit the form. The character data (with Supabase image URLs) will be saved to Firebase Realtime Database.
4.  The new character should appear on the homepage.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is unlicensed (or specify your license, e.g., MIT License).
```
