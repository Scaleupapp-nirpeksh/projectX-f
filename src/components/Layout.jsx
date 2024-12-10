import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 min-h-screen text-white">
      {/* Fixed Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-blue-600 shadow-md sticky top-0 z-50">
        <h1 className="text-3xl font-bold">ProjectX</h1>
        <nav className="space-x-6">
          <a
            href="/"
            className="bg-white text-blue-600 px-4 py-2 rounded shadow hover:bg-gray-200 transition"
          >
            Login
          </a>
          <a
            href="/register"
            className="bg-purple-700 text-white px-4 py-2 rounded shadow hover:bg-purple-800 transition"
          >
            Sign Up
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-blue-700 text-white text-center py-4 mt-auto">
        <p className="text-sm">© 2024 ProjectX. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
