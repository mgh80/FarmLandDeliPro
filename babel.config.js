module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // "nativewind/babel",  <-- BORRA ESTA LÍNEA (causa el error en v4)

      // Reanimated siempre debe ser el último plugin de la lista
      "react-native-reanimated/plugin",
    ],
  };
};
