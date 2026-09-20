import { Link } from "react-router-dom";

function QuickActionCard({
  title,
  description,
  icon,
  path,
  number,
}) {
  return (
    <Link to={path} className="quick-action-card">

      <span className="quick-action-number">
        {number}
      </span>

      <div className="quick-action-icon">
        <img src={icon} alt="" />
      </div>

      <div className="quick-action-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="quick-action-cta">
        <span>Open analyzer</span>
        <span>↗</span>
      </div>

    </Link>
  );
}

export default QuickActionCard;