import { NavLink } from 'react-router-dom';

export default function SidebarLink({ to, icon, text }) {
  return (
    <li>
      <NavLink to={to} className={(props) => (props.isActive ? 'active' : '')}>
        <i className={`fa fa-${icon}`} />
        <p>{text}</p>
      </NavLink>
    </li>
  );
}
