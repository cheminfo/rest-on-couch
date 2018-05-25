import React from 'react';
import { NavLink } from 'react-router-dom';

export default function SidebarLink({ to, icon, text }) {
  return (
    <li>
      <NavLink to={to} activeClassName="active">
        <i className={`fa fa-${icon}`} />
        <p>{text}</p>
      </NavLink>
    </li>
  );
}
