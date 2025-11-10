import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Simular envio
    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Entre em Contato
          </h1>
          <p className="text-gray-400 text-lg">
            Tem alguma dúvida? Estamos aqui para ajudar!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Informações de Contato */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6">Informações de Contato</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-gray-400">josepedroribeiro06@gmail.com</p>
                    <p className="text-gray-400">josepedroribeiro06@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Telefone</h3>
                    <p className="text-gray-400">+351 934 594 371</p>
                    <p className="text-gray-400">Seg - Sex: 9h às 18h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Endereço</h3>
                    <p className="text-gray-400">Valongo</p>
                    <p className="text-gray-400">Porto, Portugal</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Horário de Atendimento */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Horário de Atendimento</h2>
              <div className="space-y-2 text-gray-400">
                <p className="flex justify-between">
                  <span>Segunda - Sexta:</span>
                  <span className="text-white">9h - 18h</span>
                </p>
                <p className="flex justify-between">
                  <span>Sábado:</span>
                  <span className="text-white">10h - 14h</span>
                </p>
                <p className="flex justify-between">
                  <span>Domingo:</span>
                  <span className="text-white">Fechado</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Formulário de Contato */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 space-y-6"
            >
              <h2 className="text-2xl font-bold mb-4">Envie sua Mensagem</h2>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Assunto
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="Assunto da mensagem"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Mensagem *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition resize-none"
                  placeholder="Escreva sua mensagem aqui..."
                  required
                ></textarea>
              </div>

              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Send className="w-5 h-5" />
                Enviar Mensagem
              </motion.button>

              <p className="text-sm text-gray-400 text-center">
                * Campos obrigatórios
              </p>
            </form>
          </motion.div>
        </div>

        {/* FAQ ou informações adicionais */}
        <motion.div
          className="mt-12 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-4">Perguntas Frequentes</h2>
          <div className="space-y-4 text-gray-400">
            <div>
              <h3 className="text-white font-semibold mb-1">Qual o prazo de resposta?</h3>
              <p>Respondemos todas as mensagens em até 24 horas úteis.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Posso trocar ou devolver um jogo?</h3>
              <p>Sim, oferecemos garantia de 14 dias para todos os produtos digitais.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Como funciona o suporte técnico?</h3>
              <p>Nossa equipe está disponível via email e chat para resolver qualquer problema técnico.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
