const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

let config = getDefaultConfig(__dirname);

// SVG transformeri üçün lazımdır
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...config.resolver,
  assetExts: [...config.resolver.assetExts.filter(ext => ext !== "svg"), "otf", "ttf"],
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

// NativeWind ilə birləşdiririk
config = mergeConfig(config, {});

module.exports = withNativeWind(config, { input: "./global.css" });
