import { Link } from 'react-router-dom';
import { LogoIcon } from './KarunegarLogo';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <LogoIcon size={36} />
              <span className="font-display font-bold text-xl text-white">
                Karuneegar <span className="text-saffron-400">Central</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              The digital home for the Karuneegar community — connecting families,
              celebrating heritage, and building a prosperous future together.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                ['Members', '/members'],
                ['Family Tree', '/family-tree'],
                ['Business Forums', '/forums'],
                ['Matrimony', '/matrimony'],
                ['About Karuneegars', '/about'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="hover:text-saffron-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Community</h4>
            <ul className="space-y-2 text-sm">
              {[
                ['Register', '/register'],
                ['Login', '/login'],
                ['My Profile', '/profile'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="hover:text-saffron-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-gray-500 text-center">
          © {new Date().getFullYear()} Karuneegar Central. Built with ❤️ for the community.
        </div>
      </div>
    </footer>
  );
}
