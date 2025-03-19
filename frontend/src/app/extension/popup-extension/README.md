# Chrome Extension Setup Guide

This guide will help you set up and run your Chrome extension in both development and production modes.

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (with npm) or [Yarn](https://yarnpkg.com/)
- Google Chrome

## Installation

Before running the extension, install the dependencies:

```sh
npm install
# or
yarn install
```


```sh
npx tsc
```

## Running in Development Mode

To run the extension in development mode:

1. Build the project:
   ```sh
   npm run build
   # or
   yarn build
   ```

  ![WhatsApp Image 2025-03-19 at 20 43 06_8c5fc2fe](https://github.com/user-attachments/assets/a816942a-30e8-47a6-93e9-946c90c826a9)
  
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `dist/` folder


## Additional Notes

- If you encounter any issues Please refer to the youtube setup video :- [Youtube Demo Link](https://www.youtube.com/watch?v=efRQuCtBulE)
- Make sure to reload the extension from the **Extensions** page (`chrome://extensions/`) after making changes.

## Troubleshooting
- Extension Not Loading: Ensure the dist/ folder exists after building.
- Changes Not Reflecting: Reload the extension from chrome://extensions/.


