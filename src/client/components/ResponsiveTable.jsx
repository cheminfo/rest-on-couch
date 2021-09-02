import React from 'react';

const ResponsiveTable = ({ children }) => (
  <div className="table-responsive table-full-width">
    <table className="table">{children}</table>
  </div>
);

export default ResponsiveTable;
