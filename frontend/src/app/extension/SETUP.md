# Setup Guide for Your Chrome Extension

   ```
1. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

## Development Mode
To run the extension in development mode:
2. Build the project:
   ```sh
   npm run build
   # or
   yarn build
   ```
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in the top right corner)
5. Click **Load unpacked** and select the `dist/` folder


## Running in Watch Mode (for Development)
```sh
npm run dev
# or
yarn dev
```
This will keep the build running and update changes automatically.



