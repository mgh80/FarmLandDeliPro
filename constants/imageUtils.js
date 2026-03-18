export const getOptimizedImageUrl = (
  originalUrl,
  width = 400,
  height = 400,
) => {
  if (!originalUrl) return null;
  return originalUrl;
};

// export const getOptimizedImageUrl = (
//   originalUrl,
//   width = 400,
//   height = 400,
// ) => {
//   if (!originalUrl) return null;

//   if (originalUrl.includes("/storage/v1/object/public/")) {
//     return (
//       originalUrl.replace(
//         "/storage/v1/object/public/",
//         "/storage/v1/render/image/public/",
//       ) + `?width=${width}&height=${height}&quality=75&format=webp&resize=cover`
//     );
//   }

//   return originalUrl;
// };
