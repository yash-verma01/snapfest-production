import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Users, Award, Sparkles } from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import { GlassCard, ScrollReveal } from '../components/enhanced';
import CompanyLocationMap from '../components/CompanyLocationMap';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { userAPI } from '../services/api';
import { motion } from 'framer-motion';

const Contact = () => {
  const { user, isSignedIn, getToken } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user profile from backend if logged in
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isSignedIn) {
        try {
          // Fetch user profile from backend
          const response = await userAPI.getUserProfile();
          const profileData = response.data.data.user;
          
          // Populate form with backend data
          setFormData(prev => ({
            ...prev,
            name: profileData.name || '',
            email: profileData.email || '',
            phone: profileData.phone || ''
          }));
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback to Clerk data if backend fails
          if (user) {
            setFormData(prev => ({
              ...prev,
              name: user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.firstName || user.username || user.fullName || '',
              email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ''
            }));
          }
        }
      }
    };

    loadUserProfile();
  }, [isSignedIn, user]);

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Visit Our Office',
      details: ['Vikas Nagar, Lucknow'],
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: ['912 955 6955', '735 525 8150', 'Mon-Sat: 9AM-8PM'],
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      icon: Mail,
      title: 'Email Us',
      details: ['snapfest10@gmail.com'],
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Friday: 9AM - 8PM', 'Saturday: 10AM - 6PM', 'Sunday: 11AM - 4PM'],
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'booking', label: 'Booking Request' },
    { value: 'support', label: 'Technical Support' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'feedback', label: 'Feedback' },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if user is signed in
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      const response = await fetch('http://localhost:5001/api/enquiries', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          enquiryType: formData.inquiryType,
          subject: formData.subject,
          message: formData.message
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        
        // Reload user profile to reset form with correct values
        if (isSignedIn) {
          try {
            const response = await userAPI.getUserProfile();
            const profileData = response.data.data.user;
            setFormData({
              name: profileData.name || '',
              email: profileData.email || '',
              phone: profileData.phone || '',
              subject: '',
              message: '',
              inquiryType: 'general'
            });
          } catch (error) {
            // Fallback to Clerk data or empty form
            if (user) {
              setFormData({
                name: user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.firstName || user.username || '',
                email: user.primaryEmailAddress?.emailAddress || '',
                phone: '',
                subject: '',
                message: '',
                inquiryType: 'general'
              });
            } else {
              setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                inquiryType: 'general'
              });
            }
          }
        } else {
          // Clear form for non-logged-in users
          setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
            inquiryType: 'general'
          });
        }
      } else {
        toast.error(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { icon: Users, label: 'Happy Clients', value: '100+' },
    { icon: MessageCircle, label: 'Message Handled', value: '100++' },
    { icon: Award, label: 'Response Time', value: '< 2 Hours' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Hero Section with Background Image */}
      <section 
        className="relative text-white py-20 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.48.48.jpeg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg border border-white/30 mb-6">
              <MessageCircle className="w-4 h-4 mr-2" />
              We're Here to Help
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-2xl">
              Get in <span className="text-pink-200">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-8 leading-relaxed font-medium drop-shadow-lg">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-4 border border-white/30"
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-white" />
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-white/90 font-medium">{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Section - Redesigned */}
      <section className="py-16 bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 px-6 py-3 rounded-full text-sm font-semibold shadow-md mb-6">
                <Phone className="w-4 h-4 mr-2" />
                Contact Information
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                How to Reach Us
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 bg-white border-2 border-gray-100 rounded-2xl h-full flex flex-col group min-h-[280px]">
                      <div className={`bg-gradient-to-br from-pink-100 to-red-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-12 h-12 ${info.color}`} />
                      </div>
                      <h3 className="text-xl font-bold mb-5 text-gray-900 group-hover:text-pink-600 transition-colors duration-300">
                        {info.title}
                      </h3>
                      <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                        {info.details.map((detail, idx) => {
                          // Make phone numbers clickable
                          const isPhoneNumber = /^\d{3}\s\d{3}\s\d{4}$/.test(detail.trim());
                          return (
                            <p key={idx} className="text-gray-700 text-sm font-medium">
                              {isPhoneNumber ? (
                                <a 
                                  href={`tel:${detail.replace(/\s/g, '')}`}
                                  className="hover:text-pink-600 transition-colors duration-200"
                                >
                                  {detail}
                                </a>
                              ) : (
                                detail
                              )}
                            </p>
                          );
                        })}
                      </div>
                    </Card>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map Section - Redesigned */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <ScrollReveal direction="right" delay={0.1}>
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 px-4 py-2 rounded-full text-xs font-semibold shadow-md mb-4">
                    <Send className="w-3 h-3 mr-2" />
                    Send Inquiry
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                    Send us a Message
                  </h2>
                  <p className="text-gray-600">
                    Fill out the form below and we'll get back to you within 2 hours
                  </p>
                </div>
                <Card className="p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                        className="w-full"
                        disabled={isSignedIn}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        required
                        className="w-full"
                        disabled={isSignedIn}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inquiry Type
                      </label>
                      <select
                        name="inquiryType"
                        value={formData.inquiryType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        {inquiryTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <Input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What's this about?"
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Tell us more about your inquiry..."
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-4 flex items-center justify-center gap-2 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </Card>
              </div>
            </ScrollReveal>

            {/* Map & Additional Info */}
            <ScrollReveal direction="left" delay={0.2}>
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 px-4 py-2 rounded-full text-xs font-semibold shadow-md mb-4">
                    <MapPin className="w-3 h-3 mr-2" />
                    Our Location
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                    Find Us
                  </h2>
                </div>
                
                {/* Map with Company Address */}
                <div className="mb-8">
                  <CompanyLocationMap 
                    showAddressCard={true}
                    height="320px"
                  />
                </div>

              {/* Quick Contact */}
              <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
                <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                  Quick Contact
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-xl hover:shadow-md transition-all duration-300 group">
                    <div className="bg-gradient-to-br from-pink-100 to-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Phone className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Call us directly</p>
                      <a href="tel:9129556955" className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                        9129556955
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-xl hover:shadow-md transition-all duration-300 group">
                    <div className="bg-gradient-to-br from-pink-100 to-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">WhatsApp</p>
                      <a href="https://wa.me/9129556955" target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                        9129556955
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-xl hover:shadow-md transition-all duration-300 group">
                    <div className="bg-gradient-to-br from-pink-100 to-red-100 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Mail className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email support</p>
                      <a href="mailto:snapfest10@gmail.com" className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                        snapfest10@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Section - Redesigned */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 px-6 py-3 rounded-full text-sm font-semibold shadow-md mb-6">
                <MessageCircle className="w-4 h-4 mr-2" />
                Common Questions
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Find answers to the most common questions about our services
              </p>
            </div>
          </ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "How quickly do you respond to inquiries?",
                answer: "We typically respond to all inquiries within 2 hours during business hours, and within 24 hours on weekends."
              },
              {
                question: "Do you offer emergency booking services?",
                answer: "Yes, we offer emergency booking services for urgent events. Additional charges may apply for same-day bookings."
              },
              {
                question: "What areas do you serve?",
                answer: "We currently serve in Lucknow only. Contact us to check if we can cover your location."
              },
              {
                question: "Can I cancel or reschedule my booking?",
                answer: "Yes, you can cancel or reschedule your booking up to 48 hours before the event date. Cancellation policies vary by package."
              }
            ].map((faq, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-white border-2 border-gray-100 rounded-xl">
                    <h3 className="text-lg font-bold mb-3 text-gray-900 flex items-start gap-2">
                      <span className="text-pink-600 font-bold">Q{index + 1}.</span>
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed pl-6">{faq.answer}</p>
                  </Card>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;





