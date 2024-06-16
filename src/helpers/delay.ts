export const delay = async (time: number) => {
  await new Promise((resolve) =>
    setTimeout(() => {
      resolve(undefined);
    }, time),
  );
};
