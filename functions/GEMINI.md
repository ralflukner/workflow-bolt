---
version: 1
project_type: "Firebase Cloud Functions (Node.js/TypeScript)"
style_guide:

  - "Follow the existing coding style and conventions."
  - "Ensure Firebase Admin SDK is initialized before use."
  - "Use `npm run lint` to check code quality."
deployment:
  - "Deploy functions using the `gcloud functions deploy` command."
  - "Refer to the `functions/README.md` for detailed deployment instructions."
  - "Use `npm run deploy:safe` from the root directory for a safe deployment workflow."
testing:
  - "Run `npm test` to execute the test suite for the functions."
