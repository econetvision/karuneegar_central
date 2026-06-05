import { Link } from 'react-router-dom';
import {
  BookOpen, MapPin, Users, Star, Landmark, Globe,
  ChevronRight, ArrowRight,
} from 'lucide-react';

const SECTIONS = [
  {
    icon: <BookOpen size={22} className="text-saffron-600" />,
    title: 'Who Are Karuneegars?',
    color: 'from-orange-50 to-amber-50',
    border: 'border-orange-100',
    content: (
      <p className="text-gray-700 leading-relaxed">
        The <strong>Karuneegar</strong> (also spelt <em>Kanakku Pillai</em>) is a distinguished community
        from <strong>Tamil Nadu, India</strong>, historically renowned as accountants, record-keepers, and
        administrators. The word <em>Kanakku Pillai</em> in Tamil literally means <em>"accountant"</em> or
        <em>"book keeper"</em> — a reflection of the community's centuries-old role as the custodians
        of financial and land records in royal courts and villages alike.
      </p>
    ),
  },
  {
    icon: <Star size={22} className="text-amber-600" />,
    title: 'Ancient Heritage',
    color: 'from-amber-50 to-yellow-50',
    border: 'border-amber-100',
    content: (
      <div className="space-y-3 text-gray-700 leading-relaxed">
        <p>
          The <strong>Seer Karuneegar Puranam</strong> — a detailed chronicle of this community — was
          composed by the poet <strong>Paarisanadhar</strong> nearly <strong>2,000 years ago</strong> during
          the glorious <em>Vallalar Pandyan</em> period, attesting to the community's ancient roots.
        </p>
        <p>
          Ancient Sanskrit scriptures that document the Karuneegar community include the{' '}
          <strong>Bramanda Puranam</strong>, <strong>Adithya Puranam</strong>, and{' '}
          <strong>Kanaka Smrithi</strong> — sacred texts that trace the lineage and duties of the
          community back to the very origins of Hindu civilisation.
        </p>
      </div>
    ),
  },
  {
    icon: <Landmark size={22} className="text-rose-500" />,
    title: 'Deity & Spiritual Tradition',
    color: 'from-rose-50 to-pink-50',
    border: 'border-rose-100',
    content: (
      <div className="space-y-3 text-gray-700 leading-relaxed">
        <p>
          The presiding deity of the Karuneegar community is <strong>Lord Chitragupta</strong>,
          whose divine consort is <strong>Karnikambal</strong>. Lord Chitragupta is revered in
          Hindu tradition as the celestial record-keeper — the divine accountant who meticulously
          maintains the record of every soul's deeds across all lifetimes.
        </p>
        <p>
          A sacred temple dedicated to Lord Chitragupta stands in the holy city of{' '}
          <strong>Kanchipuram, Tamil Nadu</strong> — one of the most significant pilgrim sites
          for the Karuneegar community. The spiritual identity of the community is thus deeply
          intertwined with the concept of dharmic record-keeping and righteous accounting.
        </p>
        <div className="mt-3 p-3 bg-white rounded-xl border border-rose-100 italic text-sm text-rose-800">
          "Lord Chitraguptar belongs to our Karuneegar caste — the keeper of records for all beings."
        </div>
      </div>
    ),
  },
  {
    icon: <Users size={22} className="text-blue-600" />,
    title: 'Community Structure',
    color: 'from-blue-50 to-indigo-50',
    border: 'border-blue-100',
    content: (
      <div className="space-y-3 text-gray-700 leading-relaxed">
        <p>The Karuneegar community is composed of several distinct sub-divisions:</p>
        <ul className="space-y-2">
          {['Seer Karuneegar', 'Sarattu Karuneegar', 'Kaikatum Karuneegar'].map((sub) => (
            <li key={sub} className="flex items-center gap-2">
              <ChevronRight size={15} className="text-blue-400 flex-shrink-0" />
              <span className="font-medium">{sub}</span>
            </li>
          ))}
        </ul>
        <p>
          The community is organised around approximately <strong>64 gothras</strong> (ancestral
          lineages) arranged across <strong>six sutras</strong>, each with its own associated
          Vedic traditions, rituals, and codes of conduct that have been preserved across
          generations.
        </p>
      </div>
    ),
  },
  {
    icon: <MapPin size={22} className="text-emerald-600" />,
    title: 'Geographic Distribution',
    color: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
    content: (
      <div className="space-y-3 text-gray-700 leading-relaxed">
        <p>
          While concentrated in <strong>Tamil Nadu</strong>, Karuneegars have spread across
          India and the world:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {[
            { place: 'Tamil Nadu', note: 'Primary homeland' },
            { place: 'Andhra Pradesh', note: 'Known as Karnams' },
            { place: 'Karnataka', note: 'Settled communities' },
            { place: 'Kerala', note: 'Often known as Menons' },
            { place: 'Global Diaspora', note: 'Across continents' },
          ].map(({ place, note }) => (
            <div key={place} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-100">
              <MapPin size={13} className="text-emerald-500 flex-shrink-0" />
              <div>
                <span className="font-medium text-sm text-gray-800">{place}</span>
                <span className="text-xs text-gray-400 ml-1.5">— {note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <Globe size={22} className="text-violet-600" />,
    title: 'Modern Identity',
    color: 'from-violet-50 to-purple-50',
    border: 'border-violet-100',
    content: (
      <div className="space-y-3 text-gray-700 leading-relaxed">
        <p>
          Historically celebrated for excellence in <strong>accountancy, mathematics, and
          administration</strong>, today's Karuneegars thrive across every professional
          sphere — engineering, medicine, law, business, technology, and the arts — while
          proudly maintaining their cultural identity and religious traditions centred on
          Chitragupta worship and Kayastha heritage.
        </p>
        <p>
          The community remains deeply committed to <strong>education, integrity, and
          service</strong> — values that have defined the Karuneegar identity for over
          two millennia.
        </p>
      </div>
    ),
  },
];

export default function AboutKaruneegar() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-saffron-600 via-saffron-700 to-orange-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-yellow-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Decorative Om / kolam-inspired symbol */}
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
            🪔
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mb-4 leading-tight">
            About Karuneegars
          </h1>
          <p className="text-white/85 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            An ancient community of honour — the celestial record-keepers of Tamil civilisation,
            rooted in two millennia of dharmic tradition.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/members"
              className="inline-flex items-center gap-2 bg-white text-saffron-700 font-semibold px-6 py-3 rounded-xl hover:bg-yellow-50 transition-colors"
            >
              Meet Our Members <ArrowRight size={16} />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/25 transition-colors"
            >
              Join the Community
            </Link>
          </div>
        </div>
      </section>

      {/* Quick facts strip */}
      <section className="bg-white border-b border-orange-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Years of History', value: '2,000+' },
              { label: 'Gothras (Lineages)', value: '64' },
              { label: 'Primary Deity', value: 'Chitragupta' },
              { label: 'Sacred Sutras', value: '6' },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <div className="text-2xl sm:text-3xl font-display font-bold text-saffron-600">{f.value}</div>
                <div className="text-xs sm:text-sm text-gray-500">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content sections */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className={`rounded-2xl border ${s.border} bg-gradient-to-br ${s.color} overflow-hidden`}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/70 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    {s.icon}
                  </div>
                  <h2 className="font-display font-bold text-lg sm:text-xl text-gray-900">
                    {s.title}
                  </h2>
                </div>
                <div className="text-sm sm:text-base">{s.content}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Source note */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2">
          <BookOpen size={15} className="text-gray-400 flex-shrink-0" />
          <span>
            Content adapted from{' '}
            <a
              href="https://karuneegars.blogspot.com/p/about-karuneegar.html"
              target="_blank"
              rel="noreferrer"
              className="text-saffron-600 hover:underline font-medium"
            >
              karuneegars.blogspot.com
            </a>
            {' '}— the original source for Karuneegar community history and heritage.
          </span>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-saffron-600 to-orange-700 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">
            Proud to Be Karuneegar?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join Karuneegar Central — your digital home to connect with family,
            preserve heritage, and build a stronger community.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-saffron-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-yellow-50 transition-colors shadow-lg"
          >
            Join Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
