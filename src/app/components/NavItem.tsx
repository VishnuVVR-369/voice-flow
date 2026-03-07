import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, hint }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
    >
      <span className="nav-item-icon">{icon}</span>
      <span className="nav-item-copy">
        <span className="nav-item-title">{label}</span>
        <span className="nav-item-hint">{hint}</span>
      </span>
    </NavLink>
  );
};

export default NavItem;
