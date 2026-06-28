import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8 flex flex-col items-center">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            ReadLens <span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Read anything. Understand everything.
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
