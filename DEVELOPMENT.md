# Development Guide

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local`
4. Contact the project administrator for staging environment credentials
5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The application requires several environment variables to run. These will be provided by the project administrator for the staging environment.

DO NOT:
- Commit any `.env` files
- Share or expose API keys
- Use production credentials in development
- Store sensitive information in code or comments

## API Access

- Use only the provided staging API endpoints
- Test data will be available in the staging environment
- Report any security concerns to the project administrator

## Deployment

- All deployments are handled by the project administrator
- Pull requests will generate preview deployments
- Code reviews will be performed before merging

## Security Guidelines

1. Never commit sensitive information
2. Use environment variables for all credentials
3. Report security vulnerabilities privately
4. Follow OWASP security best practices
5. Use strong password hashing when implementing auth
6. Implement rate limiting for API endpoints
7. Validate all user inputs
8. Use prepared statements for database queries

## Code Standards

1. Write self-documenting code
2. Add comments for complex logic
3. Follow the existing project structure
4. Write unit tests for new features
5. Use TypeScript types/interfaces
6. Follow ESLint rules
7. Format code using Prettier 