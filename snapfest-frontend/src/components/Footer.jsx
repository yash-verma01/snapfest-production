import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-t border-pink-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">SnapFest</span>
            </div>
            <p className="text-gray-300 text-sm">
              Your one-stop destination for premium event photography and videography services. 
              Capturing life's most precious moments with professional excellence.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-all duration-300 hover:scale-110 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-500/20">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-all duration-300 hover:scale-110 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-500/20">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-400 transition-all duration-300 hover:scale-110 w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-500/20">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-pink-400 transition-all duration-300 hover:translate-x-1 inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/packages" className="text-gray-300 hover:text-pink-400 transition-all duration-300 hover:translate-x-1 inline-block">
                  Packages
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-300 hover:text-pink-400 transition-all duration-300 hover:translate-x-1 inline-block">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-pink-400 transition-all duration-300 hover:translate-x-1 inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-pink-400 transition-all duration-300 hover:translate-x-1 inline-block">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Services</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-300">Wedding</span>
              </li>
              <li>
                <span className="text-gray-300">Birthday</span>
              </li>
              <li>
                <span className="text-gray-300">Baby Shower</span>
              </li>
              <li>
                <span className="text-gray-300">Demise</span>
              </li>
              <li>
                <span className="text-gray-300">Haldi & Mehndi</span>
              </li>
              <li>
                <span className="text-gray-300">Car & Diggi Celebration</span>
              </li>
              <li>
                <span className="text-gray-300">Corporate</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-primary-400" />
                <span className="text-gray-300 text-sm">
                  vikas nagar,lko
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary-400" />
                <span className="text-gray-300 text-sm">9129556955</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-400" />
                <span className="text-gray-300 text-sm">snapfest10@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 SnapFest. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;





