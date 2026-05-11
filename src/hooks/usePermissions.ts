// usePermissions — 22 flags granulares baseadas no profile.role.
// Portado de lemehubapp-main/src/hooks/usePermissions.ts, adaptado pro hipvaa (useAuth -> profile?.role).

import { useAuth } from "./useAuth";

export function usePermissions() {
  const { profile } = useAuth();
  const role = profile?.role ?? null;

  // Financial — owner, manager, finance (NÃO coordinator)
  const canAccessFinancial = ["owner", "manager", "finance"].includes(role || "");

  // Settings — owner, manager, coordinator
  const canAccessSettings = ["owner", "manager", "coordinator"].includes(role || "");

  // Theme/White-label — só owner
  const canAccessTheme = role === "owner";

  // Terms — owner, manager, coordinator
  const canAccessTerms = ["owner", "manager", "coordinator"].includes(role || "");

  // Communication (banners, partners) — owner, manager, coordinator
  const canAccessCommunication = ["owner", "manager", "coordinator"].includes(
    role || "",
  );

  // Users/Permissions — owner, manager, coordinator
  const canAccessUsers = ["owner", "manager", "coordinator"].includes(role || "");

  // Plans — owner, manager, coordinator, finance
  const canAccessPlans = ["owner", "manager", "coordinator", "finance"].includes(
    role || "",
  );

  // Venues — owner, manager, coordinator
  const canAccessVenues = ["owner", "manager", "coordinator"].includes(role || "");

  // Boats — owner, manager, coordinator
  const canAccessBoats = ["owner", "manager", "coordinator"].includes(role || "");

  // Reports — owner, manager, finance (NÃO coordinator)
  const canAccessReports = ["owner", "manager", "finance"].includes(role || "");

  // Coach mode — owner, manager, coordinator, coach
  const canAccessCoach = ["owner", "manager", "coordinator", "coach"].includes(
    role || "",
  );

  // Crew Summary — owner, manager, coordinator, coach
  const canAccessCrewSummary = [
    "owner",
    "manager",
    "coordinator",
    "coach",
  ].includes(role || "");

  // Announcements — owner, manager, coordinator, coach
  const canAccessAnnouncements = [
    "owner",
    "manager",
    "coordinator",
    "coach",
  ].includes(role || "");

  // Workouts — owner, manager, coordinator, coach
  const canAccessWorkouts = ["owner", "manager", "coordinator", "coach"].includes(
    role || "",
  );

  // Teams (crew templates) — owner, manager, coordinator, coach
  const canAccessTeams = ["owner", "manager", "coordinator", "coach"].includes(
    role || "",
  );

  // Students — owner, manager, coordinator, coach, staff
  const canAccessStudents = [
    "owner",
    "manager",
    "coordinator",
    "coach",
    "staff",
  ].includes(role || "");

  // Classes — owner, manager, coordinator, coach, staff
  const canAccessClasses = [
    "owner",
    "manager",
    "coordinator",
    "coach",
    "staff",
  ].includes(role || "");

  // Dashboard — todos os admin roles
  const canAccessDashboard = [
    "owner",
    "manager",
    "coordinator",
    "finance",
    "coach",
    "staff",
  ].includes(role || "");

  // Community moderation — owner, manager, coordinator, coach
  const canModerateCommunity = [
    "owner",
    "manager",
    "coordinator",
    "coach",
  ].includes(role || "");

  // Training plans & exercise library — owner, manager, coordinator, coach
  const canAccessTrainingPlans = [
    "owner",
    "manager",
    "coordinator",
    "coach",
  ].includes(role || "");

  // Health questionnaire — owner, manager, coordinator, coach
  const canAccessHealthQuestionnaire = [
    "owner",
    "manager",
    "coordinator",
    "coach",
  ].includes(role || "");

  // Physical assessments — owner, manager, coordinator, coach
  const canAccessPhysicalAssessments = [
    "owner",
    "manager",
    "coordinator",
    "coach",
  ].includes(role || "");

  // Competitions — owner, manager, coordinator, coach
  const canAccessCompetitions = [
    "owner",
    "manager",
    "coordinator",
    "coach",
  ].includes(role || "");

  return {
    role,
    canAccessFinancial,
    canAccessSettings,
    canAccessTheme,
    canAccessTerms,
    canAccessCommunication,
    canAccessUsers,
    canAccessPlans,
    canAccessVenues,
    canAccessBoats,
    canAccessReports,
    canAccessCoach,
    canAccessCrewSummary,
    canAccessAnnouncements,
    canAccessWorkouts,
    canAccessTeams,
    canAccessStudents,
    canAccessClasses,
    canAccessDashboard,
    canModerateCommunity,
    canAccessTrainingPlans,
    canAccessHealthQuestionnaire,
    canAccessPhysicalAssessments,
    canAccessCompetitions,
  };
}
