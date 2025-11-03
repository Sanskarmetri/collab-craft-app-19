# Contributing to Studybyself

Thank you for your interest in contributing to Studybyself! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/studybyself.git
   cd studybyself
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Branch Strategy

- `main` - Production-ready code
- `dev` - Development branch for integration
- `feature/*` - New features (e.g., `feature/ai-chat`)
- `bugfix/*` - Bug fixes (e.g., `bugfix/timer-issue`)
- `hotfix/*` - Critical production fixes

## Development Workflow

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed

3. **Test Your Changes**
   - Ensure all existing tests pass
   - Add new tests for new features
   - Test across different browsers
   - Check mobile responsiveness

4. **Commit Your Changes**
   ```bash
   git commit -m "feat: add new feature description"
   ```

   Commit message format:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style Guidelines

- Use TypeScript for type safety
- Follow React best practices and hooks guidelines
- Use semantic HTML elements
- Implement responsive design with Tailwind CSS
- Use HSL colors from the design system (defined in `index.css`)
- Keep components small and focused
- Use meaningful variable and function names

## Design System

- All colors must use HSL format and be defined in `src/index.css`
- Use Tailwind semantic tokens (e.g., `bg-primary` instead of `bg-blue-900`)
- Follow the color palette:
  - Primary: Deep Blue (#1e3a8a)
  - Secondary: Slate Gray (#334155)
  - Accent: Emerald Green (#10b981)
- Typography: Inter font family

## Testing

- Write unit tests for utilities and hooks
- Write integration tests for complex features
- Test authentication flows thoroughly
- Verify RLS policies in Supabase

## Pull Request Guidelines

- Provide clear description of changes
- Link related issues
- Include screenshots for UI changes
- Ensure CI passes
- Request review from maintainers
- Address review comments promptly

## Database Changes

- Use Supabase migrations for schema changes
- Always include RLS policies for new tables
- Test migrations locally first
- Document schema changes in PR

## Reporting Issues

- Use GitHub Issues
- Provide clear reproduction steps
- Include browser/device information
- Add screenshots or videos if applicable
- Label appropriately (bug, enhancement, etc.)

## Questions?

Feel free to reach out to the maintainers or open a discussion on GitHub.

## Code of Conduct

Be respectful, inclusive, and professional. We're building this together!
