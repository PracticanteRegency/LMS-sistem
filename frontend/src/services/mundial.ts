// ============================================================
//  mundial.ts — Types, Interfaces, Constants & Helpers
//  MICampeonato — Sistema de Predicciones Mundial 2026
// ============================================================

// ===== TYPES & INTERFACES =====

export type WinnerChoice = "home" | "away" | "draw";
export type MatchStatus = "open" | "locked" | "finished" | "abierto" | "bloqueado" | "finalizado";
export type AdminTab = "matches" | "results" | "teams" | "special" | "settings";

export interface MatchData {
  id: number;
  equipo_local: number;
  equipo_local_nombre: string;
  equipo_local_bandera: string;
  equipo_visitante: number;
  equipo_visitante_nombre: string;
  equipo_visitante_bandera: string;
  fecha: string;
  hora: string;
  fase: string;
  grupo: string | null;
  multiplicador: string;
  estado: string;
  puede_predecir?: boolean;
  // Legacy fallback fields for compatibility
  homeTeam?: string;
  homeFlag?: string;
  awayTeam?: string;
  awayFlag?: string;
  date?: string;
  time?: string;
  phase?: string;
  group?: string | null;
  multiplier?: string;
  status?: MatchStatus;
}

export interface Match extends MatchData {
  resultado: { goles_local: number; goles_visitante: number } | null;
  result?: { home: number; away: number } | null;
  fue_a_penaltis?: boolean;
  puede_editar?: boolean;
  puede_ingresar_resultado?: boolean;
  goles_local?: number;
  goles_visitante?: number;
  penaltis_local?: number;
  penaltis_visitante?: number;
  total_predicciones?: number;
  mi_prediccion?: any;
}

export interface Prediction {
  home: number;
  away: number;
  winner: WinnerChoice;
  predice_penaltis?: boolean;
  penaltis_local?: number;
  penaltis_visitante?: number;
}

export interface RankingEntry {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  exactHits: number;
  trend: string;
  isCurrentUser?: boolean;
}

export interface Step {
  step: string;
  emoji: string;
  title: string;
  description: string;
}

export interface ScoringRule {
  points: string;
  condition: string;
  example: string;
}

export interface MultiplierRule {
  phase: string;
  multiplier: string;
}

export interface Prize {
  position: string;
  prize: string;
  percentage: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
}

export interface SpecialPrediction {
  name: string;
  points: string;
}

export interface TeamOption {
  name: string;
  flag: string;
}

export interface PhaseOption {
  value: string;
  label: string;
  multiplier: string;
}

export interface SpecialPointsSetting {
  name: string;
  pts: number;
}

// ===== CONSTANTS =====

export const STEPS: Step[] = [
  {
    step: "01",
    emoji: "📝",
    title: "Regístrate",
    description: "Crea tu cuenta y únete a la comunidad de participantes del MICampeonato.",
  },
  {
    step: "02",
    emoji: "🎯",
    title: "Haz tus predicciones",
    description: "Predice el resultado de cada partido antes de que comience. Elige el ganador y el marcador.",
  },
  {
    step: "03",
    emoji: "📊",
    title: "Acumula puntos",
    description: "Gana puntos por cada acierto. Resultado exacto vale más que solo acertar el ganador.",
  },
  {
    step: "04",
    emoji: "🏆",
    title: "Gana premios",
    description: "Los mejores clasificados ganan premios increíbles al final del torneo.",
  },
];

export const SCORING_RULES: ScoringRule[] = [
  {
    points: "3 puntos",
    condition: "Resultado exacto",
    example: 'Ej: Predices 2-1 y el resultado es 2-1',
  },
  {
    points: "1 punto",
    condition: "Ganador correcto",
    example: 'Ej: Predices 3-1 y el resultado es 2-0 (misma dirección)',
  },
  {
    points: "0 puntos",
    condition: "Resultado incorrecto",
    example: 'Ej: Predices 2-0 y el resultado es 1-3',
  },
];

export const MULTIPLIER_RULES: MultiplierRule[] = [
  { phase: "Fase de Grupos", multiplier: "x1" },
  { phase: "16avos de Final", multiplier: "x1.5" },
  { phase: "Octavos de Final", multiplier: "x2" },
  { phase: "Cuartos de Final", multiplier: "x3" },
  { phase: "Semifinales", multiplier: "x4" },
  { phase: "Tercer Puesto", multiplier: "x4" },
  { phase: "Final", multiplier: "x5" },
];

export const PRIZES: Prize[] = [
  {
    position: "1er Lugar",
    prize: "$25,000",
    percentage: "50%",
    emoji: "🥇",
    bgColor: "rgba(255,215,0,0.15)",
    borderColor: "rgba(255,215,0,0.5)",
  },
  {
    position: "2do Lugar",
    prize: "$15,000",
    percentage: "30%",
    emoji: "🥈",
    bgColor: "rgba(192,192,192,0.15)",
    borderColor: "rgba(192,192,192,0.5)",
  },
  {
    position: "3er Lugar",
    prize: "$10,000",
    percentage: "20%",
    emoji: "🥉",
    bgColor: "rgba(205,127,50,0.15)",
    borderColor: "rgba(205,127,50,0.5)",
  },
];

export const SPECIAL_PREDICTIONS: SpecialPrediction[] = [
  { name: "🏆 Campeón del Torneo", points: "10 pts" },
  { name: "🥈 Subcampeón", points: "7 pts" },
  { name: "⚽ Goleador del Torneo", points: "5 pts" },
  { name: "🧤 Mejor Portero", points: "5 pts" },
  { name: "⭐ Mejor Jugador", points: "5 pts" },
  { name: "🎯 Máximo Asistidor", points: "5 pts" },
];

export const SPECIAL_POINTS_SETTINGS: SpecialPointsSetting[] = [
  { name: "Campeón del Torneo", pts: 10 },
  { name: "Subcampeón", pts: 7 },
  { name: "Goleador del Torneo", pts: 5 },
  { name: "Mejor Portero", pts: 5 },
  { name: "Mejor Jugador", pts: 5 },
  { name: "Máximo Asistidor", pts: 5 },
];

export const PHASES = [
  "Todos",
  "Grupos",
  "16avos",
  "Octavos",
  "Cuartos",
  "Semifinales",
  "Tercer Puesto",
  "Final",
];

export const PHASE_OPTIONS_HOME = [
  "Grupos",
  "16avos",
  "Octavos",
  "Cuartos",
  "Semifinales",
  "Final",
];

export const PHASE_OPTIONS: PhaseOption[] = [
  { value: "Grupos", label: "Fase de Grupos", multiplier: "x1" },
  { value: "16avos", label: "16avos de Final", multiplier: "x1.5" },
  { value: "Octavos", label: "Octavos de Final", multiplier: "x2" },
  { value: "Cuartos", label: "Cuartos de Final", multiplier: "x3" },
  { value: "Semifinales", label: "Semifinales", multiplier: "x4" },
  { value: "Tercer Puesto", label: "Tercer Puesto", multiplier: "x4" },
  { value: "Final", label: "Final", multiplier: "x5" },
];

export const GROUPS = [
  "A", "B", "C", "D", "E", "F",
  "G", "H", "I", "J", "K", "L",
];

export const GROUP_OPTIONS = GROUPS;

export const TEAM_OPTIONS: TeamOption[] = [
  { name: "México", flag: "🇲🇽" },
  { name: "Estados Unidos", flag: "🇺🇸" },
  { name: "Canadá", flag: "🇨🇦" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Alemania", flag: "🇩🇪" },
  { name: "España", flag: "🇪🇸" },
  { name: "Francia", flag: "🇫🇷" },
  { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Países Bajos", flag: "🇳🇱" },
  { name: "Italia", flag: "🇮🇹" },
  { name: "Croacia", flag: "🇭🇷" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Japón", flag: "🇯🇵" },
  { name: "Corea del Sur", flag: "🇰🇷" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Arabia Saudita", flag: "🇸🇦" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Bélgica", flag: "🇧🇪" },
  { name: "Dinamarca", flag: "🇩🇰" },
  { name: "Marruecos", flag: "🇲🇦" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Suiza", flag: "🇨🇭" },
  { name: "Camerún", flag: "🇨🇲" },
  { name: "Serbia", flag: "🇷🇸" },
  { name: "Gales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "Túnez", flag: "🇹🇳" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Perú", flag: "🇵🇪" },
  { name: "Irán", flag: "🇮🇷" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Polonia", flag: "🇵🇱" },
  { name: "Egipto", flag: "🇪🇬" },
  { name: "Ucrania", flag: "🇺🇦" },
  { name: "Argelia", flag: "🇩🇿" },
  { name: "Por definir", flag: "🏳️" },
];

// ===== NO MOCK DATA — All data from backend API =====

// ===== HELPER FUNCTIONS =====

const TEAM_FLAG_MAP: Record<string, string> = {};
TEAM_OPTIONS.forEach((t) => {
  TEAM_FLAG_MAP[t.name] = t.flag;
});

export function getTeamFlag(teamName: string): string {
  return TEAM_FLAG_MAP[teamName] || "🏳️";
}

export function getPhaseMultiplier(phase: string): string {
  const found = PHASE_OPTIONS.find((p) => p.value === phase);
  return found ? found.multiplier : "x1";
}

export function getTrendColor(trend: string | undefined): "up" | "down" | "neutral" {
  if (!trend || typeof trend !== "string") return "neutral";
  if (trend.startsWith("+") && trend !== "+0") return "up";
  if (trend.startsWith("-")) return "down";
  return "neutral";
}

export function getMultiplierColor(multiplier: string): string {
  switch (multiplier) {
    case "x1":
      return "#4CAF50";
    case "x1.5":
      return "#66BB6A";
    case "x2":
      return "#FFC107";
    case "x3":
      return "#FF9800";
    case "x4":
      return "#F44336";
    case "x5":
      return "#E91E63";
    default:
      return "#4CAF50";
  }
}

export function formatDateES(dateStr: string): string {
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1] || parts[1];
  const year = parts[0];
  return `${day} ${month} ${year}`;
}
