import { useEffect, useState, useRef } from "react";
import "./App.css";
import { db } from "./config/firebase";
import { getDocs, collection, addDoc } from "firebase/firestore";
import { fetchDataFromAPI } from "./components/data";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Visualisations from "./pages/Visualisations";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Login />} />
          <Route path="home" element={<Home />} />
          <Route path="signup" element={<Signup />} />
          <Route path="settings" element={<Settings />} />
          <Route path="visualisations" element={<Visualisations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
