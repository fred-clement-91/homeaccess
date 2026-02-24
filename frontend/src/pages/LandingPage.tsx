import { Link } from "react-router-dom";
import {
  GlobeAltIcon,
  ShieldCheckIcon,
  BoltIcon,
  ServerStackIcon,
  VideoCameraIcon,
  HomeModernIcon,
  CircleStackIcon,
  ComputerDesktopIcon,
  WifiIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const devices = [
  {
    icon: HomeModernIcon,
    name: "Domotique",
    description: "Home Assistant, Jeedom, Domoticz",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: VideoCameraIcon,
    name: "Caméras",
    description: "Surveillance IP, Frigate, ZoneMinder",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: CircleStackIcon,
    name: "NAS",
    description: "Synology, TrueNAS, QNAP",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: ComputerDesktopIcon,
    name: "Média",
    description: "Jellyfin, Plex, Emby",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: ServerStackIcon,
    name: "Serveurs",
    description: "Nextcloud, Gitea, Wiki",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: WifiIcon,
    name: "IoT",
    description: "ESPHome, MQTT, Zigbee2MQTT",
    color: "from-indigo-500 to-violet-500",
  },
];

const features = [
  {
    icon: ShieldCheckIcon,
    title: "Sécurisé",
    description:
      "Tunnel VPN chiffré WireGuard. Vos données sont protégées de bout en bout.",
  },
  {
    icon: BoltIcon,
    title: "Instantané",
    description:
      "Sous-domaine personnalisé actif en quelques secondes. Certificat SSL automatique.",
  },
  {
    icon: GlobeAltIcon,
    title: "Accessible partout",
    description:
      "Accédez à vos services depuis n'importe où. Plus besoin d'IP fixe.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <GlobeAltIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              HomeAccess
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium transition-all duration-200"
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
            <BoltIcon className="w-4 h-4" />
            Pas besoin d'IP fixe
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Vos{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              équipements
            </span>{" "}
            accessibles
            <br />
            depuis n'importe où
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Caméras, NAS, domotique, serveurs média...
            Accédez à tous vos services domestiques via un sous-domaine sécurisé,
            sans IP fixe ni configuration compliquée.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-indigo-500/25"
            >
              Créer mon accès
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 text-gray-300 hover:text-white font-medium text-lg transition-all duration-200"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Devices Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">
            Tous vos équipements, un seul accès
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Quel que soit le service que vous hébergez chez vous, HomeAccess vous
            permet d'y accéder de partout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <div
              key={device.name}
              className="group relative bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/50 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${device.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <device.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {device.name}
              </h3>
              <p className="text-gray-400 text-sm">{device.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-gray-800/50 bg-gray-900/20">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Trois étapes pour rendre vos services accessibles depuis Internet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl font-bold text-indigo-400">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Créez votre compte</h3>
              <p className="text-gray-400 text-sm">
                Inscrivez-vous avec votre email. Vos identifiants vous seront
                envoyés automatiquement.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl font-bold text-purple-400">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Choisissez votre sous-domaine
              </h3>
              <p className="text-gray-400 text-sm">
                Créez un tunnel avec le nom de votre choix :
                <span className="text-indigo-400"> maison.homeaccess.site</span>
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl font-bold text-pink-400">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Installez la config VPN
              </h3>
              <p className="text-gray-400 text-sm">
                Téléchargez le fichier WireGuard et importez-le sur votre serveur
                domestique. C'est tout !
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mx-auto mb-5">
                <feature.icon className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5" />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à rendre vos services accessibles ?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Créez votre compte gratuitement et configurez votre premier accès en
              moins de 5 minutes.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-lg transition-all duration-200 shadow-lg shadow-indigo-500/25"
            >
              Commencer maintenant
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <GlobeAltIcon className="w-4 h-4" />
            <span>HomeAccess</span>
          </div>
          <p>Propulsé par WireGuard + Let's Encrypt</p>
        </div>
      </footer>
    </div>
  );
}
