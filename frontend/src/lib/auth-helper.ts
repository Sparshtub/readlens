export const isClerkMocked = () => {
  // Safe environment key check
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    !pubKey || 
    pubKey.includes("placeholder") || 
    pubKey.includes("Y2xlcmsubW9jay") || // mock key base64 signature
    pubKey === "pk_test_Y2xlcmsubW9jay5hY2NvdW50cy5kZXYk"
  );
};
