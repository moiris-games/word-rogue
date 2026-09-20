const { withAppBuildGradle } = require("@expo/config-plugins");

// Injects a release signingConfig into android/app/build.gradle on every
// `expo prebuild`, reading the actual keystore path/passwords from
// environment variables at Gradle build time (never baked into the repo or
// into app.json). Falls back to debug signing if those env vars aren't
// set, so a plain local `./gradlew assembleDebug` still works with no setup.
//
// Expected env vars at gradle build time:
//   ANDROID_RELEASE_STORE_FILE      absolute path to the .keystore/.jks
//   ANDROID_RELEASE_STORE_PASSWORD
//   ANDROID_RELEASE_KEY_ALIAS
//   ANDROID_RELEASE_KEY_PASSWORD
function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    const signingConfig = `
    release {
        if (System.getenv("ANDROID_RELEASE_STORE_FILE")) {
            storeFile file(System.getenv("ANDROID_RELEASE_STORE_FILE"))
            storePassword System.getenv("ANDROID_RELEASE_STORE_PASSWORD")
            keyAlias System.getenv("ANDROID_RELEASE_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_RELEASE_KEY_PASSWORD")
        } else {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

    const contents = config.modResults.contents;

    if (contents.includes("ANDROID_RELEASE_STORE_FILE")) {
      return config;
    }

    config.modResults.contents = contents
      .replace(
        /signingConfigs\s*{/,
        `signingConfigs {${signingConfig}`,
      )
      .replace(
        /(In production, you need to generate your own keystore file[\s\S]*?signingConfig\s+signingConfigs\.)debug/,
        "$1release",
      );

    return config;
  });
}

module.exports = withAndroidSigning;
