import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { isClerkMocked } from "@/lib/auth-helper";

export function useAppAuth() {
  // Check if Clerk is mocked
  const isMock = isClerkMocked();

  if (isMock) {
    return {
      userId: "mock_user_123",
      getToken: async () => "mock_user_123",
      isLoaded: true,
      isSignedIn: true,
    };
  }

  // Use real Clerk hook if keys are active
  return useClerkAuth();
}
