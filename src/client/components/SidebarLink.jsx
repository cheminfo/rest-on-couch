import { clsx } from 'clsx';
import { NavLink, useMatch } from 'react-router-dom';

export default function SidebarLink({ to, icon, text }) {
  const match = useMatch(to);
  return (
    <li className={clsx('nav-item', { active: match !== null })}>
      <NavLink
        to={to}
        className={(props) => (props.isActive ? 'nav-link active' : 'nav-link')}
      >
        <i className={`fa fa-${icon}`} />
        <p>{text}</p>
      </NavLink>
    </li>
  );
}
