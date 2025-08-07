<!--  ────────────────────────────────────────────────────────────────  -->
# 📝 Sustain-CLI Project Scorecard  
*Snapshot assessment — 5 Aug 2025*

[![Overall](https://img.shields.io/badge/Overall-46%2F100-orange.svg)]( )&nbsp;
[![Maturity](https://img.shields.io/badge/Status-Pre--Alpha-yellow.svg)]( )&nbsp;
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)]( )

> **TL;DR** : Sustain-CLI has a compelling mission, but right now it’s more **scaffolding** than **solution**.  
> Closing the gaps in implementation, tests, and docs will unlock its potential.

---

## 1. Score Breakdown

| Area | Weight | ★ Score<sup>†</sup> | What we saw |
| :----------------------------- | :-: | :-: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vision & Value** | 10 % | **7** | Clear objective (green-IT telemetry → CO₂ reports) and well-named commands. |
| **Implementation Depth** | 20 % | **3** | CLI wrapper exists but key calculators & energy models are still TODO. |
| **Documentation & UX** | 15 % | **4** | README outlines features; install/usage buried in *QUICKSTART.md*; no screenshots. |
| **Testing & CI** | 15 % | **0** | No unit tests, no GitHub Actions. |
| **Release Management** | 10 % | **2** | Four npm versions yet zero GitHub releases/tags; no CHANGELOG. |
| **Community & Governance** | 10 % | **1** | Solo maintainer; missing CONTRIBUTING, CODE_OF_CONDUCT, issue templates. |
| **Packaging & Distribution** | 10 % | **4** | Available via `npm i -g`, but no standalone binaries for locked-down environments. |
| **Sustainability Data Sources** | 10 % | **3** | Carbon factors not cited; users can’t verify methodology. |
| **Security & Maintenance** | 10 % | **2** | No dependabot/audit workflow; 🆑 open dependency updates. |
| **Total (weighted)** | **100 %** | **46 / 100** | |

<sup>† Scores are 0-10 (higher = better), then multiplied by weight.</sup>

---

## 2. Visual Snapshot

<img src="https://progress-bar.dev/46/?title=project+score" alt="46% overall score" width="85%">

---

## 3. Quick Wins ▶️

| Impact | Effort | Action |
| :----: | :---: | :---------------------------------------------------------------------------------------------------------------------------------- |
| 🔥 **High** | 🟢 **Low** | Add `LICENSE`, basic usage example & GIF to the root README. |
| 🔥 **High** | 🟡 **Med** | Ship an MVP calculator (e.g. CPU kWh → CO₂) plus Jest tests; wire up GitHub Actions (`node@20`, `pnpm -r test`). |
| 🔥 **High** | 🟡 **Med** | Tag v0.2.0 with CHANGELOG; attach pre-built binaries via `pkg` or `bun build`. |
| ⚡ **Medium** | 🟢 **Low** | Enable Dependabot & CodeQL; add `npm run lint` to CI. |
| ⚡ **Medium** | 🟡 **Med** | Create `docs/data-sources.md` citing IEA/DEFRA emission factors with version numbers. |
| ✨ **Nice-to-have** | 🟢 **Low** | Badges for npm version, build, coverage. |

---

## 4. Longer-Term Focus 🎯

1. **Vertical slice first** – Fully implement one resource metric end-to-end (collect → convert → report).  
2. **Community scaffolding** – CONTRIBUTING, CODE_OF_CONDUCT, issue templates, GitHub Discussions.  
3. **Extensibility docs** – Example plugin & Typedoc-generated API reference.  
4. **User trust** – Add provenance for carbon factors, region overrides, and validation versus public datasets.

---

## 5. Contributing Guide Stub

```bash
# Fork & clone
gh repo fork randish-soft/Sustain-cli --clone
cd Sustain-cli && pnpm install

# Run all checks
pnpm dlx nx run-many --target=lint,test,build

# Spin up live telemetry demo
pnpm sustain resources --live
