import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, GitBranch, MessageSquare, Heart, ArrowRight, Star } from 'lucide-react';
import api from '../api/client';

interface Stats {
  members: number;
  families: number;
  forum_threads: number;
  matrimony_profiles: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ members: 0, families: 0, forum_threads: 0, matrimony_profiles: 0 });

  useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const features = [
    {
      icon: <Users className="w-7 h-7 text-saffron-600" />,
      title: 'Member Profiles',
      desc: 'Connect with community members, discover shared roots, and build lasting friendships.',
      to: '/members',
      color: 'from-orange-50 to-amber-50',
    },
    {
      icon: <GitBranch className="w-7 h-7 text-emerald-600" />,
      title: 'Family Tree',
      desc: 'Map your family lineage, preserve history, and trace your ancestral connections.',
      to: '/family-tree',
      color: 'from-emerald-50 to-teal-50',
    },
    {
      icon: <MessageSquare className="w-7 h-7 text-blue-600" />,
      title: 'Business Forums',
      desc: 'Exchange ideas, seek advice, and grow together through community-powered discussions.',
      to: '/forums',
      color: 'from-blue-50 to-indigo-50',
    },
    {
      icon: <Heart className="w-7 h-7 text-rose-600" />,
      title: 'Matrimony',
      desc: 'Find your life partner within the community — with trust, values, and heritage.',
      to: '/matrimony',
      color: 'from-rose-50 to-pink-50',
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-saffron-600 via-saffron-700 to-orange-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-yellow-300 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Star size={14} className="fill-yellow-300 text-yellow-300" />
            Welcome to the Karuneegar Community
          </div>
          <h1 className="font-display font-bold text-4xl md:text-6xl leading-tight mb-6">
            Karuneegar <br className="hidden md:block" />
            <span className="text-yellow-300">Central</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Your digital home to connect with family, celebrate heritage,
            explore business opportunities, and find life partners within the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-saffron-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-yellow-50 transition-colors shadow-lg"
            >
              Join the Community <ArrowRight size={18} />
            </Link>
            <Link
              to="/members"
              className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/25 transition-colors"
            >
              Browse Members
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Members', value: stats.members, icon: <Users size={20} /> },
              { label: 'Family Trees', value: stats.families, icon: <GitBranch size={20} /> },
              { label: 'Forum Threads', value: stats.forum_threads, icon: <MessageSquare size={20} /> },
              { label: 'Matrimony Profiles', value: stats.matrimony_profiles, icon: <Heart size={20} /> },
            ].map((s) => (
              <div key={s.label} className="p-4">
                <div className="flex justify-center mb-2 text-saffron-500">{s.icon}</div>
                <div className="text-3xl font-display font-bold text-gray-900">{s.value.toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">Everything Your Community Needs</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            One platform built with purpose — for the Karuneegar community, by the community.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className={`card p-6 bg-gradient-to-br ${f.color} border-0 group`}
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-2 group-hover:text-saffron-700 transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-saffron-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-saffron-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            Ready to Connect?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of Karuneegar community members already building connections.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-saffron-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-yellow-50 transition-colors shadow-lg"
          >
            Get Started for Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
