import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import State from './context/state';

ReactDOM.render(<State><App /></State>, document.getElementById("root"));