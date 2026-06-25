import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const ClientLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950 transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default ClientLayout;