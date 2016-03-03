export const callbackFunctionToPromise = (fn) => {
  return new Promise((resolve, reject) => {
    fn((error, result) => {
      if (!!error) return reject(error);
      resolve(result);
    });
  });
};

export const apiExposeFromPromise = (req, res) => {
  return [
    (result) => {
      res.status(200).json(result);
    },

    (error) => {
      console.log('Error', error, error.stack);
      res.status(500).json({ message: error.message, stack: error.stack });
    },
  ];
};

export const exposePromise = (promise) => (req, res) => {
  return promise
    .then((result) => res.status(200).json(result))
    .catch((error) => res.status(500).json({ message: error.message, stack: error.stack }));
};
