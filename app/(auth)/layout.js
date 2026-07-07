const AuthLayout = ({ children }) => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] py-12 px-4 mt-14">
      {children}
    </div>
  );
};

export default AuthLayout;
