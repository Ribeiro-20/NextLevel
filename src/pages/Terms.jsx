import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
            Termos de Serviço
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
            <h2 className="text-2xl font-bold text-purple-400 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-300 leading-relaxed">
              Ao acessar e usar o NextLevel, você concorda em cumprir estes Termos de Serviço. 
              Se não concordar com algum destes termos, não utilize nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              O NextLevel é uma plataforma de venda digital de jogos eletrónicos. Oferecemos:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Venda de chaves digitais de jogos</li>
              <li>Acesso à biblioteca de jogos</li>
              <li>Sistema de favoritos e carrinho de compras</li>
              <li>Suporte ao cliente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">3. Conta de Utilizador</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Para utilizar nossos serviços, você deve:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Ter pelo menos 18 anos de idade ou consentimento dos pais/tutores</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
              <li>Manter a confidencialidade da sua conta</li>
              <li>Ser responsável por todas as atividades da sua conta</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">4. Compras e Pagamentos</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Ao realizar uma compra:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Todas as compras são finais, salvo defeito do produto</li>
              <li>Os preços podem mudar sem aviso prévio</li>
              <li>Você receberá a chave digital por email após confirmação do pagamento</li>
              <li>Aceitamos diversos métodos de pagamento seguros</li>
              <li>Todas as transações são processadas de forma segura</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">5. Política de Reembolso</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Oferecemos reembolso nas seguintes situações:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Chave inválida ou já utilizada</li>
              <li>Produto não corresponde à descrição</li>
              <li>Solicitação dentro de 14 dias da compra</li>
              <li>O jogo não foi ativado na plataforma</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Nota: Jogos ativados não são elegíveis para reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">6. Propriedade Intelectual</h2>
            <p className="text-gray-300 leading-relaxed">
              Todo o conteúdo do site (textos, imagens, logos, design) é propriedade do NextLevel 
              ou licenciado para uso. É proibida a reprodução sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">7. Conduta do Utilizador</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              É proibido:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Usar a plataforma para atividades ilegais</li>
              <li>Revender chaves adquiridas sem autorização</li>
              <li>Tentar hackear ou comprometer a segurança do site</li>
              <li>Criar múltiplas contas para abusar de promoções</li>
              <li>Utilizar bots ou scripts automatizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-gray-300 leading-relaxed">
              O NextLevel não se responsabiliza por problemas causados por terceiros, incluindo 
              desenvolvedores de jogos, plataformas de ativação (Steam, Epic, etc.) ou problemas 
              técnicos fora do nosso controle. Não garantimos disponibilidade ininterrupta do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">9. Modificações dos Termos</h2>
            <p className="text-gray-300 leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
              entrarão em vigor imediatamente após publicação. O uso continuado do serviço após 
              alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">10. Rescisão</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, 
              se violar estes termos. Você pode encerrar sua conta a qualquer momento contactando 
              nosso suporte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">11. Lei Aplicável</h2>
            <p className="text-gray-300 leading-relaxed">
              Estes termos são regidos pelas leis de Portugal. Qualquer disputa será resolvida 
              nos tribunais portugueses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-purple-400 mb-4">12. Contato</h2>
            <p className="text-gray-300 leading-relaxed">
              Para questões sobre estes Termos de Serviço, entre em contato:
            </p>
            <div className="mt-3 text-gray-300">
              <p>Email: <span className="text-purple-400">suporte@nextlevel.com</span></p>
              <p>Telefone: <span className="text-purple-400">+351 123 456 789</span></p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-400 text-sm">
              Ao usar o NextLevel, você confirma que leu, compreendeu e concordou com estes Termos de Serviço.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
