import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Bell } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Botão de voltar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Política de Privacidade
          </h1>
          <p className="text-gray-400">Última atualização: {new Date().toLocaleDateString('pt-PT')}</p>
        </motion.div>

        {/* Conteúdo */}
        <motion.div
          className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-400">1. Introdução</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              A sua privacidade é importante para nós. Esta Política de Privacidade explica como o 
              NextLevel recolhe, usa, partilha e protege as suas informações pessoais quando utiliza 
              nossa plataforma.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-400">2. Informações que Coletamos</h2>
            </div>
            
            <h3 className="text-xl font-semibold text-white mt-4 mb-3">2.1 Informações Fornecidas por Você</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Dados de Registo:</strong> Nome, email, password (encriptada)</li>
              <li><strong>Informações de Perfil:</strong> Avatar, preferências de jogos</li>
              <li><strong>Dados de Pagamento:</strong> Informações de faturação (processadas por terceiros seguros)</li>
              <li><strong>Histórico de Compras:</strong> Jogos adquiridos, transações</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-3">2.2 Informações Coletadas Automaticamente</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Dados de Navegação:</strong> Endereço IP, tipo de navegador, páginas visitadas</li>
              <li><strong>Cookies:</strong> Preferências, sessão de login, análise de uso</li>
              <li><strong>Dispositivo:</strong> Tipo de dispositivo, sistema operativo</li>
              <li><strong>Localização:</strong> Localização aproximada baseada em IP</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-400">3. Como Usamos Suas Informações</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-3">
              Utilizamos as suas informações para:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Processar e entregar suas compras</li>
              <li>Gerenciar sua conta e fornecer suporte ao cliente</li>
              <li>Personalizar sua experiência e recomendar jogos</li>
              <li>Enviar emails transacionais (confirmações de compra, chaves de jogos)</li>
              <li>Melhorar nossos serviços através de análises e estatísticas</li>
              <li>Prevenir fraudes e garantir segurança da plataforma</li>
              <li>Cumprir obrigações legais</li>
              <li>Enviar newsletters e promoções (com seu consentimento)</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-400">4. Compartilhamento de Informações</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-3">
              Não vendemos suas informações pessoais. Podemos partilhar dados com:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Processadores de Pagamento:</strong> Para processar transações (ex: Stripe, PayPal)</li>
              <li><strong>Fornecedores de Serviços:</strong> Hospedagem, email, análise (Firebase, etc.)</li>
              <li><strong>Publishers de Jogos:</strong> Quando necessário para entrega de chaves</li>
              <li><strong>Autoridades Legais:</strong> Quando exigido por lei</li>
              <li><strong>Parceiros de Marketing:</strong> Apenas dados anónimos e agregados</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-400">5. Segurança dos Dados</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-3">
              Implementamos medidas de segurança para proteger suas informações:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Encriptação SSL/TLS para transmissão de dados</li>
              <li>Passwords encriptadas com algoritmos seguros</li>
              <li>Firewall e proteção contra ataques</li>
              <li>Acesso restrito aos dados pessoais</li>
              <li>Backups regulares e seguros</li>
              <li>Monitorização contínua de segurança</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Nota: Nenhum sistema é 100% seguro. Tome precauções com sua password.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-400">6. Cookies e Tecnologias Similares</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-3">
              Utilizamos cookies para:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Essenciais:</strong> Login, carrinho de compras, segurança</li>
              <li><strong>Funcionais:</strong> Preferências de idioma, layout</li>
              <li><strong>Análise:</strong> Google Analytics para entender uso do site</li>
              <li><strong>Marketing:</strong> Anúncios personalizados (com consentimento)</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Pode gerir cookies nas configurações do navegador, mas isso pode afetar funcionalidades.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">7. Seus Direitos (RGPD)</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              De acordo com o Regulamento Geral de Proteção de Dados, você tem direito a:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais</li>
              <li><strong>Retificação:</strong> Corrigir dados incorretos ou incompletos</li>
              <li><strong>Apagamento:</strong> Solicitar exclusão dos seus dados ("direito ao esquecimento")</li>
              <li><strong>Portabilidade:</strong> Receber dados em formato estruturado</li>
              <li><strong>Oposição:</strong> Opor-se ao processamento dos seus dados</li>
              <li><strong>Limitação:</strong> Solicitar limitação do processamento</li>
              <li><strong>Retirar Consentimento:</strong> A qualquer momento</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Para exercer estes direitos, contacte: <span className="text-purple-400">privacidade@nextlevel.com</span>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">8. Retenção de Dados</h2>
            <p className="text-gray-300 leading-relaxed">
              Mantemos seus dados pessoais pelo tempo necessário para fornecer nossos serviços e 
              cumprir obrigações legais. Dados de compras são mantidos por no mínimo 7 anos para 
              fins fiscais. Você pode solicitar exclusão de dados a qualquer momento, sujeito a 
              obrigações legais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">9. Privacidade de Menores</h2>
            <p className="text-gray-300 leading-relaxed">
              Nosso serviço não é direcionado a menores de 18 anos. Não coletamos intencionalmente 
              informações de menores. Se descobrirmos que coletamos dados de um menor, eliminaremos 
              essas informações imediatamente. Pais/responsáveis podem contactar-nos se suspeitarem 
              que um menor forneceu informações.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">10. Transferências Internacionais</h2>
            <p className="text-gray-300 leading-relaxed">
              Seus dados podem ser transferidos e processados fora da União Europeia. Garantimos 
              que todas as transferências cumprem o RGPD e são protegidas por cláusulas contratuais 
              padrão aprovadas pela Comissão Europeia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">11. Alterações à Política</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre 
              alterações significativas por email ou aviso no site. A data da última atualização 
              está no topo desta página.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">12. Contato</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Para questões sobre privacidade ou esta política:
            </p>
            <div className="bg-gray-800/50 rounded-lg p-4 text-gray-300">
              <p><strong>Email:</strong> <span className="text-purple-400">josepedroribeiro06@gmail.com</span></p>
              <p><strong>Telefone:</strong> <span className="text-purple-400">+351 934 594 371</span></p>
              <p><strong>Endereço:</strong> Valongo, Porto, Portugal</p>
              <p className="mt-2"><strong>Encarregado de Proteção de Dados (DPO):</strong> dpo@nextlevel.com</p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-400 text-sm">
              Ao usar o NextLevel, você consente com esta Política de Privacidade.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
