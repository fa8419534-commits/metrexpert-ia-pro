export const ONBOARDING_EVENT_KEY = "metrexpert:onboarding-events:v1";

export type OnboardingTelemetryEvent = {
  event: string;
  step: number;
  at: number;
};

export function trackOnboardingEvent(event: string, step: number): void {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_EVENT_KEY);
    const events = raw ? JSON.parse(raw) as OnboardingTelemetryEvent[] : [];
    events.push({ event, step, at: Date.now() });
    window.localStorage.setItem(ONBOARDING_EVENT_KEY, JSON.stringify(events.slice(-200)));
    window.dispatchEvent(new CustomEvent("metrexpert:onboarding-event", { detail: { event, step } }));
  } catch {
    // Le suivi ne doit jamais bloquer le formulaire ni exposer de contenu métier.
  }
}
