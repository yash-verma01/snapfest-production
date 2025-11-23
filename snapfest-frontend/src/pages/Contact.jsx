import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Users, Award } from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import { GlassCard, ScrollReveal } from '../components/enhanced';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { userAPI } from '../services/api';

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
      details: ['9129556955', 'Mon-Sat: 9AM-8PM'],
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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
      {/* Hero Section - More Pinkish */}
      <section className="relative bg-gradient-to-br from-pink-300 via-pink-200 to-red-300 text-pink-900 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/50 via-pink-300/50 to-red-400/50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-pink-900 drop-shadow-md">
              Get in <span className="text-pink-600">Touch</span>
            </h1>
            <p className="text-xl md:text-2xl text-pink-800 mb-8 leading-relaxed font-semibold">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-pink-200 shadow-lg">
                    <Icon className="w-8 h-8 text-pink-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold mb-1 text-pink-900">{stat.value}</div>
                    <div className="text-sm text-pink-700 font-semibold">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Section - More Pinkish */}
      <section className="py-16 bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                  <GlassCard className="p-6 text-center hover:shadow-xl transition-all duration-300">
                  <div className={`${info.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-8 h-8 ${info.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{info.title}</h3>
                  <div className="space-y-1">
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-gray-600 text-sm">{detail}</p>
                    ))}
                  </div>
                </GlassCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map Section - More Pinkish */}
      <section className="py-20 bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <ScrollReveal direction="right" delay={0.1}>
              <div>
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Send us a Message</h2>
                <GlassCard className="p-8">
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
                    className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-3 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </GlassCard>
              </div>
            </ScrollReveal>

            {/* Map & Additional Info */}
            <ScrollReveal direction="left" delay={0.2}>
              <div>
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Find Us</h2>
                
                {/* Map Placeholder */}
                <GlassCard className="p-0 mb-8 overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-pink-600 mx-auto mb-4" />
                    <p className="text-pink-800 font-semibold">Interactive Map</p>
                    <p className="text-sm text-pink-700">Vikas Nagar, Lucknow</p>
                  </div>
                </div>
              </GlassCard>

              {/* Quick Contact */}
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-pink-900">Quick Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-100 p-2 rounded-lg">
                      <Phone className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium text-pink-900">Call us directly</p>
                      <p className="text-sm text-pink-700">9129556955</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-pink-900">WhatsApp</p>
                      <p className="text-sm text-pink-700">9129556955</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-100 p-2 rounded-lg">
                      <Mail className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium text-pink-900">Email support</p>
                      <p className="text-sm text-pink-700">snapfest10@gmail.com</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ Section - More Pinkish */}
      <section className="py-20 bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Frequently Asked Questions</h2>
          </ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-6">
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
                <GlassCard className="p-6 hover:shadow-xl transition-all duration-300">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;





