import React from 'react';
import { Award, Heart, Star, CheckCircle } from 'lucide-react';
import { GlassCard, ScrollReveal } from '../components/enhanced';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
      {/* Hero Section - More Pinkish */}
      <section className="relative bg-gradient-to-br from-pink-300 via-pink-200 to-red-300 text-pink-900 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/50 via-pink-300/50 to-red-400/50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-pink-900 drop-shadow-md">
              About <span className="text-pink-600">SnapFest</span>
            </h1>
            <p className="text-xl md:text-2xl text-pink-800 mb-8 leading-relaxed font-semibold">
              Capturing life's most precious moments with passion, creativity, and professional excellence.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section - More Pinkish */}
      <section className="py-20 bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-pink-900">Our Story</h2>
            <div className="prose prose-lg max-w-none text-pink-800">
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

      {/* Values Section - More Pinkish */}
      <section className="py-20 bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Our Values</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                  <GlassCard className="p-6 text-center hover:shadow-xl transition-all duration-300">
                    <div className="bg-gradient-to-br from-pink-100 to-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon className="w-8 h-8 text-pink-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </GlassCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section - More Pinkish */}
      <section className="py-20 bg-gradient-to-br from-pink-100 via-pink-50 to-red-100">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">Meet Our Team</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 0.1}>
                <GlassCard className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{member.name}</h3>
                  <p className="text-pink-600 font-medium mb-1">{member.role}</p>
                  <p className="text-sm text-gray-500">{member.experience}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - More Pinkish */}
      <section className="py-20 bg-gradient-to-br from-pink-400 via-pink-300 to-red-400 text-pink-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-pink-900 drop-shadow-md">Ready to Capture Your Special Moments?</h2>
          <p className="text-xl mb-8 text-pink-800 font-semibold">
            Join thousands of satisfied customers who trust SnapFest for their photography needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/packages"
              className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors shadow-lg"
            >
              Browse Packages
            </a>
            <a
              href="/contact"
              className="border-2 border-pink-600 text-pink-900 px-8 py-3 rounded-lg font-semibold hover:bg-pink-600 hover:text-white transition-colors shadow-lg"
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





