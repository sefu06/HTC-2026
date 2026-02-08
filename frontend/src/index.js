import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import './index.css';
import App from './App';
import axios from "axios";
const token = localStorage.getItem("token");


if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
        <BrowserRouter>
            
            <App />
        </BrowserRouter>
);
