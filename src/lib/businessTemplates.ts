// Business Templates — configuração de tipo de negócio + feature flags.
// Portado de lemehubapp-main/src/lib/businessTemplates.ts.

export interface FeatureFlags {
  boats_enabled: boolean;
  teams_enabled: boolean;
  workouts_enabled: boolean;
  crew_organizer_enabled: boolean;
  checkin_enabled: boolean;
  training_plans_enabled: boolean;
  physical_assessments_enabled: boolean;
  competitions_enabled: boolean;
  strava_enabled: boolean;
  exercise_videos_enabled: boolean;
  community_enabled: boolean;
  shop_enabled: boolean;
  partners_enabled: boolean;
  health_questionnaire_enabled: boolean;
  class_management_enabled: boolean;
}

export interface BusinessTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultFlags: FeatureFlags;
}

const BASE_FLAGS: FeatureFlags = {
  boats_enabled: false,
  teams_enabled: false,
  workouts_enabled: false,
  crew_organizer_enabled: false,
  checkin_enabled: true,
  training_plans_enabled: false,
  physical_assessments_enabled: false,
  competitions_enabled: false,
  strava_enabled: false,
  exercise_videos_enabled: false,
  community_enabled: true,
  shop_enabled: false,
  partners_enabled: true,
  health_questionnaire_enabled: false,
  class_management_enabled: true,
};

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: "rowing",
    name: "Remo / Canoa Havaiana",
    icon: "🚣",
    description: "Clubes de remo e canoa havaiana com gestão de embarcações",
    defaultFlags: {
      ...BASE_FLAGS,
      boats_enabled: true,
      teams_enabled: true,
      workouts_enabled: true,
      crew_organizer_enabled: true,
    },
  },
  {
    id: "yoga",
    name: "Yoga / Pilates",
    icon: "🧘",
    description: "Estúdio de yoga, pilates e práticas contemplativas",
    defaultFlags: { ...BASE_FLAGS },
  },
  {
    id: "crossfit",
    name: "CrossFit / Box",
    icon: "🏋️",
    description: "Box de CrossFit e treinamento funcional intenso",
    defaultFlags: { ...BASE_FLAGS, workouts_enabled: true },
  },
  {
    id: "coach_personal",
    name: "Coach / Personal Trainer",
    icon: "🏃",
    description:
      "Treinador individual com treinos personalizados e acompanhamento de performance",
    defaultFlags: {
      ...BASE_FLAGS,
      checkin_enabled: false,
      class_management_enabled: false,
      training_plans_enabled: true,
      physical_assessments_enabled: true,
      competitions_enabled: true,
      strava_enabled: true,
      exercise_videos_enabled: true,
      health_questionnaire_enabled: true,
    },
  },
  {
    id: "generic",
    name: "Outros",
    icon: "📋",
    description: "Configuração personalizada para outros tipos de negócio",
    defaultFlags: { ...BASE_FLAGS, workouts_enabled: true },
  },
];

export interface FeatureFlagInfo {
  key: keyof FeatureFlags;
  label: string;
  description: string;
}

export const FEATURE_FLAGS_INFO: FeatureFlagInfo[] = [
  {
    key: "checkin_enabled",
    label: "Check-in",
    description: "Sistema de check-in em aulas",
  },
  {
    key: "boats_enabled",
    label: "Canoas",
    description: "Gerenciamento de equipamentos e capacidade automática",
  },
  {
    key: "teams_enabled",
    label: "Equipes",
    description: "Templates de formação salvos",
  },
  {
    key: "workouts_enabled",
    label: "Aulas",
    description: "Biblioteca de aulas e séries",
  },
  {
    key: "crew_organizer_enabled",
    label: "Organizador",
    description: "Distribuição de alunos nos equipamentos",
  },
  {
    key: "training_plans_enabled",
    label: "Treinos Individuais",
    description: "Planejamento de treinos personalizados por aluno",
  },
  {
    key: "physical_assessments_enabled",
    label: "Avaliações Físicas",
    description: "Registro de avaliações e medidas corporais",
  },
  {
    key: "competitions_enabled",
    label: "Competições",
    description: "Datas de provas e alertas de competições",
  },
  {
    key: "exercise_videos_enabled",
    label: "Vídeos de Exercícios",
    description: "Upload de vídeos demonstrativos de exercícios",
  },
  {
    key: "strava_enabled",
    label: "Strava",
    description: "Integração com Strava para resultados de treinos",
  },
  {
    key: "shop_enabled",
    label: "Loja",
    description: "Venda de produtos pelo app",
  },
  {
    key: "community_enabled",
    label: "Comunidade",
    description: "Feed de posts da comunidade",
  },
  {
    key: "partners_enabled",
    label: "Parceiros",
    description: "Convênios e parceiros com benefícios para alunos",
  },
  {
    key: "health_questionnaire_enabled",
    label: "Questionário de Saúde",
    description: "Coleta de dados de saúde no cadastro do aluno",
  },
  {
    key: "class_management_enabled",
    label: "Gestão de Aulas",
    description: "Grade de aulas, check-in e chamada presencial",
  },
];

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  boats_enabled: true,
  teams_enabled: true,
  workouts_enabled: true,
  crew_organizer_enabled: true,
  checkin_enabled: true,
  training_plans_enabled: false,
  physical_assessments_enabled: false,
  competitions_enabled: false,
  strava_enabled: false,
  exercise_videos_enabled: false,
  shop_enabled: false,
  community_enabled: true,
  partners_enabled: true,
  health_questionnaire_enabled: false,
  class_management_enabled: true,
};

export function getTemplateById(id: string): BusinessTemplate | undefined {
  return BUSINESS_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultFlagsForTemplate(templateId: string): FeatureFlags {
  const template = getTemplateById(templateId);
  return template?.defaultFlags ?? DEFAULT_FEATURE_FLAGS;
}
