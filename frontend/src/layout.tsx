import React from 'react';
import { Outlet } from 'react-router';

const Layout = () => {
  return (
    // <div className="app-layout">
    //   <header>
    //     <h1>App Header</h1>
    //   </header>
    <main>
      <Outlet /> {/* This is where child routes will render */}
    </main>
    // <footer>
    //   <p>App Footer</p>
    // </footer>
    // </div>
  );
};

export default Layout;
