import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AlfaTechFlow
            </span>
          </div>
          <Link
            href="/auth/login"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-8 animate-pulse">
            <Sparkles className="w-4 h-4" />
            Potenciado por Inteligencia Artificial
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
            Gestión de Soporte
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Inteligente y Eficiente
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Automatiza tus reportes técnicos, gestiona tickets en tiempo real y
            potencia tu equipo con IA. Todo en una plataforma moderna y fácil de usar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/login"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-2xl shadow-blue-500/30 flex items-center gap-2"
            >
              Comenzar Ahora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/preview"
              className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all duration-200 border border-slate-700"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Reportes con IA
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Genera reportes técnicos profesionales automáticamente usando
                inteligencia artificial. Ahorra horas de trabajo manual.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Tiempo Real
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Sincronización instantánea entre ventas, técnicos y administración.
                Todos siempre actualizados.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Analytics Avanzados
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Métricas en tiempo real, KPIs de técnicos y reportes de rendimiento
                para tomar mejores decisiones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl border border-blue-500/30 backdrop-blur-sm">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Listo para transformar tu soporte técnico?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Únete a equipos que ya están ahorrando tiempo y mejorando la calidad de su servicio.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all duration-200 shadow-2xl"
            >
              Comenzar Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p>© 2025 AlfaTechFlow. Potenciado por IA para equipos técnicos modernos.</p>
        </div>
      </footer>
    </div>
  );
}
