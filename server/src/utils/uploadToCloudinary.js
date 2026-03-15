// import cloudinary from "../config/cloudinary.js";

// const uploadBufferToCloudinary = (fileBuffer, options = {}) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder: "employee-verify/employees",
//         resource_type: "image",
//         ...options
//       },
//       (error, result) => {
//         if (error) return reject(error);
//         resolve(result);
//       }
//     );

//     stream.end(fileBuffer);
//   });
// };

// export default uploadBufferToCloudinary;


import cloudinary from "../config/cloudinary.js";

const uploadBufferToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "employee-verify/employees",
        resource_type: "image",
        ...options
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

export default uploadBufferToCloudinary;