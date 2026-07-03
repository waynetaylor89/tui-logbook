import { useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";
import { memo } from "react";

const Breadcrumbs = memo(function Breadcrumbs() {
  const location = useLocation();
  
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    const breadcrumbMap = {
      '': 'Home',
      'movements': 'Aircraft Movements',
      'records': 'Movement Records',
      'users': 'Manage Users'
    };

    return pathnames.map((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      const displayName = breadcrumbMap[name] || name;

      return (
        <span key={routeTo} className="flex items-center">
          {index > 0 && <span className="mx-2 text-slate-400">/</span>}
          {isLast ? (
            <span className="text-cyan-100 font-medium">{displayName}</span>
          ) : (
            <Link 
              to={routeTo} 
              className="text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              {displayName}
            </Link>
          )}
        </span>
      );
    });
  };

  return (
    <nav className="flex items-center space-x-1 text-sm py-2 px-4 bg-slate-900/80 border border-cyan-900/60 rounded-xl">
      <Link to="/" className="text-cyan-300 hover:text-cyan-200 transition-colors">
        🏠
      </Link>
      {getBreadcrumbs()}
    </nav>
  );
});

export default Breadcrumbs;
