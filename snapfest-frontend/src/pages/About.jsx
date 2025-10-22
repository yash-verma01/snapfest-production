import React from 'react';
import { Camera, Users, Award, Heart, Star, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui';

const About = () => {
  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: Users },
    { label: 'Events Captured', value: '5,000+', icon: Camera },
    { label: 'Years Experience', value: '8+', icon: Award },
    { label: 'Team Members', value: '50+', icon: Heart },
  ];

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
      name: 'Sarah Johnson',
      role: 'Lead Photographer',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face',
      experience: '10+ years',
    },
    {
      name: 'Michael Chen',
      role: 'Wedding Specialist',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      experience: '8+ years',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Event Coordinator',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
      experience: '6+ years',
    },
    {
      name: 'David Thompson',
      role: 'Technical Director',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      experience: '12+ years',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About <span className="text-blue-400">SnapFest</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
              Capturing life's most precious moments with passion, creativity, and professional excellence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <span className="text-sm text-gray-300">Founded</span>
                <div className="text-2xl font-bold">2016</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <span className="text-sm text-gray-300">Locations</span>
                <div className="text-2xl font-bold">25+ Cities</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <span className="text-sm text-gray-300">Awards</span>
                <div className="text-2xl font-bold">15+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Story</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-xl leading-relaxed mb-6">
                SnapFest was born from a simple belief: every moment deserves to be captured beautifully. 
                What started as a passion project in 2016 has grown into one of the most trusted photography 
                platforms in the country.
              </p>
              <p className="text-xl leading-relaxed mb-6">
                Our journey began when our founder, Sarah Johnson, realized that finding the right photographer 
                for special occasions was often a challenge. Too many people were settling for mediocre results 
                or struggling with unreliable vendors.
              </p>
              <p className="text-xl leading-relaxed mb-6">
                Today, SnapFest connects thousands of clients with professional photographers across 25+ cities. 
                We've captured over 5,000 events, from intimate family gatherings to grand weddings, corporate 
                events to milestone celebrations.
              </p>
              <p className="text-xl leading-relaxed">
                Our mission remains unchanged: to make professional photography accessible, reliable, and 
                absolutely exceptional for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Meet Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-1">{member.role}</p>
                <p className="text-sm text-gray-500">{member.experience}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Capture Your Special Moments?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of satisfied customers who trust SnapFest for their photography needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/packages"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Packages
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;





