import {
  BookOpenIcon,
  ServerIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  CommandLineIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                           */
/* ------------------------------------------------------------------ */

function Section({
  icon: Icon,
  title,
  id,
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto whitespace-pre font-mono">
      {children}
    </pre>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
      <LightBulbIcon className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-indigo-200">{children}</p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-200">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table of contents                                                 */
/* ------------------------------------------------------------------ */

const TOC = [
  { id: "principe", label: "Principe de fonctionnement" },
  { id: "architecture", label: "Architecture réseau" },
  { id: "creer-tunnel", label: "Créer un tunnel" },
  { id: "routeur-wg", label: "Configurer le routeur WireGuard" },
  { id: "device-ip", label: "Adresse IP de l'équipement" },
  { id: "config-wg", label: "Configuration WireGuard" },
  { id: "verification", label: "Vérification" },
  { id: "faq", label: "Questions fréquentes" },
];

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <BookOpenIcon className="w-7 h-7 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">Documentation</h1>
        </div>
        <p className="text-gray-400">
          Guide complet pour configurer vos tunnels HomeAccess et rendre vos
          équipements accessibles depuis Internet.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="mb-10 p-5 rounded-2xl bg-gray-900/50 border border-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Sommaire
        </h3>
        <ol className="space-y-1.5">
          {TOC.map(({ id, label }, i) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-indigo-400 transition-colors"
              >
                <span className="text-gray-600 w-5 text-right">{i + 1}.</span>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Content */}
      <div className="space-y-12">
        {/* 1. Principe */}
        <Section icon={GlobeAltIcon} title="Principe de fonctionnement" id="principe">
          <p>
            <strong className="text-white">HomeAccess</strong> vous permet
            d'accéder à vos équipements domestiques (caméra IP, NAS, domotique…)
            depuis n'importe où, même si vous n'avez pas d'adresse IP publique
            fixe.
          </p>
          <p>
            Le service crée un <strong className="text-white">tunnel VPN WireGuard</strong>{" "}
            entre votre réseau local et notre serveur. Chaque tunnel reçoit un
            sous-domaine personnalisé en{" "}
            <code className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 text-sm">
              votre-nom.homeaccess.site
            </code>{" "}
            avec un certificat HTTPS automatique.
          </p>
          <p>
            Un visiteur accédant à votre sous-domaine est routé de façon
            transparente jusqu'à votre équipement local, via le tunnel chiffré.
          </p>
          <p>
            Deux configurations sont possibles :
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
            <li>
              <strong className="text-gray-300">Connexion directe</strong> — votre
              équipement supporte WireGuard (Raspberry Pi, Home Assistant, NAS
              Synology…) : il porte le tunnel lui-même, pas besoin de matériel
              supplémentaire.
            </li>
            <li>
              <strong className="text-gray-300">Via un routeur intermédiaire</strong> —
              votre équipement ne supporte pas WireGuard (caméra IP, capteurs
              IoT…) : un petit routeur (Pi, GL.iNet, MikroTik…) fait le pont
              entre le tunnel et l'équipement.
            </li>
          </ul>
        </Section>

        {/* 2. Architecture */}
        <Section icon={ServerIcon} title="Architecture réseau" id="architecture">
          <p>
            Voici le chemin complet d'une requête depuis Internet jusqu'à votre
            équipement :
          </p>

          {/* Diagram */}
          <div className="flex flex-col items-center gap-0 py-4">
            {/* Visiteur */}
            <div className="px-5 py-2.5 rounded-xl bg-gray-800/60 border border-gray-600/40 text-center">
              <p className="text-sm font-medium text-gray-300">Visiteur (Internet)</p>
            </div>
            <div className="w-px h-6 bg-gray-600" />
            <div className="text-gray-500 text-xs">▼</div>

            {/* Serveur */}
            <div className="px-5 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center max-w-sm w-full">
              <p className="text-sm font-semibold text-indigo-300">Serveur HomeAccess</p>
              <p className="text-xs text-gray-400 mt-1">Reverse proxy (TLS) → WireGuard</p>
              <p className="text-xs text-gray-500">votre-nom.homeaccess.site</p>
            </div>
            <div className="w-px h-4 bg-gray-600" />
            <div className="px-3 py-1 rounded-full bg-gray-800/60 border border-gray-700/40">
              <p className="text-xs text-gray-400">tunnel WireGuard chiffré</p>
            </div>
            <div className="w-px h-4 bg-gray-600" />
            <div className="text-gray-500 text-xs">▼</div>

            {/* Routeur */}
            <div className="px-5 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center max-w-sm w-full">
              <p className="text-sm font-semibold text-purple-300">Routeur WireGuard (Pi / GL.iNet)</p>
              <div className="flex justify-center gap-4 mt-1.5 text-xs text-gray-400">
                <span>wg0 : 172.16.0.x</span>
                <span className="text-gray-600">|</span>
                <span>eth0 : 10.100.0.z</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">ip_forward = 1</p>
            </div>
            <div className="w-px h-4 bg-gray-600" />
            <div className="px-3 py-1 rounded-full bg-gray-800/60 border border-gray-700/40">
              <p className="text-xs text-gray-400">réseau local</p>
            </div>
            <div className="w-px h-4 bg-gray-600" />
            <div className="text-gray-500 text-xs">▼</div>

            {/* Équipement */}
            <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center max-w-sm w-full">
              <p className="text-sm font-semibold text-emerald-300">Équipement cible</p>
              <p className="text-xs text-gray-500 mt-0.5">Caméra / NAS / Domotique</p>
              <div className="flex justify-center gap-4 mt-1.5 text-xs text-gray-400">
                <span>IP : 10.100.0.y</span>
                <span className="text-gray-600">|</span>
                <span>GW : 10.100.0.z</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Port : 80, 8080, 8123…</p>
            </div>
          </div>

          <Tip>
            Le routeur intermédiaire n'est nécessaire que si votre équipement
            ne supporte pas WireGuard. Si votre équipement le supporte
            (Raspberry Pi, Home Assistant, NAS Synology…), il porte le tunnel
            directement — pas besoin de matériel supplémentaire.
          </Tip>
        </Section>

        {/* 3. Créer un tunnel */}
        <Section icon={WrenchScrewdriverIcon} title="Créer un tunnel" id="creer-tunnel">
          <ol className="list-decimal list-inside space-y-3">
            <li>
              Depuis le <strong className="text-white">Dashboard</strong>, cliquez
              sur <strong className="text-white">« Nouveau tunnel »</strong>.
            </li>
            <li>
              Choisissez un <strong className="text-white">sous-domaine</strong>{" "}
              (ex. <code className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 text-sm">camera-salon</code>).
              L'outil vérifie la disponibilité en temps réel.
            </li>
            <li>
              Indiquez le <strong className="text-white">port cible</strong> de
              votre équipement (par défaut : 8123). C'est le port sur lequel
              votre équipement écoute (80 pour une caméra, 8080 pour une interface web,
              8123 pour Home Assistant…).
            </li>
            <li>
              Choisissez l'<strong className="text-white">adresse cible</strong> :
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-gray-400">
                <li>
                  <strong className="text-gray-300">Équipement</strong> — le trafic
                  est envoyé vers l'IP Device (10.100.0.y). À utiliser quand un
                  routeur WireGuard intermédiaire fait le pont vers votre équipement.
                </li>
                <li>
                  <strong className="text-gray-300">VPN direct</strong> — le trafic
                  est envoyé vers l'IP VPN (172.16.0.x). À utiliser quand le service
                  tourne directement sur la machine qui porte le tunnel WireGuard
                  (Raspberry Pi, NAS Synology, Home Assistant…).
                </li>
              </ul>
            </li>
            <li>
              Validez. Le tunnel est créé avec :
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-gray-400">
                <li>
                  Une <strong className="text-gray-300">IP VPN</strong> (172.16.0.x) — adresse du routeur WireGuard dans le tunnel
                </li>
                <li>
                  Une <strong className="text-gray-300">IP Device</strong> (10.100.0.y) — adresse à assigner à l'équipement cible
                </li>
                <li>
                  Un <strong className="text-gray-300">certificat HTTPS</strong> automatique via Let's Encrypt
                </li>
              </ul>
            </li>
          </ol>
        </Section>

        {/* 4. Routeur WireGuard */}
        <Section icon={CpuChipIcon} title="Configurer le routeur WireGuard" id="routeur-wg">
          <Tip>
            Cette section ne concerne que le cas où votre équipement cible ne
            supporte pas WireGuard. Si votre équipement le supporte (Raspberry
            Pi, Home Assistant, NAS Synology…), installez la configuration
            WireGuard directement dessus et assignez-lui l'IP Device — vous
            pouvez passer à la section suivante.
          </Tip>
          <p>
            Vous avez besoin d'un petit appareil faisant office de passerelle
            WireGuard entre le tunnel et votre équipement. Options courantes :
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
            <li><strong className="text-gray-300">Raspberry Pi</strong> (3/4/5 ou Zero 2W)</li>
            <li><strong className="text-gray-300">GL.iNet</strong> (GL-MT3000, GL-AXT1800…) — WireGuard intégré</li>
            <li><strong className="text-gray-300">MikroTik</strong> (hAP ax², RB5009…) — WireGuard natif depuis RouterOS 7</li>
            <li>Tout appareil Linux capable de faire tourner WireGuard</li>
          </ul>

          <h3 className="text-lg font-medium text-white mt-6 mb-2">
            Étapes sur un Raspberry Pi (Debian/Raspbian)
          </h3>

          <p className="text-sm text-gray-400 mb-2">
            1. Installer WireGuard :
          </p>
          <Code>{`sudo apt update && sudo apt install wireguard -y`}</Code>

          <p className="text-sm text-gray-400 mt-4 mb-2">
            2. Activer le routage IP :
          </p>
          <Code>{`echo 'net.ipv4.ip_forward=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p`}</Code>

          <p className="text-sm text-gray-400 mt-4 mb-2">
            3. Télécharger la configuration WireGuard depuis le Dashboard
            (bouton <strong className="text-gray-300">« Config WG »</strong>) et
            la placer dans :
          </p>
          <Code>{`sudo cp homevpn-votre-tunnel.conf /etc/wireguard/wg0.conf
sudo chmod 600 /etc/wireguard/wg0.conf`}</Code>

          <p className="text-sm text-gray-400 mt-4 mb-2">
            4. Configurer l'interface réseau côté équipement (eth0) :
          </p>
          <Code>{`# /etc/network/interfaces.d/eth0
auto eth0
iface eth0 inet static
    address 10.100.0.z
    netmask 255.255.0.0`}</Code>

          <p className="text-sm text-gray-400 mt-4 mb-2">
            5. Démarrer WireGuard et l'activer au boot :
          </p>
          <Code>{`sudo systemctl enable --now wg-quick@wg0`}</Code>

          <Warning>
            Si votre Pi est aussi connecté à votre box Internet en WiFi ou via
            un autre port ethernet, assurez-vous que les routes ne se chevauchent
            pas. Le Pi doit pouvoir atteindre le serveur HomeAccess (UDP 51820)
            pour établir le tunnel.
          </Warning>
        </Section>

        {/* 5. Device IP */}
        <Section icon={ShieldCheckIcon} title="Adresse IP de l'équipement" id="device-ip">
          <p>
            Chaque tunnel reçoit une <strong className="text-white">IP Device</strong>{" "}
            dans le réseau <code className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 text-sm">10.100.0.0/16</code>.
            Cette IP doit être assignée <strong className="text-white">directement</strong> à
            votre équipement cible (caméra, NAS…).
          </p>

          <h3 className="text-lg font-medium text-white mt-6 mb-2">
            Exemple : caméra IP
          </h3>
          <p>
            Si votre tunnel a l'IP Device{" "}
            <code className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 text-sm">10.100.0.y</code>,
            configurez la caméra avec :
          </p>
          <Code>{`Adresse IP : 10.100.0.y
Masque     : 255.255.0.0
Passerelle : 10.100.0.z  (le routeur WireGuard)`}</Code>

          <p>
            Le routeur WireGuard (Pi) fait du simple routage IP{" "}
            (<code className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 text-sm">ip_forward</code>).
            Pas de NAT nécessaire : le trafic est routé directement dans le
            tunnel.
          </p>

          <Tip>
            L'IP Device est affichée sur la carte du tunnel dans le Dashboard,
            ainsi que dans le fichier de configuration WireGuard téléchargé
            (en commentaire).
          </Tip>
        </Section>

        {/* 6. Config WireGuard */}
        <Section icon={ArrowDownTrayIcon} title="Configuration WireGuard" id="config-wg">
          <p>
            La configuration WireGuard de votre tunnel est téléchargeable depuis
            le Dashboard via le bouton{" "}
            <strong className="text-white">« Config WG »</strong> de chaque
            tunnel.
          </p>
          <p>Voici un exemple de fichier généré :</p>
          <Code>{`# IP de l'equipement cible : 10.100.0.y
# Assignez cette IP directement a votre equipement (camera, NAS...)
# et activez ip_forward sur ce routeur WireGuard.

[Interface]
PrivateKey = <clé privée unique>
Address = 172.16.0.x/32
DNS = 1.1.1.1

[Peer]
PublicKey = <clé publique du serveur>
Endpoint = vpn.homeaccess.site:51820
AllowedIPs = 172.16.0.z/32
PersistentKeepalive = 10`}</Code>

          <ul className="list-disc list-inside space-y-2 text-gray-400 mt-4">
            <li>
              <strong className="text-gray-300">Address</strong> : l'IP VPN du
              routeur dans le tunnel (172.16.0.x)
            </li>
            <li>
              <strong className="text-gray-300">Endpoint</strong> : le serveur
              WireGuard HomeAccess
            </li>
            <li>
              <strong className="text-gray-300">AllowedIPs</strong> : trafic
              routé dans le tunnel (uniquement vers le serveur)
            </li>
            <li>
              <strong className="text-gray-300">PersistentKeepalive</strong> :
              maintient le tunnel actif même derrière un NAT
            </li>
          </ul>

          <Warning>
            Chaque fichier de configuration contient une clé privée unique.
            Ne partagez jamais ce fichier. Si vous pensez qu'une clé a été
            compromise, supprimez le tunnel et recréez-en un nouveau.
          </Warning>
        </Section>

        {/* 7. Vérification */}
        <Section icon={CommandLineIcon} title="Vérification" id="verification">
          <p>
            Une fois le routeur WireGuard configuré et l'équipement branché,
            vérifiez que tout fonctionne :
          </p>

          <h3 className="text-lg font-medium text-white mt-4 mb-2">
            1. Vérifier le tunnel WireGuard
          </h3>
          <Code>{`# Sur le routeur WireGuard (Pi)
sudo wg show

# Vous devez voir le peer du serveur avec un "latest handshake"
# récent (< 2 minutes)`}</Code>

          <h3 className="text-lg font-medium text-white mt-4 mb-2">
            2. Vérifier la connectivité vers l'équipement
          </h3>
          <Code>{`# Depuis le routeur WireGuard
ping 10.100.0.y   # l'IP device de votre équipement`}</Code>

          <h3 className="text-lg font-medium text-white mt-4 mb-2">
            3. Vérifier le statut dans le Dashboard
          </h3>
          <p>
            Dans le Dashboard, votre tunnel doit afficher{" "}
            <strong className="text-emerald-400">Connecté</strong> avec la durée
            de connexion. Si le statut reste{" "}
            <span className="text-gray-500">Déconnecté</span>, vérifiez que
            le port UDP <strong className="text-white">51820</strong> est
            accessible depuis votre réseau.
          </p>

          <h3 className="text-lg font-medium text-white mt-4 mb-2">
            4. Tester l'accès depuis Internet
          </h3>
          <p>
            Ouvrez{" "}
            <code className="px-1.5 py-0.5 rounded bg-gray-800 text-indigo-300 text-sm">
              https://votre-nom.homeaccess.site
            </code>{" "}
            depuis un navigateur (ou un réseau différent de votre réseau local).
            Vous devez accéder à l'interface de votre équipement.
          </p>
        </Section>

        {/* 8. FAQ */}
        <Section icon={BookOpenIcon} title="Questions fréquentes" id="faq">
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-medium text-white mb-1">
                Combien de tunnels puis-je créer ?
              </h3>
              <p className="text-gray-400">
                Votre quota est affiché dans le Dashboard (ex. 2/3 tunnels
                utilisés). Pour augmenter votre quota, contactez-nous via la
                page Contact.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium text-white mb-1">
                Ai-je besoin d'une adresse IP publique ?
              </h3>
              <p className="text-gray-400">
                Non. C'est justement l'intérêt de HomeAccess. Le tunnel WireGuard
                fonctionne même derrière un NAT ou un CGNAT opérateur.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium text-white mb-1">
                Quelle est la différence entre l'IP VPN et l'IP Device ?
              </h3>
              <p className="text-gray-400">
                L'<strong className="text-gray-300">IP VPN</strong> (172.16.0.x)
                est l'adresse du pair WireGuard dans le tunnel. L'
                <strong className="text-gray-300">IP Device</strong> (10.100.0.y)
                est l'adresse à assigner à votre équipement cible (caméra,
                NAS…). Le bouton <strong className="text-gray-300">Équipement / VPN direct</strong>{" "}
                sur chaque carte tunnel permet de choisir vers quelle adresse
                le trafic est envoyé. Utilisez{" "}
                <strong className="text-gray-300">Équipement</strong> si un
                routeur intermédiaire fait le pont, ou{" "}
                <strong className="text-gray-300">VPN direct</strong> si le
                service tourne directement sur la machine WireGuard.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium text-white mb-1">
                Le certificat HTTPS est-il automatique ?
              </h3>
              <p className="text-gray-400">
                Oui. Un certificat Let's Encrypt est généré automatiquement lors
                de la création du tunnel. Il est renouvelé automatiquement.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium text-white mb-1">
                Mon tunnel est connecté mais je ne peux pas accéder à mon
                équipement.
              </h3>
              <p className="text-gray-400">
                Vérifiez que : (1) le mode cible est correct — <strong className="text-gray-300">Équipement</strong>{" "}
                si vous utilisez un routeur intermédiaire, <strong className="text-gray-300">VPN direct</strong>{" "}
                si le service tourne sur la machine WireGuard, (2) l'IP Device
                est bien configurée sur l'équipement avec la bonne passerelle,
                (3) le port cible dans le tunnel correspond au port réel de
                l'équipement, (4) le routage IP est activé sur le routeur
                WireGuard (
                <code className="px-1 py-0.5 rounded bg-gray-800 text-indigo-300 text-sm">
                  sysctl net.ipv4.ip_forward
                </code>{" "}
                doit retourner 1).
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium text-white mb-1">
                Mon équipement supporte WireGuard, ai-je besoin d'un routeur
                intermédiaire ?
              </h3>
              <p className="text-gray-400">
                Non. Si votre équipement supporte WireGuard nativement
                (Raspberry Pi, Home Assistant, NAS Synology…), installez la
                configuration WireGuard directement dessus. Il portera le
                tunnel et l'IP Device en même temps. Le routeur intermédiaire
                n'est nécessaire que pour les équipements qui ne supportent
                pas WireGuard (caméra IP, capteurs IoT…).
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium text-white mb-1">
                Puis-je utiliser un autre routeur qu'un Raspberry Pi ?
              </h3>
              <p className="text-gray-400">
                Oui. Les routeurs <strong className="text-gray-300">GL.iNet</strong> (GL-MT3000,
                GL-AXT1800…) et <strong className="text-gray-300">MikroTik</strong> (RouterOS 7+)
                intègrent un client WireGuard natif dans leur interface
                d'administration. Il suffit de coller la configuration
                téléchargée depuis le Dashboard et de configurer l'IP Device
                sur le port LAN.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium text-white mb-1">
                Le tunnel se déconnecte souvent.
              </h3>
              <p className="text-gray-400">
                Le paramètre <code className="px-1 py-0.5 rounded bg-gray-800 text-indigo-300 text-sm">PersistentKeepalive = 10</code>{" "}
                dans la configuration WireGuard maintient le tunnel actif.
                Si votre connexion Internet est instable, WireGuard se
                reconnectera automatiquement. Vérifiez aussi que votre box
                ne bloque pas le trafic UDP sortant sur le port 51820.
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <div className="mt-16 mb-8 pt-8 border-t border-gray-800/50 text-center">
        <p className="text-sm text-gray-500">
          Besoin d'aide supplémentaire ?{" "}
          <a href="/contact" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Contactez-nous
          </a>
        </p>
      </div>
    </div>
  );
}
