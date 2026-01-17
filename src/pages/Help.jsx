
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
    Layout, Calendar, Users, ShoppingBag, Megaphone, FileText, Settings, 
    HelpCircle, Keyboard, Zap, ChevronRight, BookOpen, Search, Shield,
    Bell, CheckCircle, BarChart2, Plus, Filter, Download, Command,
    Play, Target, Award, MousePointer, Info, Lightbulb
} from 'lucide-react';

const Help = () => {
    const { theme } = useTheme();
    const [activeSection, setActiveSection] = useState('intro');

    const sections = [
        { id: 'intro', label: 'Introducción', icon: BookOpen },
        { id: 'dashboard', label: 'Dashboard', icon: Layout },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
        { id: 'campaigns', label: 'Campañas', icon: Megaphone },
        { id: 'directory', label: 'Directorio', icon: Users },
        { id: 'ratecard', label: 'Tarifario', icon: ShoppingBag },
        { id: 'reports', label: 'Reportes', icon: FileText },
        { id: 'masterclass', label: 'Clases Prácticas', icon: Award },
        { id: 'settings', label: 'Configuración', icon: Settings },
        { id: 'shortcuts', label: 'Atajos & Trucos', icon: Keyboard },
    ];

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
            {/* Sidebar Navigation */}
            <div className={`w-full md:w-64 h-fit ${theme.cardBg} backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col gap-2`}>
                <h2 className={`text-xl font-bold ${theme.text} mb-4 px-2 flex items-center gap-2`}>
                    <HelpCircle className={theme.accent} /> Centro de Ayuda
                </h2>
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                            activeSection === section.id 
                                ? `${theme.accentBg} text-black font-bold shadow-lg` 
                                : `text-white/60 hover:bg-white/5 hover:text-white`
                        }`}
                    >
                        <section.icon size={18} />
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className={`flex-1 ${theme.cardBg} backdrop-blur-md rounded-2xl border border-white/5 p-8 overflow-y-auto custom-scrollbar`}>
                
                {/* INTRO */}
                {activeSection === 'intro' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">Bienvenido a 360° Hub</h1>
                            <p className="text-lg text-white/70 leading-relaxed">
                                Esta plataforma es tu centro de comando integral para la gestión de Retail Media. 
                                Diseñada para directores de marketing y operaciones, 360° Hub centraliza la planificación de campañas, 
                                gestión de presupuesto, relaciones con proveedores y análisis de rendimiento en una única interfaz unificada y de alto rendimiento.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card 
                                icon={Zap} 
                                title="Filosofía Zero-Friction" 
                                description="Todo está diseñado para ser rápido. Sin tiempos de carga, sin formularios innecesarios. Tus datos persisten automáticamente."
                            />
                            <Card 
                                icon={Shield} 
                                title="Privacidad Total" 
                                description="Tus datos viven en tu dispositivo. Utilizamos almacenamiento local encriptado. Tú eres dueño de tu información."
                            />
                        </div>

                        <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                            <h3 className="text-xl font-bold text-blue-300 mb-2">¿Cómo empezar?</h3>
                            <ol className="list-decimal list-inside space-y-2 text-white/80">
                                <li>Ve a <strong>Configuración</strong> para elegir tu tema preferido.</li>
                                <li>Carga tus primeros proveedores en el <strong>Directorio</strong>.</li>
                                <li>Define tus costos base en el <strong>Tarifario</strong>.</li>
                                <li>¡Crea tu primera <strong>Campaña</strong> y asigna presupuesto!</li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* DASHBOARD */}
                {activeSection === 'dashboard' && (
                    <ModuleGuide title="Dashboard Estratégico" icon={Layout}>
                        <Section title="Visión General">
                            <p>El Dashboard es tu torre de control. Diseñado para responder una sola pregunta: <strong>¿Cómo vamos hoy?</strong>.</p>
                            <p className="mt-2">No es solo para ver datos bonitos, es para tomar decisiones basadas en 3 indicadores: Ejecución, ROI y Velocidad.</p>
                        </Section>
                        
                        <Section title="Interpretando el Panel ROI (Tarjeta Principal)">
                            <p>Esta tarjeta es el corazón financiero. Muchos usuarios se confunden entre "Presupuesto" y "Ejecutado". Aquí la diferencia:</p>
                            
                            <ExampleBox 
                                title="Campaña 'Verano 2025'"
                                data={
                                    <>
                                        <div className="flex justify-between border-b border-white/10 pb-1 mb-1">
                                            <span>Presupuesto (Planificado):</span>
                                            <span className="text-white font-bold">$1.000.000</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/10 pb-1 mb-1">
                                            <span>Ejecutado (Facturas cargadas):</span>
                                            <span className="text-red-300 font-bold">$200.000</span>
                                        </div>
                                        <div className="flex justify-between pt-1">
                                            <span>Disponible (Para gastar):</span>
                                            <span className="text-green-300 font-bold">$800.000</span>
                                        </div>
                                        <div className="mt-2 text-xs text-white/50 italic">
                                            * Tu ROI se calculará sobre los $200k gastados, no sobre el millón planificado.
                                        </div>
                                    </>
                                }
                            />
                        </Section>

                        <Section title="Widgets Operativos">
                            <StepList steps={[
                                { title: 'Team Velocity', description: 'Muestra los eventos de los próximos 7 días (Lanzamientos y Deadlines). Úsalo para saber qué urge esta semana.' },
                                { title: 'Mis Tareas', description: 'Tu Command Center personal. Haz clic para abrir el tablero Kanban completo.' },
                                { title: 'Reportes Favoritos', description: 'Accesos directos a los PDFs que generas recurrentemente.' }
                            ]} />
                        </Section>
                        
                        <Exercise 
                            title="Lectura de Tablero" 
                            difficulty="Principiante"
                            steps={[
                                "Identifica la campaña con menor ROI en la tabla 'Rentabilidad'.",
                                "Haz clic en ella para ver el desglose financiero.",
                                "Verifica si el bajo ROI es por falta de ingresos o exceso de gastos.",
                                "Anota una tarea en el widget para revisarlo con tu equipo."
                            ]}
                        />
                    </ModuleGuide>
                )}

                {/* CALENDAR */}
                {activeSection === 'calendar' && (
                    <ModuleGuide title="Calendario Maestro" icon={Calendar}>
                        <Section title="Todo en un solo lugar">
                            <p>El calendario fusiona tres fuentes de datos:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70 ml-4">
                                <li><strong>Campañas:</strong> Las fechas de inicio de tus campañas activas (Color Azul/Marca).</li>
                                <li><strong>Eventos de Marketing:</strong> Hitos globales como "Cyber Monday" o "Navidad" (Color Naranja).</li>
                                <li><strong>Recordatorios Personales:</strong> Notas que agregues manualmente (Color Verde/Violeta).</li>
                            </ul>
                        </Section>
                        
                        <Section title="Filtros Inteligentes">
                            <p>En la barra lateral izquierda puedes apagar/encender capas de información. Si solo quieres ver Deadlines, desactiva "Marketing" y "Campañas".</p>
                        </Section>

                        <Section title="Crear Eventos">
                            <p>Haz clic en cualquier celda vacía o en el botón "+ Nuevo Evento". Puedes elegir entre:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70 ml-4">
                                <li><strong>Deadline:</strong> Fechas de entrega críticas.</li>
                                <li><strong>Reunión:</strong> Agendas con proveedores o equipo.</li>
                                <li><strong>Lanzamiento:</strong> Start de productos nuevos.</li>
                            </ul>
                        </Section>
                    </ModuleGuide>
                )}

                 {/* CAMPAIGNS */}
                 {activeSection === 'campaigns' && (
                    <ModuleGuide title="Gestión de Campañas" icon={Megaphone}>
                        <Section title="El Ciclo de Vida">
                            <p>Una campaña en 360° Hub no es solo un nombre en una lista. Es un contenedor vivo de tus finanzas.</p>
                            
                            <StepList steps={[
                                { title: '1. Planificación', description: 'Creas la campaña, defines fechas y asignas un Status. En esta etapa, el Presupuesto suele ser 0 o estimado.' },
                                { title: '2. Inyección de Capital', description: 'Vas a la pestaña "Finanzas" y registras un "Ingreso" (Initial Budget). Esto le da combustible a la campaña.' },
                                { title: '3. Ejecución (Gasto)', description: 'A medida que contratas proveedores, registras "Gastos". La barra de progreso avanza.' },
                                { title: '4. Cierre & ROI', description: 'Al finalizar, el sistema compara Ingresos vs Gastos y calcula el Retorno. Si sobró dinero, es Eficiencia. Si faltó, es Overbudget.' }
                            ]} />
                        </Section>

                        <Section title="Estructura de Costos (Ejemplo)">
                            <ExampleBox 
                                title="Campaña Black Friday"
                                data={
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <span className="text-green-400 font-bold">[+] Ingreso:</span>
                                            <span>Budget Marketing Q4 ($500.000)</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-red-400 font-bold">[-] Gasto:</span>
                                            <span>Agencia Creativa ($150.000)</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-red-400 font-bold">[-] Gasto:</span>
                                            <span>Pauta Digital ($300.000)</span>
                                        </div>
                                        <div className="border-t border-white/20 pt-2 flex justify-between font-bold">
                                            <span>Resultado (Disponible):</span>
                                            <span className="text-yellow-400">$50.000 (10% de ahorro)</span>
                                        </div>
                                        <div className="flex justify-between font-bold">
                                            <span>ROI Calculado:</span>
                                            <span className="text-green-400">1.1x (Positivo)</span>
                                        </div>
                                    </div>
                                }
                            />
                        </Section>

                        <Exercise 
                            title="Simulacro Financiero" 
                            difficulty="Intermedio"
                            steps={[
                                "Crea una campaña llamada 'Prueba Piloto'.",
                                "Ve a Finanzas y agrega un Ingreso de $100.000.",
                                "Agrega un Gasto de $120.000 (Overbudget).",
                                "Observa cómo la barra se pone roja y el 'Disponible' pasa a negativo.",
                                "Agrega un 'Ajuste' (Ingreso) de $30.000 para corregirlo."
                            ]}
                        />
                    </ModuleGuide>
                )}

                {/* DIRECTORY */}
                {activeSection === 'directory' && (
                    <ModuleGuide title="Directorio de Proveedores" icon={Users}>
                        <Section title="Organización por Grupos">
                            <p>Tus contactos no están en una lista plana. Están organizados en <strong>Grupos</strong> (ej. "Agencias", "Imprentas", "Logística").</p>
                            <p className="mt-2">Puedes crear nuevos grupos con el botón "+ Grupo" al final de las columnas.</p>
                        </Section>
                        
                        <Section title="Funciones Avanzadas">
                            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70 ml-4">
                                <li><strong>Drag & Drop:</strong> (Próximamente) Mover contactos entre grupos.</li>
                                <li><strong>Mover Contacto:</strong> Usa el menú de 3 puntos en una tarjeta > "Mover a..." para cambiarlo de categoría.</li>
                                <li><strong>Favoritos:</strong> Marca con la estrella ⭐ a tus proveedores top para que aparezcan primero.</li>
                            </ul>
                        </Section>
                    </ModuleGuide>
                )}

                {/* RATE CARD */}
                {activeSection === 'ratecard' && (
                    <ModuleGuide title="Tarifario / Marketplace" icon={ShoppingBag}>
                        <Section title="Control de Costos">
                            <p>Este módulo actúa como tu base de datos de precios de referencia. Es útil para negociaciones y estimaciones rápidas.</p>
                        </Section>
                        
                        <Section title="Categorías">
                            <p>Puedes listar servicios por categorías (ej. "Influencers", "Vía Pública", "Digital"). Al crear una campaña, podrás consultar estos valores (próxima integración) para armar presupuestos más rápido.</p>
                        </Section>
                    </ModuleGuide>
                )}

                 {/* REPORTS */}
                 {activeSection === 'reports' && (
                    <ModuleGuide title="Centro de Reportes" icon={FileText}>
                        <Section title="Generación de Informes">
                            <p>Olvídate de armar PowerPoints manuales. Este módulo genera un PDF profesional con un clic.</p>
                        </Section>
                        
                        <Section title="Tipos de Reporte">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-white/5 rounded-lg">
                                    <h4 className="font-bold text-white mb-1">Ejecutivo (One-Pager)</h4>
                                    <p className="text-xs text-white/60">Resumen de alto nivel. Solo KPIs macro y Top 3 campañas. Ideal para C-Level.</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-lg">
                                    <h4 className="font-bold text-white mb-1">Detallado (Mensual/Q)</h4>
                                    <p className="text-xs text-white/60">Desglose completo por campaña, proveedor y categoría de gasto.</p>
                                </div>
                            </div>
                        </Section>

                        <Section title="Exportación">
                            <p>Actualmente soportamos exportación directa a <strong>PDF</strong>. El modo "Simulación Excel" descarga la data cruda en CSV para análisis externo.</p>
                        </Section>
                    </ModuleGuide>
                )}

                 {/* SETTINGS */}
                 {activeSection === 'settings' && (
                    <ModuleGuide title="Configuración y Seguridad" icon={Settings}>
                        <Section title="Personalización">
                            <p>Elige el "Tema" que mejor se adapte a tu estilo. Los temas (Tilo, Deep, Lirio) cambian toda la paleta de colores de la app para reducir la fatiga visual.</p>
                        </Section>
                        
                        <Section title="Copia de Seguridad (Backup)">
                            <p>Es vital para la seguridad de tus datos.</p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-white/70 ml-4">
                                <li><strong>Descargar:</strong> Crea un archivo <code>.json</code> en tu computadora con TODA la información del sistema.</li>
                                <li><strong>Restaurar:</strong> Si cambias de computadora o se borra tu caché, sube ese archivo para recuperar todo tal cual estaba.</li>
                            </ul>
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-200">
                                <span className="font-bold mr-1">Importante:</span>
                                Si borras la caché de tu navegador, perderás los datos. Haz backups semanales.
                            </div>
                        </Section>
                    </ModuleGuide>
                )}

                {/* SHORTCUTS */}
                {activeSection === 'shortcuts' && (
                    <div className="space-y-8 animate-fadeIn">
                        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                            <Keyboard className={theme.accent} size={32} /> Atajos de Teclado
                        </h1>
                        <p className="text-lg text-white/70 mb-8">Muévete por la aplicación a la velocidad del pensamiento.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ShortcutKey keys={['H']} label="Ir al Home (Dashboard)" />
                            <ShortcutKey keys={['C']} label="Ir a Campañas" />
                            <ShortcutKey keys={['A']} label="Ir al Calendario (Agenda)" />
                            <ShortcutKey keys={['D']} label="Ir al Directorio" />
                            <ShortcutKey keys={['R']} label="Ir a Reportes" />
                            <ShortcutKey keys={['T']} label="Ir a Tarifario" />
                            <ShortcutKey keys={['S']} label="Ir a Configuración" />
                        </div>

                        <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Zap size={20} className="text-yellow-400"/> Trucos Pro</h3>
                            <ul className="space-y-3 text-white/70">
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="mt-1 text-green-400 shrink-0"/>
                                    <span>En inputs numéricos, puedes escribir "1M" y se convertirá en 1.000.000 automáticamente.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="mt-1 text-green-400 shrink-0"/>
                                    <span>Haz clic derecho en las filas del Directorio para opciones rápidas.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="mt-1 text-green-400 shrink-0"/>
                                    <span>Usa el filtro "Aprobación Pendiente" en Campañas para ver qué requiere tu atención inmediata.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Sub-components for structure
// Enhanced Sub-components
const Card = ({ icon: Icon, title, description }) => (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
        <Icon size={32} className="mb-4 text-white/80" />
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </div>
);

const ModuleGuide = ({ title, icon: Icon, children }) => (
    <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="p-3 bg-white/10 rounded-xl">
                <Icon size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">{title}</h1>
        </div>
        <div className="space-y-8">
            {children}
        </div>
    </div>
);

const Section = ({ title, children }) => (
    <div>
        <h2 className="text-xl font-bold mb-4 text-white/90 flex items-center gap-2">
            <ChevronRight size={18} className="text-white/40" /> {title}
        </h2>
        <div className="text-white/70 leading-relaxed pl-6 border-l border-white/10 ml-2 space-y-4">
            {children}
        </div>
    </div>
);

const StepList = ({ steps }) => (
    <div className="space-y-4 my-6">
        {steps.map((step, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E8A631]/20 text-[#E8A631] font-bold flex items-center justify-center border border-[#E8A631]/20">
                    {i + 1}
                </div>
                <div>
                    <h4 className="font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-sm text-white/60">{step.active ? <span>{step.content}</span> : step.description}</p>
                </div>
            </div>
        ))}
    </div>
);

const ExampleBox = ({ title, data }) => (
    <div className="my-6 bg-blue-500/10 border border-blue-500/20 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-blue-500/20 border-b border-blue-500/20 flex items-center gap-2">
            <Info size={16} className="text-blue-300"/>
            <span className="text-xs font-bold uppercase text-blue-300 tracking-wider">Ejemplo Práctico: {title}</span>
        </div>
        <div className="p-4 text-sm text-white/80 font-mono bg-black/20">
            {data}
        </div>
    </div>
);

const Exercise = ({ title, steps, difficulty = 'Fácil' }) => (
    <div className="my-8 border border-[#E8A631]/30 rounded-2xl overflow-hidden">
         <div className="px-6 py-4 bg-[#E8A631]/10 border-b border-[#E8A631]/20 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <Target size={20} className="text-[#E8A631]"/>
                 <h3 className="font-bold text-white">Ejercicio: {title}</h3>
             </div>
             <span className="text-[10px] uppercase font-bold bg-[#E8A631]/20 text-[#E8A631] px-2 py-1 rounded">{difficulty}</span>
         </div>
         <div className="p-6 bg-black/20">
             <p className="text-white/60 mb-4 text-sm">Sigue estos pasos para dominar esta función:</p>
             <ul className="space-y-3">
                 {steps.map((s, i) => (
                     <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                         <div className="mt-0.5"><CheckCircle size={14} className="text-white/20"/></div>
                         {s}
                     </li>
                 ))}
             </ul>
         </div>
    </div>
);

const ShortcutKey = ({ keys, label }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
        <span className="font-bold text-white/80">{label}</span>
        <div className="flex gap-2">
            {keys.map((k, i) => (
                <kbd key={i} className="px-3 py-1 bg-black/40 rounded-lg border border-white/10 font-mono text-sm font-bold text-white shadow-inner">
                    {k}
                </kbd>
            ))}
        </div>
    </div>
);

export default Help;
