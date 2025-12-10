import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3, Sparkles, Users, Clock, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AlfaTechFlow
            </span>
          </div>
          <Link
            href="/auth/login"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Acceder al Sistema
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Sistema de Gestión Técnica con IA
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 text-slate-900 leading-tight">
            Plataforma de Soporte
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Técnico Inteligente
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Sistema integral para la gestión de tickets, generación automática de reportes técnicos
            con IA, y seguimiento en tiempo real del equipo de soporte.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/preview"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-xl shadow-blue-500/20 flex items-center gap-2"
            >
              Explorar Funcionalidades
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all duration-200 border border-slate-200 shadow-sm hover:shadow-md"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Características Principales
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tu equipo técnico de manera eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/5">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Reportes Automáticos con IA
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Generación automática de reportes técnicos profesionales usando
                Google Gemini AI. Reduce el tiempo de documentación en un 75%.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white rounded-2xl border border-slate-100 hover:border-purple-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-purple-500/5">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Sincronización en Tiempo Real
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Actualización instantánea entre ventas, técnicos y administración.
                Notificaciones push y actualizaciones automáticas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/5">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Métricas y Analytics
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Dashboard con KPIs de rendimiento, tiempo de resolución,
                y estadísticas por técnico para optimizar el equipo.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-white rounded-2xl border border-slate-100 hover:border-green-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-green-500/5">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Gestión de Equipos
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Asignación inteligente de tickets, seguimiento de carga de trabajo,
                y gestión de permisos por roles (Admin, Técnico, Ventas).
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-white rounded-2xl border border-slate-100 hover:border-orange-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-orange-500/5">
              <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Historial Completo
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Acceso a todos los reportes históricos, descarga de PDFs,
                y reenvío automático por email a clientes.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Integración con Pipedrive
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Autocompletado de datos de clientes desde Pipedrive CRM,
                sincronización bidireccional de información.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Sistema Diseñado para Equipos Técnicos
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Optimiza la gestión de soporte, reduce tiempos de documentación,
              y mejora la satisfacción del cliente con reportes profesionales automáticos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/preview"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg"
              >
                Ver Demo Interactiva
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-700 text-white rounded-xl font-bold text-lg hover:bg-blue-800 transition-all duration-200 border-2 border-white/20"
              >
                Acceder al Sistema
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p>© 2025 AlfaTechFlow. Sistema de gestión técnica potenciado por IA.</p>
        </div>
      </footer>
    </div>
  );
}
