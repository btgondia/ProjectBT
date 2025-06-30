import React from 'react'
import { useNavigate } from 'react-router-dom'

const VerticalTabs = () => {
  const Navigate = useNavigate();
  const page = window.location.pathname;
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const hasTripView = user?.permissions?.includes('trip_view');

  return (
    <div
      className={`vertical-tabs  orders-page`}
    >
      <div
        onClick={() => Navigate('/admin')}
        className={`tabs ${page.includes('/admin') ? 'active' : ''}`}
      >{'ROUTE'.split('').map((character => <h2 key={Math.random()}>{character}</h2>))}
      </div>
      <div
        onClick={() => hasTripView && Navigate('/trip')}
        className={`tabs ${page.includes('/trip') ? 'active' : ''}`}
      >{'TRIP'.split('').map((character => <h2 key={Math.random()}>{character}</h2>))}
      </div>
    </div>
  )
}

export default VerticalTabs
