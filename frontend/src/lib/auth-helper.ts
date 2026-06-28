export const isClerkMocked = () => {
  // Safe environment key check
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return !pubKey || pubKey.includes("placeholder");
};
