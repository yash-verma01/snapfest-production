import React from 'react';
import { Award, Heart, Star, CheckCircle, Sparkles, Camera, Users, Calendar } from 'lucide-react';
import { GlassCard, ScrollReveal } from '../components/enhanced';
import { Card, Button } from '../components/ui';
import { motion } from 'framer-motion';

const About = () => {
  const values = [
    {
      title: 'Quality First',
      description: 'We never compromise on the quality of our photography services. Every shot is crafted with precision and passion.',
      icon: Star,
    },
    {
      title: 'Customer Satisfaction',
      description: 'Your happiness is our priority. We go above and beyond to ensure every client is completely satisfied.',
      icon: Heart,
    },
    {
      title: 'Professional Excellence',
      description: 'Our team consists of certified professionals with years of experience in event photography.',
      icon: Award,
    },
    {
      title: 'Reliable Service',
      description: 'Count on us to deliver exceptional results on time, every time. We are committed to reliability.',
      icon: CheckCircle,
    },
  ];

  const team = [
    {
      name: 'Yash Verma',
      role: 'Co-Founder',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      experience: '5+ years',
    },
    {
      name: 'Ayush Raj',
      role: 'Co-Founder',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      experience: '5+ years',
    },
  ];

  const stats = [
    { icon: Camera, label: 'Events Captured', value: '250+' },
    { icon: Users, label: 'Happy Clients', value: '400+' },
    { icon: Calendar, label: 'Years of Experience', value: '5+' },
    { icon: Star, label: 'Average Rating', value: '4.8' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50">
      {/* Hero Section with Background Image */}
      <section 
        className="relative text-white py-20 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.55.36.jpeg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg border border-white/30 mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Our Story
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-2xl">
              About <span className="text-pink-200">SnapFest</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-8 leading-relaxed font-medium drop-shadow-lg">
              Capturing life's most precious moments with passion, creativity, and professional excellence.
            </p>
            
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
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

      {/* Our Story Section - Redesigned */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up">
              <div className="text-center mb-12">
                <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 px-6 py-3 rounded-full text-sm font-semibold shadow-md mb-6">
                  <Camera className="w-4 h-4 mr-2" />
                  Our Journey
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                  Our Story
                </h2>
              </div>
            </ScrollReveal>
            
            <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
              <ScrollReveal direction="right">
                <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/heroImages/WhatsApp Image 2025-11-28 at 10.48.48.jpeg"
                    alt="Our Story"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              </ScrollReveal>
              
              <ScrollReveal direction="left">
                <Card className="p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <div className="space-y-6">
                    <p className="text-lg leading-relaxed text-gray-700">
                      SnapFest was born from a simple belief: <span className="font-semibold text-pink-600">every moment deserves to be captured beautifully</span>. 
                      What started as a passion project in 2016 has grown into one of the most trusted photography 
                      platforms in the country.
                    </p>
                    <p className="text-lg leading-relaxed text-gray-700">
                      Our journey began when we realized that finding the right photographer 
                      for special occasions was often a challenge. Too many people were settling for mediocre results 
                      or struggling with unreliable vendors.
                    </p>
                  </div>
                </Card>
              </ScrollReveal>
            </div>

            <ScrollReveal direction="up">
              <Card className="p-8 shadow-xl border-0 bg-gradient-to-br from-white to-pink-50/50">
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-gray-700">
                    Today, SnapFest connects thousands of clients with professional photographers across 25+ cities. 
                    We've captured over <span className="font-bold text-pink-600">5,000 events</span>, from intimate family gatherings to grand weddings, corporate 
                    events to milestone celebrations.
                  </p>
                  <p className="text-lg leading-relaxed text-gray-700">
                    Our mission remains unchanged: to make professional photography <span className="font-semibold text-pink-600">accessible, reliable, and 
                    absolutely exceptional</span> for everyone.
                  </p>
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values Section - Redesigned */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 px-6 py-3 rounded-full text-sm font-semibold shadow-md mb-6">
                <Award className="w-4 h-4 mr-2" />
                What We Stand For
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                Our Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 bg-white border-2 border-gray-100 rounded-2xl h-full flex flex-col group">
                      <div className="bg-gradient-to-br from-pink-100 to-red-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-10 h-10 text-pink-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-pink-600 transition-colors duration-300">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed flex-1">{value.description}</p>
                    </Card>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section - Redesigned */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-red-50">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 px-6 py-3 rounded-full text-sm font-semibold shadow-md mb-6">
                <Users className="w-4 h-4 mr-2" />
                The People Behind SnapFest
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                Meet Our Team
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Passionate professionals dedicated to capturing your special moments
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-8 text-center hover:shadow-2xl transition-all duration-500 bg-white border-2 border-gray-100 rounded-2xl group">
                    <div className="relative w-32 h-32 rounded-full mx-auto mb-6 overflow-hidden ring-4 ring-pink-100 group-hover:ring-pink-300 transition-all duration-300 shadow-xl">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-pink-600 transition-colors duration-300">
                      {member.name}
                    </h3>
                    <p className="text-pink-600 font-semibold mb-2 text-lg">{member.role}</p>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-50 to-red-50 px-4 py-2 rounded-full">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <p className="text-sm text-gray-600 font-medium">{member.experience} Experience</p>
                    </div>
                  </Card>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Redesigned */}
      <section 
        className="relative py-20 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/heroImages/WhatsApp Image 2025-11-28 at 10.55.36.jpeg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg border border-white/30 mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Let's Create Magic Together
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-2xl">
              Ready to Capture Your Special Moments?
            </h2>
            <p className="text-xl md:text-2xl mb-10 text-white/95 font-medium drop-shadow-lg max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust SnapFest for their photography needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/packages"
                className="bg-white text-pink-600 px-8 py-4 rounded-xl font-semibold hover:bg-pink-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 text-lg inline-flex items-center justify-center"
              >
                Browse Packages
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-pink-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 text-lg bg-white/10 backdrop-blur-sm inline-flex items-center justify-center"
              >
                Get in Touch
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;





