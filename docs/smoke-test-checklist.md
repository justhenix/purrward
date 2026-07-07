<!-- Manual smoke-test checklist for the final Purrward demo pass. -->

# Smoke Test Checklist

Live credentials are manual, not automated. Do not mark OAuth, Turso, or Gemini paths as passed unless they were run against the live demo environment.

## Live Env Smoke Tests

- [ ] Google OAuth login - manual, not automated
- [ ] Email/password register/login if intended for demo - manual, not automated
- [ ] Onboarding owned cat
- [ ] Onboarding community cat
- [ ] Active cat selection
- [ ] Care proof camera permission
- [ ] Care proof verification through `/api/verify` - manual, not automated when Gemini credentials are required
- [ ] Points increase after verified proof - manual, not automated when live DB/Gemini credentials are required
- [ ] Reward redeem flow
- [ ] Vet triage question - manual, not automated when Gemini credentials are required
- [ ] Emergency vet banner
- [ ] Dark/light/system theme switch
- [ ] Logout/login session persistence - manual, not automated
- [ ] Mobile viewport recording pass
- [ ] No secrets visible in terminal, screenshots, or video

## Mock/Demo-Only Flows

- [ ] Any sandbox verification path is visibly labeled as demo-only
- [ ] Any mock reward or booking copy is visibly labeled as demo-only
- [ ] No demo-only path is described as a live credential smoke pass
