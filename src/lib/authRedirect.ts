const CANONICAL_APP_ORIGIN = "https://okempreendimentos.ddns.net:9090";

export function getAuthRedirectUrl(path: string) {
  return new URL(path, CANONICAL_APP_ORIGIN).toString();
}

export function isPasswordRecoveryFlow() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    searchParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery"
  );
}

export function getResetPasswordRouteWithTokens() {
  return `/reset-password${window.location.search}${window.location.hash}`;
}