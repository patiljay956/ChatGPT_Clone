import { SignIn } from "@clerk/nextjs";
const page = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <SignIn forceRedirectUrl={"/"} />
    </div>
  );
};

export default page;