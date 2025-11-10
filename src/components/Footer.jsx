import { motion } from "framer-motion";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Github, 
  ArrowUp, 
  Mail, 
  MapPin, 
  Phone,
  Send,
  CreditCard,
  Shield,
  Truck,
  RotateCcw,
  Youtube,
  Gamepad2,
  Clock
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  
  // Função para voltar ao topo
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Newsletter subscription
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      toast.success("Obrigado por se inscrever! 🎮");
      setEmail("");
    }
  };

  return (
    <motion.footer
      className="bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white mt-20 border-t border-gray-800 relative overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Fundo decorativo com efeitos */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {/* Seção superior - Grid com informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Coluna 1 - Sobre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <img src="/images/logo.png" alt="NextLevel" className="w-16 h-16 object-contain" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                NextLevel
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              A sua loja online de confiança para jogos digitais. Promoções exclusivas, entrega instantânea e suporte 24/7.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Pagamento 100% Seguro</span>
            </div>
          </motion.div>

          {/* Coluna 2 - Links Rápidos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-bold mb-4 text-white">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              {["Home", "Promoções", "Novidades", "Mais Vendidos", "FAQ"].map((item, i) => (
                <li key={i}>
                  <a
                    href={`/${item.toLowerCase().replace(" ", "-")}`}
                    className="text-gray-400 hover:text-purple-400 transition duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition"></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Coluna 3 - Suporte */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-bold mb-4 text-white">Suporte</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2 hover:text-white transition cursor-pointer">
                <Mail className="w-4 h-4 text-purple-400" />
                <span>suporte@nextlevel.com</span>
              </li>
              <li className="flex items-center gap-2 hover:text-white transition cursor-pointer">
                <Phone className="w-4 h-4 text-purple-400" />
                <span>+351 912 345 678</span>
              </li>
              <li className="flex items-center gap-2 hover:text-white transition cursor-pointer">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>24/7 Disponível</span>
              </li>
              <li className="flex items-start gap-2 hover:text-white transition cursor-pointer">
                <MapPin className="w-4 h-4 text-purple-400 mt-0.5" />
                <span className="leading-relaxed">Lisboa, Portugal</span>
              </li>
            </ul>
          </motion.div>

          {/* Coluna 4 - Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg font-bold mb-4 text-white">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">
              Receba as melhores promoções e novidades!
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="w-full bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                  required
                />
              </div>
              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition shadow-lg flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Send className="w-4 h-4" />
                Inscrever-se
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Divisor */}
        <div className="border-t border-gray-800 mb-8"></div>

        {/* Vantagens */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Truck, text: "Entrega Instantânea", color: "text-blue-400" },
            { icon: Shield, text: "Pagamento Seguro", color: "text-green-400" },
            { icon: RotateCcw, text: "Garantia de Reembolso", color: "text-yellow-400" },
            { icon: Gamepad2, text: "+10.000 Jogos", color: "text-purple-400" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-800 hover:border-gray-700 transition"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-gray-300 text-xs font-medium">{item.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Divisor */}
        <div className="border-t border-gray-800 mb-8"></div>

        {/* Seção inferior */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright e links legais */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-400">
            <p>© {new Date().getFullYear()} NextLevel. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <a href="/terms" className="hover:text-white transition">Termos</a>
              <span className="text-gray-700">•</span>
              <a href="/privacy" className="hover:text-white transition">Privacidade</a>
              <span className="text-gray-700">•</span>
              <a href="/contact" className="hover:text-white transition">Contato</a>
            </div>
          </div>

          {/* Redes sociais */}
          <div className="flex items-center gap-3">
            {[
              { Icon: Facebook, href: "#", color: "hover:text-blue-400" },
              { Icon: Twitter, href: "#", color: "hover:text-blue-300" },
              { Icon: Instagram, href: "#", color: "hover:text-pink-400" },
              { Icon: Youtube, href: "#", color: "hover:text-red-400" },
              { Icon: Github, href: "https://github.com/Ribeiro-20", color: "hover:text-gray-300" },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-gray-400 ${social.color} transition duration-300 p-2 rounded-lg hover:bg-gray-800/80 backdrop-blur-sm`}
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                aria-label={social.Icon.name}
              >
                <social.Icon size={20} />
              </motion.a>
            ))}
          </div>

          {/* Botão voltar ao topo */}
          <motion.button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition duration-300 px-4 py-2 rounded-lg hover:bg-gray-800/80 backdrop-blur-sm border border-gray-800 hover:border-purple-600"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Voltar ao topo"
          >
            <ArrowUp size={18} />
            <span className="text-sm font-medium">Topo</span>
          </motion.button>
        </div>

        {/* Métodos de pagamento */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">Métodos de pagamento aceites:</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded border border-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Visa</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded border border-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Mastercard</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded border border-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">PayPal</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded border border-gray-700">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">MB Way</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
