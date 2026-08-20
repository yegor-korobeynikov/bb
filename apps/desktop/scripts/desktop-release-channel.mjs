export const DESKTOP_RELEASE_CHANNEL_ENV_NAME = "BB_DESKTOP_RELEASE_CHANNEL";

export function resolveDesktopReleaseChannel(env) {
  const rawChannel = env[DESKTOP_RELEASE_CHANNEL_ENV_NAME]?.trim();
  if (rawChannel === undefined || rawChannel.length === 0) {
    return "latest";
  }
  if (rawChannel === "latest" || rawChannel === "nightly") {
    return rawChannel;
  }

  throw new Error(
    `${DESKTOP_RELEASE_CHANNEL_ENV_NAME} must be latest or nightly, got ${rawChannel}.`,
  );
}

export function resolveDesktopBuildPlatform(nodePlatform) {
  if (nodePlatform === "darwin") {
    return "macos";
  }
  if (nodePlatform === "linux") {
    return "linux";
  }

  throw new Error(
    `Desktop builds support darwin and linux only, got ${nodePlatform}.`,
  );
}

export function createDesktopReleaseConfig(channel) {
  if (channel === "nightly") {
    return {
      appId: "app.tendo.desktop.nightly",
      applicationName: "Tendo Nightly",
      artifactName: "tendo-nightly-${version}-${arch}.${ext}",
      iconFileName: "icon-nightly.png",
      // The Linux binary name must differ from stable so both channels can be
      // installed at once without one shadowing the other on PATH.
      linuxExecutableName: "tendo-nightly",
      macIconPath: "assets/icon-nightly.icns",
      releaseTag: "desktop-nightly",
      updateMetadataFileNames: {
        linux: "nightly-linux.yml",
        macos: "nightly-mac.yml",
      },
    };
  }

  return {
    appId: "app.tendo.desktop",
    applicationName: "Tendo",
    artifactName: "${productName}-${version}-${arch}.${ext}",
    iconFileName: "icon.png",
    linuxExecutableName: "tendo",
    macIconPath: "assets/icon.icns",
    releaseTag: "desktop-latest",
    updateMetadataFileNames: {
      linux: "latest-linux.yml",
      macos: "latest-mac.yml",
    },
  };
}

// Tendo ships its own desktop builds, so the auto-update feed has to point at
// this fork's releases. Left at the upstream repo, an installed Tendo would
// update itself into bb — a different product wearing our icon.
// Override with TENDO_UPDATE_REPO ("owner/name") when building from elsewhere.
export function createDesktopUpdateReleaseBaseUrl(releaseTag) {
  const repo = process.env.TENDO_UPDATE_REPO ?? "yegor-korobeynikov/bb";
  return `https://github.com/${repo}/releases/download/${releaseTag}/`;
}
