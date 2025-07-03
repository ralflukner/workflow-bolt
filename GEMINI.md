---
version: 1
project_setup:

  - command: npm install
    reason: "Install dependencies for the project."
project_type: "React/TypeScript with Firebase and a CLI"
style_guide:
  - "Use TypeScript for all new code."
  - "Follow the existing coding style and conventions."
  - "Run `npm run lint` and `npm run lint:md` to ensure code and documentation quality."
testing:
  - "Run `npm test` to execute the test suite."
  - "Write unit tests for new features and bug fixes."
  - "Use `npm run test:integration` for integration tests."
  - "Use `npm run test:real-api` for tests that interact with real APIs."
commits:
  - "Follow the conventional commit format: `feat: <description>`, `fix: <description>`, etc."
  - "Commit messages should be descriptive and follow the style of `commit_message_revised.txt`."
  - "Run `npm run deploy:safe` to safely deploy and verify changes."
