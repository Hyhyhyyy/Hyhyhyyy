# Grow in Color Maintenance

## Files

- `README.md`: profile content and clickable entry points.
- `assets/hero-light.svg`: light-theme hero.
- `assets/hero-dark.svg`: dark-theme hero.
- `assets/tomato-runner*.svg`: responsive giant rolling tomato animation.
- `assets/tomato-heatmap*.svg`: generated contribution ripeness matrices.
- `assets/quick-facts*.svg`: responsive flat-color personal overview.
- `assets/stats.svg`: generated public statistics.
- `scripts/update-profile.mjs`: self-hosted statistics generator.
- `.github/workflows/update-profile.yml`: daily and manual update workflow.

## Palette

- Cream: `#FFF8E7`
- Sunshine: `#FFCF4D`
- Navy: `#173149`
- Tomato: `#FF4D35`
- Coral: `#FF725C`
- Cyan: `#69D5D0`
- Leaf: `#63C54B`
- Body gray: `#65717A`

Visual assets use system font stacks and load no external fonts. SVG motion is disabled automatically when the operating system requests reduced motion.

## Updating

1. Edit the corresponding public text or project link in `README.md`.
2. When featured projects change, update the project links and labels in `README.md`.
3. Set `GITHUB_TOKEN`, then run `node scripts/update-profile.mjs` to refresh statistics and both contribution heatmaps.
4. GitHub Actions checks daily at approximately 09:17 China Standard Time and also supports manual dispatch.

## Failure behavior

- If the data workflow fails, the last successful statistics and heatmap SVGs remain visible.
- If an image is missing, verify path spelling and letter case.
- If motion does not play, check the operating system reduced-motion preference. Content and links remain functional.

## Rollback

The default-branch commit before deployment is the stable rollback point. If rendering fails, revert the merge commit or restore the prior files with a new commit. Do not force-push the default branch.
