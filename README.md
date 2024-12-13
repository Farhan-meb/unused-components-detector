# Unused Components Detector

A CLI tool to detect unused React components in your project.

## Installation

```bash
npm install -g unused-components-detector
```

## Usage

```bash
npx unused-components-detector
```

### Options

-   `-i, --ignore <paths...>`: Paths to ignore (overrides config file)
-   `-e, --extensions <extensions...>`: File extensions to scan (overrides config file)
-   `-d, --directory <path>`: Root directory to scan (defaults to current directory)
-   `-c, --config <path>`: Path to config file (defaults to ucd-config.json)
-   `-v, --verbose`: Enable verbose logging
-   `--no-color`: Disable colored output

### Configuration

Create a `ucd-config.json` in your project root:

```json
{
    "ignore": [
        "node_modules/**",
        "build/**",
        "dist/**",
        "**/*.test.*",
        "**/*.spec.*"
    ],
    "extensions": [".js", ".jsx", ".ts", ".tsx"],
    "rootDir": "./src"
}
```

### Features

-   Detects unused React components across your project
-   Supports JavaScript and TypeScript files
-   Handles both default and named exports
-   Ignores test files and specified directories
-   Provides detailed report of unused components
-   Fast and efficient scanning algorithm

### Example Output

```bash
Scanning for unused components...

Found 3 unused components:
- UnusedButton (src/components/UnusedButton.tsx)
- OldNavbar (src/components/deprecated/OldNavbar.jsx)
- UnusedForm (src/features/unused/UnusedForm.tsx)

Scan completed in 0.45s
```

### Requirements

-   Node.js 14.0.0 or higher
-   npm or yarn package manager

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

<!-- ### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. -->

### Support

For bugs and feature requests, please [open an issue](https://github.com/farhan-meb/unused-components-detector/issues).
