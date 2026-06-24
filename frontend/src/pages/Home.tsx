import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, GitBranch, MessageSquare, Heart, ArrowRight, Star, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { uploadUrl } from '../api/client';

interface Stats {
  members: number;
  families: number;
  forum_threads: number;
  matrimony_profiles: number;
}

export default function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({ members: 0, families: 0, forum_threads: 0, matrimony_profiles: 0 });
  const [homeEvents, setHomeEvents] = useState<any[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    api.get('/stats').then((r) => setStats(r.data)).catch(() => {});
    api.get('/events/home').then((r) => setHomeEvents(r.data.events || [])).catch(() => {});
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (homeEvents.length < 2) return;
    const timer = setInterval(() => setCarouselIdx((i) => (i + 1) % homeEvents.length), 4000);
    return () => clearInterval(timer);
  }, [homeEvents.length]);

  const prev = () => setCarouselIdx((i) => (i - 1 + homeEvents.length) % homeEvents.length);
  const next = () => setCarouselIdx((i) => (i + 1) % homeEvents.length);

  const fmtDate = (d?: string) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  const features = [
    {
      icon: <Calendar className="w-7 h-7 text-sky-600" />,
      title: t('home.featureEvents'),
      desc: t('home.featureEventsDesc'),
      to: '/events',
      color: 'from-sky-50 to-blue-50',
    },
    {
      icon: <Users className="w-7 h-7 text-saffron-600" />,
      title: t('home.featureProfiles'),
      desc: t('home.featureProfilesDesc'),
      to: '/members',
      color: 'from-orange-50 to-amber-50',
    },
    {
      icon: <GitBranch className="w-7 h-7 text-emerald-600" />,
      title: t('home.featureFamilyTree'),
      desc: t('home.featureFamilyTreeDesc'),
      to: '/family-tree',
      color: 'from-emerald-50 to-teal-50',
    },
    {
      icon: <MessageSquare className="w-7 h-7 text-blue-600" />,
      title: t('home.featureForums'),
      desc: t('home.featureForumsDesc'),
      to: '/forums',
      color: 'from-blue-50 to-indigo-50',
    },
    {
      icon: <Heart className="w-7 h-7 text-rose-600" />,
      title: t('home.featureMatrimony'),
      desc: t('home.featureMatrimonyDesc'),
      to: '/matrimony',
      color: 'from-rose-50 to-pink-50',
    },
    {
      icon: <MapPin className="w-7 h-7 text-amber-600" />,
      title: t('home.featurePilgrimages'),
      desc: t('home.featurePilgrimagesDesc'),
      to: '/pilgrimages',
      color: 'from-amber-50 to-orange-50',
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
            {t('home.welcome')}
          </div>
          <h1 className="font-display font-bold text-4xl md:text-6xl leading-tight mb-6">
            Karuneegar <br className="hidden md:block" />
            <span className="text-yellow-300">Central</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-saffron-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-yellow-50 transition-colors shadow-lg"
            >
              {t('home.joinCommunity')} <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/25 transition-colors"
            >
              Already a Member? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Events Carousel */}
      {homeEvents.length > 0 && (
        <section className="bg-gray-950 py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <Calendar size={20} className="text-saffron-400" /> Upcoming Events
              </h2>
              <Link to="/events" className="text-sm text-saffron-400 hover:text-saffron-300 font-medium flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-2xl">
              {/* Slides */}
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
              >
                {homeEvents.map((ev) => {
                  const mediaUrl = ev.media_filename ? uploadUrl(ev.media_filename) : null;
                  return (
                    <Link
                      key={ev.id}
                      to={`/events/${ev.id}`}
                      className="relative flex-shrink-0 w-full h-72 md:h-96 block group"
                    >
                      {mediaUrl ? (
                        <img src={mediaUrl} alt={ev.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-sky-800 to-blue-900 flex items-center justify-center">
                          <span className="text-8xl">🎉</span>
                        </div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        <h3 className="font-display font-bold text-xl md:text-2xl text-white mb-2 group-hover:text-yellow-300 transition-colors">
                          {ev.title}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {ev.event_date && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-white/85">
                              <Calendar size={13} className="text-saffron-400" /> {fmtDate(ev.event_date)}
                            </span>
                          )}
                          {ev.donate_url && (
                            <span className="inline-flex items-center gap-1 text-xs bg-rose-500/80 text-white px-2.5 py-0.5 rounded-full font-medium">
                              ❤️ Donate
                            </span>
                          )}
                          {ev.register_url && (
                            <span className="inline-flex items-center gap-1 text-xs bg-violet-500/80 text-white px-2.5 py-0.5 rounded-full font-medium">
                              ✅ Register
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Prev/Next buttons */}
              {homeEvents.length > 1 && (
                <>
                  <button onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Dots */}
            {homeEvents.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {homeEvents.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? 'w-6 bg-saffron-400' : 'w-1.5 bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: t('home.membersLabel'), value: stats.members, icon: <Users size={20} /> },
              { label: t('home.familyTreesLabel'), value: stats.families, icon: <GitBranch size={20} /> },
              { label: t('home.forumThreadsLabel'), value: stats.forum_threads, icon: <MessageSquare size={20} /> },
              { label: t('home.matrimonyLabel'), value: stats.matrimony_profiles, icon: <Heart size={20} /> },
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
          <h2 className="section-title mb-3">{t('home.featuresTitle')}</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {t('home.featuresSubtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {t('home.explore')} <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-saffron-600 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-white/80 text-lg mb-8">
            {t('home.ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-saffron-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-yellow-50 transition-colors shadow-lg"
            >
              {t('home.getStarted')} <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/25 transition-colors"
            >
              Already a Member? Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
