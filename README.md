# Stargazer

Search through your GitHub stars with powerful filtering capabilities. Stargazer allows you to fetch all your starred repositories, including their README files, and perform fuzzy search based on custom criteria.

## Features

- Fetch all your GitHub starred repositories
- Load and index README.md content from each repository
- Fuzzy search through repository names, descriptions, and README content
- Filter repositories based on multiple criteria
- Responsive and fast static website

## Tech Stack

- **Framework**: [Svelte](https://svelte.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Hosting**: GitHub Pages
- **Build Tool**: Vite

## Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- npm or yarn
- A GitHub account (for accessing starred repositories)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/arcaartem/stargazer.git
cd stargazer
```

2. Install dependencies:

```bash
npm install
# or if you use yarn
yarn install
```

## Development

To run the project locally:

```bash
npm run dev
# or
yarn dev
```

This will start the development server at `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory, ready to be deployed to GitHub Pages.

## Testing

Run the test suite:

```bash
npm run test
# or
yarn test
```

## Deployment

The project is configured for GitHub Pages deployment. To deploy:

1. Update the `base` property in `vite.config.ts` to match your repository name:

```typescript
export default defineConfig({
	base: '/stargazer/'
	// ... other config
});
```

2. Push to the `main` branch, and GitHub Actions will automatically deploy to Pages.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
