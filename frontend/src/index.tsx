// index.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// import './assets/vendor/bootstrap/css/bootstrap.min.css';
 import '@fortawesome/fontawesome-free/css/all.min.css';
// import './assets/vendor/select2/select2.min.css';
// import './assets/vendor/daterangepicker/daterangepicker.css';
// import './index.css'; // Nếu có thêm các file CSS custom
// import './assets/vendor/animsition/css/animsition.min.css';
import './assets/fonts/font-awesome-4.7.0/css/font-awesome.min.css'
// import './assets/fonts/iconic/css/material-design-iconic-font.min.css'
// import './assets/vendor/animate/animate.css'
// import './assets/vendor/animsition/css/animsition.min.css'

// <script src="https://cdn.jsdelivr.net/gh/oxfordcontrol/openjpeg.js/dist/openjpeg.min.js"></script>
<script src="https://cdn.jsdelivr.net/pyodide/v0.23.2/full/pyodide.js"></script>


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
