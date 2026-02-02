# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


## Prerequisites
- Node.js and npm installed
- Android Studio with custom emulator configured
- Firebase project created

## Notes
1. Install just Android SDK version 15 as listed in instructions on expo documentation (referenced in Step 4).
2. When looking for emulators, you will need to make a custom device to make it match the proper dimensions of the Lenovo Tab M10 Plus that we will be using. To do this, on Step 3 of "Setup an Emulator" from the link below, click "New Hardware Profile" at the bottom of the window. The only setup information that needs to be changed is the Size: 10.61" and Resolution: 2000 × 1200 to these settings. Ensure the API is called "Android 15.0 "VanillaIceCream" | arm64" and leave the default settings.

## Setup

1. Clone this repository
2. Install Expo CLI. If you haven’t installed Expo globally yet, run the following command:
`npm install -g expo-cli`
3. Change directories with `cd MuskegonPolishFestival`
4. Install dependencies: `npm install`
5. Install Android emulators from Android studio from https://docs.expo.dev/workflow/android-studio-emulator/
Follow from steps "Install Watchman and JDK" down to "Set up an Emulator" (with support for both Mac and PC)
6. Press play in the emulators screen on Android Studio (for the custom one you've made. More information in Step 2 of the Notes section of this README.)
5. `npx expo start` and open android simulator by clicking 'a'
7. Start the Android emulator from Android Studio with run the app: `npm run android`
