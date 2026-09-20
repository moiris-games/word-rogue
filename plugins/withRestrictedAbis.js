const { withGradleProperties } = require("@expo/config-plugins");

// Drops x86/x86_64 from the native build - real Android phones haven't
// shipped x86 chips in years (Intel exited mobile), so those two
// architectures are effectively emulator-only. Building all 4 doubles
// native C++ compile time (CMake compiles once per architecture) for
// coverage that's essentially unused in practice. armeabi-v7a stays for
// older 32-bit devices; arm64-v8a covers virtually everything current.
function withRestrictedAbis(config) {
  return withGradleProperties(config, (config) => {
    const key = "reactNativeArchitectures";
    const value = "armeabi-v7a,arm64-v8a";

    const existing = config.modResults.find(
      (item) => item.type === "property" && item.key === key,
    );

    if (existing) {
      existing.value = value;
    } else {
      config.modResults.push({ type: "property", key, value });
    }

    return config;
  });
}

module.exports = withRestrictedAbis;
